import { useEffect, useRef, type RefObject } from "react";
import type Lenis from "lenis";

/**
 * One place that knows about the project's single Lenis instance.
 *
 * `App.tsx` creates Lenis inside a `useEffect` and used to keep it in a local
 * ref, which meant nothing outside `App.tsx` could reach it. Every overlay in
 * the app (filter drawer, cart drawer, nav drawer) therefore fell back to
 * `document.body.style.overflow = "hidden"`, which does NOT stop this site
 * scrolling: Lenis drives `window`/`documentElement`, and a viewport whose
 * overflow only became `hidden` still accepts every programmatic `scrollTo`
 * Lenis issues. Registering the instance here gives the overlays the
 * mechanism that actually matches how scrolling is wired.
 */
let lenisInstance: Lenis | null = null;

export function registerLenis(instance: Lenis | null): void {
  lenisInstance = instance;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}

/**
 * Reference-counted background scroll lock.
 *
 * Two mechanisms, because each covers a path the other misses:
 *   - `lenis.stop()` is the only thing that reliably stops this site from
 *     scrolling on wheel/touch: Lenis's own gesture handler intercepts the
 *     event, `preventDefault()`s it and returns before it ever calls
 *     `scrollTo`. This is what the `overflow: hidden` line was pretending to
 *     do.
 *   - `overflow: hidden` on `documentElement` (NOT `body`) removes the
 *     scrollbar and blocks the native paths Lenis does not own: keyboard
 *     paging (Space/PageDown/arrows), scrollbar dragging, and any native
 *     touch scroll on the root. Programmatic `scrollTo` still works, so
 *     Lenis keeps animating and the unlock does not fight it.
 *
 * `documentElement` is deliberate: `html`'s overflow is what propagates to the
 * viewport, whereas a `body` overflow only propagates when `html` is `visible`
 * — which it is here.
 *
 * THE OFFSET IS THE TRAP. Toggling `overflow: hidden` on the root makes the
 * viewport non-scrollable, and the browser clamps the scroll offset to 0 while
 * it is. Lenis's native-scroll handler sees a scroll it did not cause, adopts
 * the clamped 0 as its `actualScroll`, and from then on the page resumes at the
 * top — so opening an overlay snapped the page to the top even though nothing
 * scrolled. The offset is therefore read BEFORE the toggle and re-asserted
 * immediately after it, through Lenis so its internal state agrees. Restoring
 * the DOM offset alone would not help: Lenis would still be at 0 and would
 * snap the page back on the next gesture.
 */
let lockCount = 0;
let restoreOverflow: (() => void) | null = null;

export function lockBackgroundScroll(): () => void {
  if (lockCount === 0) {
    const root = document.documentElement;
    const lenis = lenisInstance;
    const previous = root.style.overflow;
    const offset = lenis ? lenis.animatedScroll : window.scrollY;

    restoreOverflow = () => {
      if (previous) root.style.overflow = previous;
      else root.style.removeProperty("overflow");
    };

    root.style.overflow = "hidden";
    lenis?.stop();

    // Re-assert in the same tick, before the browser can observe the clamp.
    // `force` is required: Lenis ignores scroll requests while stopped.
    if (offset > 0) {
      if (lenis) lenis.scrollTo(offset, { immediate: true, force: true });
      else window.scrollTo(0, offset);
    }
  }
  lockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount > 0) return;
    restoreOverflow?.();
    restoreOverflow = null;
    lenisInstance?.start();
  };
}

/**
 * Everything tabbable inside `root`, in DOM order.
 *
 * Hidden and `disabled` nodes are dropped by the selector plus the size check:
 * `display: none` gives `offsetWidth === 0`, while a visually hidden control
 * (the drawer's `sr-only` radios/checkboxes) keeps a 1px box and stays in the
 * list, which is correct — those inputs are real, focusable a11y targets.
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      el.getAttribute("aria-hidden") !== "true" &&
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement),
  );
}

/**
 * Make every part of the document that is NOT an ancestor of `panel` inert.
 *
 * Walking up from the panel and inactivating each level's other children gives
 * the same result as `inert` on `#root` plus a portalled dialog, without
 * portalling: the drawers already live inside `#root`, so a portal would move
 * them out of the tree they animate within and risk `AnimatePresence` losing
 * the exit transition. The walk stops one level below `document.body` so the
 * runtime's own `<script>` tags are never touched.
 *
 * Nodes that were already inert belong to another overlay and are left alone,
 * so two overlays closing in either order cannot un-inert each other.
 */
function makeRestInert(panel: HTMLElement): () => void {
  const added: HTMLElement[] = [];
  let node: HTMLElement | null = panel;

  while (node && node.parentElement && node.parentElement !== document.body) {
    const parent: HTMLElement = node.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || !(sibling instanceof HTMLElement)) continue;
      if (sibling.hasAttribute("inert")) continue;
      sibling.setAttribute("inert", "");
      added.push(sibling);
    }
    node = parent;
  }

  return () => {
    for (const element of added) element.removeAttribute("inert");
  };
}

export interface OverlayLockOptions {
  /** The overlay is showing. */
  active: boolean;
  /** Called on `Escape`. */
  onRequestClose: () => void;
  /** The scrollable panel. Must be focusable itself (`tabIndex={-1}`). */
  panelRef: RefObject<HTMLElement | null>;
  /** Overrides where focus lands on open. Defaults to the panel. */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Full-screen overlay behaviour, in one hook: background scroll lock, a
 * `Tab`/`Shift+Tab` trap, `Escape` to close, focus restored to whatever opened
 * it, and the rest of the document `inert` so assistive tech cannot walk out
 * from behind the overlay.
 *
 * Focus is returned to the element that had it BEFORE opening, captured on the
 * same tick the overlay appears — not "the first button we can find" — so a
 * keyboard user who opened the drawer with the toolbar trigger gets the
 * toolbar trigger back instead of being dropped at the top of the document.
 */
export function useOverlayLock({
  active,
  onRequestClose,
  panelRef,
  initialFocusRef,
}: OverlayLockOptions): void {
  // Held in a ref so the keydown/focusin listeners below can stay on the stable
  // `[]` identity instead of re-binding on every parent render. Assigned in an
  // effect, not during render: writing a ref while rendering is a side effect,
  // and React 19 runs render twice in StrictMode, so the assignment would happen
  // on a render that may be thrown away.
  const closeRef = useRef(onRequestClose);
  useEffect(() => {
    closeRef.current = onRequestClose;
  });

  useEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    if (!panel) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const releaseScroll = lockBackgroundScroll();
    const releaseInert = makeRestInert(panel);

    const focusables = () => focusableWithin(panel);
    (initialFocusRef?.current ?? panel).focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;

      if (!(current instanceof HTMLElement) || !panel.contains(current)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
        return;
      }

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    // Catches focus the trap did not route: a programmatic `.focus()` on a
    // background element, or the browser restoring focus after the trigger was
    // re-rendered. Pulled straight back to the first control.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof Node && panel.contains(target)) return;
      const items = focusables();
      (items[0] ?? panel).focus({ preventScroll: true });
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);
      releaseInert();
      releaseScroll();
      if (previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, panelRef, initialFocusRef]);
}

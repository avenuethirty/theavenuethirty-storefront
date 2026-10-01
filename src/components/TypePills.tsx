import React from "react";
import { Link } from "react-router-dom";
import { getCategoryLabel } from "../utils/category";
import { categoryPath, typePath } from "../utils/productSlug";
import type { TypeEntry } from "../utils/typeSections";

/**
 * The category's types as a single, horizontally scrollable pill row.
 *
 * Extracted from the pill branch of `TypeSection` so the homepage section and
 * the PLP render byte-identical pills. Presentational only: no `<section>`, no
 * `<h2>`, no page chrome, because the PLP drops this under its own `<h1>` and
 * supplying a second heading would give the page two `<h1>`s.
 *
 * These are navigation links, not tabs: each pill is a real URL that the router
 * resolves, so the row is a labelled `<nav>` and never a `role="tablist"`.
 */

interface TypePillsProps {
  /** Category slug the row belongs to — the scope of both the All and type links. */
  category: string;
  types: TypeEntry[];
  /** Type slug the current route is scoped to. Omitted on a category listing. */
  activeSlug?: string;
  /** Overrides the All pill's label. Defaults to `All <category label>`. */
  allLabel?: string;
  /**
   * The homepage centres the row under its centred `<h2>`; the PLP's `<h1>` is
   * left aligned, so the PLP needs `justify-start`. Selected as two whole literal
   * strings because Tailwind v4 scans source for static class text — a
   * template-interpolated `"justify-" + align` would never be generated.
   */
  centered?: boolean;
}

/**
 * One line, never a wrapped block.
 *
 * `flex-nowrap` plus `overflow-x-auto` covers both cases with a single rule: when
 * the pills fit the container nothing scrolls, and when they do not the row
 * becomes a horizontal scroller. Each pill carries `shrink-0`, which is what
 * actually stops the compression — without it the flex children shrink to fit
 * and the labels wrap inside themselves, and `whitespace-nowrap` alone only
 * stops the break without stopping the shrink.
 *
 * `data-lenis-prevent` is required, not decorative: Lenis is initialised
 * app-wide and would otherwise swallow the wheel and touch gestures that drive
 * this container. `overscroll-x-contain` stops a swipe that runs off the end
 * from chaining out to the page.
 *
 * `overflow-y-hidden` is stated explicitly even though the row is one line tall.
 * Setting only `overflow-x` makes `overflow-y: visible` compute as `auto`, which
 * silently turns the element into a vertical scroll container too.
 *
 * `no-scrollbar` is the utility defined in `src/index.css`. `scrollbar-none` is
 * NOT defined anywhere in this repo — a row that uses it keeps its native
 * scrollbar. A partially visible pill at the edge is the affordance, so hiding
 * the bar costs nothing.
 *
 * `safe center` on the centred variant is load-bearing, not cosmetic. With a
 * plain `justify-center`, a row wider than its box overflows equally on both
 * sides and the leading overflow has no scrollable extent, so it can never be
 * scrolled to. `safe` falls back to `start` in exactly that case.
 */
const ROW_CENTERED =
  "flex flex-nowrap items-center gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain no-scrollbar justify-[safe_center]";
const ROW_START =
  "flex flex-nowrap items-center gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain no-scrollbar justify-start";

/**
 * Verbatim from the homepage pill row, plus the two utilities the single-line
 * layout needs. `group` is gone along with the arrow: it only existed for the
 * icon's `group-hover:opacity-100`.
 *
 * `transition-colors` replaces `transition-all`, which was animating layout
 * properties on a row that no longer changes size.
 */
const PILL_BASE =
  "inline-flex shrink-0 items-center whitespace-nowrap border border-neutral-300 rounded-full px-5 py-2.5 text-xs font-medium text-[#1A1A1A] transition-colors hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white";

/**
 * The active pill re-states the pill's own hover-inverse treatment rather than
 * adding a colour: `bg-[#1A1A1A] text-white border-[#1A1A1A]` are the exact
 * tokens the hover state already uses, so "you are here" reads as the same
 * button the visitor has hovered. `text-[#1A1A1A]` is dropped rather than
 * overridden — two `text-*` colour utilities in one class attribute resolve by
 * stylesheet order, not attribute order, and that would be a coin flip.
 */
const PILL_ACTIVE =
  "inline-flex shrink-0 items-center whitespace-nowrap border border-[#1A1A1A] rounded-full px-5 py-2.5 text-xs font-medium bg-[#1A1A1A] text-white transition-colors hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white";

export const TypePills: React.FC<TypePillsProps> = ({
  category,
  types,
  activeSlug,
  allLabel,
  centered = false,
}) => {
  if (types.length === 0) return null;

  const rowClassName = centered ? ROW_CENTERED : ROW_START;

  return (
    <nav aria-label="Product types">
      <div className={rowClassName} data-lenis-prevent>
        {/* The way out of a type-scoped listing, so it appears only when there
            is a type to be out of. */}
        {activeSlug && (
          <Link to={categoryPath(category)} className={PILL_BASE}>
            {allLabel || `All ${getCategoryLabel(category)}`}
          </Link>
        )}

        {types.map((type) => {
          const isActive = type.slug === activeSlug;
          return (
            <Link
              key={type.slug}
              to={typePath(category, type.slug)}
              aria-current={isActive ? "page" : undefined}
              className={isActive ? PILL_ACTIVE : PILL_BASE}
            >
              {type.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

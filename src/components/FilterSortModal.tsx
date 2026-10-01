import React, { useMemo, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Product } from "../types";
import { SHOP_CONFIG } from "../config/shop";
import {
  FILTER_GROUPS,
  FilterContext,
  FilterGroupDef,
  FilterSurface,
  ResolvedGroup,
  resolveFilterGroups,
} from "../config/filters";
import {
  GROUP_BY_PARAM,
  applyFacetFilters,
  parseFilterParams,
  serializeGroupValue,
} from "../hooks/useFilteredProducts";
import { getLenis, useOverlayLock } from "../utils/overlay";

interface FilterSortModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  /** The already-narrowed product set for the current page scope, BEFORE query filters. */
  products: Product[];
  /** Current scope, used for group visibility. */
  context: FilterContext;
  /** Result count after filters, shown in the footer. */
  resultCount: number;
}

/**
 * Filter removal is uniformly a VALUE-level, in-place query write, on every
 * surface and for every param — including `type`.
 *
 * `type` used to be the exception: on a PLP the type is also a PATH segment
 * (`/product/jewellery/earrings`), so removing it meant navigating to the
 * category route, which needed `typeFilterPath` from the page that owns the
 * route. That is gone, because it was wrong for the only thing a type pill can
 * ever be:
 *
 *   A pill is rendered from `filters`, which is built by `parseFilterParams`
 *   reading QUERY PARAMS. The path segment never produces a pill — it is
 *   expressed by the h1 and the breadcrumbs. And on a type PLP the modal is
 *   handed `typeProducts` (already narrowed to the path type), so the parser
 *   drops any `?type=` naming a different type and at worst leaves the path
 *   type itself, which the selection already implies. Verified across
 *   `?type=tote-bag`, `?type=backpack` and `?type=tote-bag,backpack` on
 *   `/product/bags/backpack`.
 *
 * So every clickable type pill is a query-param selection, and clearing one
 * value while keeping the others is the only correct answer. Navigating away
 * dropped the whole selection — the one thing "remove this filter" must never
 * do — and, on a redundant `?type=<path type>`, navigated off the type page for
 * a param that needed no more than deleting.
 *
 * The page still owns the route for the things that genuinely need it (the
 * `typeFilterPath`-free props below), and nothing here derives a path from
 * `context.category`, which holds a CATEGORY on a PLP and a COLLECTION slug on
 * a collection page — the mix-up that used to dead-end every collection page.
 */
type FilterSortModalProps = FilterSortModalBaseProps & {
  surface: FilterSurface;
};

interface AppliedFilter {
  param: string;
  value: string;
  label: string;
}

/** Stable empty selection, so a group with no filter never re-renders the grid. */
const NO_SELECTION: string[] = [];

/**
 * Fallback label for a value the resolved group no longer offers.
 *
 * Unreachable for `set` groups now that `parseFilterParams` drops values absent
 * from the scoped catalogue: a value can only appear in `filters` if the same
 * rows produced the group, so a set group always carries a label for it. Kept
 * for the `minDistinct` case, where a whole group can be dropped while its URL
 * values remain legal.
 */
function fallbackLabel(def: FilterGroupDef, value: string): string {
  if (def.compare === "range") {
    const step = Number(value);
    return Number.isFinite(step) ? `Under Rs. ${step.toLocaleString("en-PK")}` : value;
  }
  return value;
}

/**
 * A group whose options vanished from the exclusion-narrowed set is reported
 * with zero counts rather than dropped, so the block does not disappear while
 * the operator is changing another facet in the same drawer.
 */
function withZeroCounts(group: ResolvedGroup): ResolvedGroup {
  return { ...group, options: group.options.map((option) => ({ ...option, count: 0 })) };
}

const SectionHeading: React.FC<{ id: string; label: string }> = ({ id, label }) => (
  <h4
    id={id}
    className="text-[11px] font-semibold uppercase tracking-widest text-[#1A1A1A]/50 font-sans mb-3"
  >
    {label}
  </h4>
);

export const FilterSortModal: React.FC<FilterSortModalProps> = ({
  isOpen,
  onClose,
  products,
  context,
  surface,
  resultCount,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * The panel is the focus container: `useOverlayLock` needs a ref to move
   * focus into, trap `Tab` inside and read the focusable set from.
   */
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll lock, focus trap, `Escape`, focus restore and background inert in
   * one place. This replaces a local `document.body.style.overflow = "hidden"`
   * that did nothing: Lenis drives `window`/`documentElement`, and a body
   * overflow cannot reach it, so the wheel kept scrolling the page behind the
   * drawer while the modal claimed to be locked.
   */
  useOverlayLock({ active: isOpen, onRequestClose: onClose, panelRef });

  const { category, typeSlug } = context;

  // Unnarrowed resolve: drives which groups exist at all and supplies the
  // labels for applied filters, including options whose count has fallen to 0.
  const allGroups = useMemo(
    () => resolveFilterGroups(products, { category, typeSlug }, surface),
    [products, category, typeSlug, surface],
  );

  // Parsed against the same scoped products the groups resolve from, so the
  // facet counts and the applied-filter pills describe one identical state.
  const filterState = useMemo(
    () => parseFilterParams(searchParams, products),
    [searchParams, products],
  );
  const { filters } = filterState;
  // The PARSED sort, never the raw param: `?sort=bogus` is normalised to
  // `recommended` by the parser, so reading the raw string would leave every
  // radio unchecked while the grid silently sorted by Relevance.
  const currentSort = filterState.sort;

  /**
   * Display groups: the FULL option list for the scope, with each count
   * recomputed against the set narrowed by every OTHER active facet.
   *
   * Both halves are load-bearing. Excluding the group's own facet stops a
   * selected option's count collapsing to just its own value. Keeping the full
   * list is the registry's invariant 2: a narrowed re-resolve would delete every
   * option the other facets happen to exclude, so narrowing by price would
   * collapse Product Type to one row and strand the operator who wants to switch
   * type without clearing the price. Those options stay visible and disabled.
   */
  const facetGroups = useMemo(() => {
    return allGroups.map((group) => {
      const narrowed = applyFacetFilters(products, filters, group.param);
      const counted = resolveFilterGroups(narrowed, { category, typeSlug }, surface).find(
        (candidate) => candidate.param === group.param,
      );
      if (!counted) return withZeroCounts(group);

      const countsByValue = new Map(counted.options.map((option) => [option.value, option.count]));
      return {
        ...group,
        options: group.options.map((option) => ({
          ...option,
          count: countsByValue.get(option.value) ?? 0,
        })),
      };
    });
  }, [allGroups, products, filters, category, typeSlug, surface]);

  /**
   * Applied filters are walked over the REGISTRY, not the resolved groups: a
   * group can be absent from this scope (a surface gate, or `minDistinct`)
   * while the URL still carries a value that is legal against the catalogue, and
   * that value is still a selection the operator must be able to remove.
   */
  const appliedFilters = useMemo<AppliedFilter[]>(() => {
    const applied: AppliedFilter[] = [];
    for (const def of FILTER_GROUPS) {
      const param = def.param ?? def.key;
      const label = allGroups.find((group) => group.param === param);
      // Walk the PARSED selection, not the raw param: a value the parser
      // rejected is not an applied filter, so it gets no pill. The label comes
      // from the same option object the drawer renders, which is what keeps a
      // pill and its option reading identically on both surfaces.
      for (const value of filters[param] ?? NO_SELECTION) {
        applied.push({
          param,
          value,
          label:
            label?.options.find((option) => option.value === value)?.label ??
            fallbackLabel(def, value),
        });
      }
    }
    return applied;
  }, [allGroups, filters]);

  /**
   * Hold the scroll offset across a filter write.
   *
   * `App.tsx` resets to the top only on `pathname` and `page`, so a filter
   * change is contractually supposed to leave the operator where they were —
   * but a facet can also re-lay the grid out underneath them, and the browser
   * only clamps the offset as a side effect of the document shrinking. Doing
   * it explicitly means the offset is restored through Lenis (so its internal
   * `animatedScroll` agrees instead of fighting it on the next gesture) and
   * that the new document height is respected: a filter that leaves 1 product
   * cannot leave the operator 900px past the end of the page.
   */
  const restoreScrollAfter = (target: number) => {
    const lenis = getLenis();
    requestAnimationFrame(() => {
      const max = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const clamped = Math.max(0, Math.min(target, max));
      if (lenis) lenis.scrollTo(clamped, { immediate: true });
      else window.scrollTo(0, clamped);
    });
  };

  /**
   * THE ONLY PLACE THE MODAL WRITES THE URL.
   *
   * Callers hand over a complete `URLSearchParams`; this deletes `page` on
   * every write, so no mutation can forget to reset pagination. `{ replace:
   * true }` keeps a filter change from stacking a history entry per click while
   * staying back-button safe.
   *
   * The scroll offset is sampled BEFORE the write, because by the time the
   * grid has re-rendered the original position may no longer be reachable.
   */
  const applyFilters = (next: URLSearchParams) => {
    next.delete("page");
    const lenis = getLenis();
    const from = lenis ? lenis.animatedScroll : window.scrollY;
    setSearchParams(next, { replace: true });
    if (from > 0) restoreScrollAfter(from);
  };

  const nextParams = () => new URLSearchParams(searchParams);

  const setGroupValues = (def: FilterGroupDef, values: string[]) => {
    const next = nextParams();
    if (values.length === 0) {
      next.delete(def.param ?? def.key);
    } else {
      next.set(def.param ?? def.key, serializeGroupValue(def, values));
    }
    applyFilters(next);
  };

  const toggleOption = (group: ResolvedGroup, value: string) => {
    const def = GROUP_BY_PARAM.get(group.param);
    if (!def) return;

    const current = filters[group.param] ?? NO_SELECTION;

    if (def.compare === "range") {
      // Cumulative buckets are single-select: re-picking the active step clears.
      setGroupValues(def, current.length === 1 && current[0] === value ? [] : [value]);
      return;
    }

    setGroupValues(
      def,
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value],
    );
  };

  const selectSort = (value: string) => {
    const next = nextParams();
    next.set("sort", value);
    applyFilters(next);
  };

  /** Clears every filter param but keeps `sort` — sorting is not a filter. */
  const clearAllFilters = () => {
    const next = nextParams();
    for (const def of FILTER_GROUPS) {
      next.delete(def.param ?? def.key);
    }
    applyFilters(next);
  };

  /**
   * Remove exactly the one value the operator clicked, for every param.
   *
   * `type` is not special-cased (see the prop contract). It used to be, and
   * because the type pill deleted the whole `type` param, the first working
   * multi-select made "remove Tote Bag" also throw away Crossbody Bag, Handbag
   * and everything else — the one outcome that is never what the label promised.
   * Every other param has always been value-level; this makes `type` one of
   * them instead of a second, differently-wrong rule.
   */
  const removeAppliedFilter = (applied: AppliedFilter) => {
    const def = GROUP_BY_PARAM.get(applied.param);
    if (!def) return;

    const current = filters[applied.param] ?? NO_SELECTION;
    setGroupValues(
      def,
      current.filter((entry) => entry !== applied.value),
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative w-full max-w-md sm:max-w-lg bg-white text-[#111110] h-full shadow-2xl flex flex-col focus:outline-none"
            onClick={(e) => e.stopPropagation()}
            // The dialog role belongs on the PANEL, not the backdrop wrapper.
            // On the wrapper it would make the dimmed backdrop part of the
            // dialog's accessible content, so a screen reader would announce
            // the overlay as the dialog's contents instead of the filter UI.
            role="dialog"
            aria-modal="true"
            aria-label="Filter and sort products"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between bg-[#FAFAF9]">
              <div className="flex items-center gap-4">
                <h3 className="font-medium text-lg text-[#1A1A1A]">Filter &amp; Sort</h3>
                {/* Clear All only exists when a filter is active, so its presence
                    doubles as the active-count indicator. */}
                {appliedFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[10px] font-sans uppercase tracking-widest underline text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                // 44x44 rather than the 32x32 the cart drawer uses: this is the
                // primary dismissal control on a full-screen mobile overlay,
                // and 44px is the WCAG 2.2 AA target-size floor. Growing the
                // button rather than faking a larger hit area keeps the
                // background edge honest — a transparent button with a
                // pseudo-element overlay would be reachable but would not look
                // pressed.
                className="w-11 h-11 rounded-full bg-white hover:bg-neutral-200 flex items-center justify-center text-[#1A1A1A] border border-black/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body
                `relative` is LOAD-BEARING, not decoration. Every control in here
                is a real input hidden with `sr-only` (`position: absolute`), and
                `sr-only` boxes are placed at their STATIC position against their
                CONTAINING BLOCK. With this scroller `position: static`, the
                containing block resolved past it to the panel above, which does
                not scroll — so every input stayed pinned to the panel while its
                own label row scrolled away inside this box.

                Measured on /product/bags: at `scrollTop: 0` an option's input sat
                18px below its label (the flex `gap`); at `scrollTop: 300` that gap
                had grown to 318px — the input displaced by exactly the scroll
                offset. Consequence: only the first two of sixteen options were
                reachable without scrolling, clicking a lower option hit the
                backdrop (which is `onClick={onClose}`) or nothing at all, and the
                drawer scrolled itself chasing a focused input that was no longer
                anywhere near its row — which is the reported "section collapses /
                slides out of view, ~10% still showing".

                Making THIS element the containing block puts each input's static
                position in the scrolled content, so input and label move together
                (gap stays 18px at any scroll offset). It also fixes the scroll
                reachability of every other `sr-only` control in the drawer: the
                sort radios, every facet checkbox, and the two pills' host rows.

                Sequential picks looked fine only because options 1-2 are the ones
                already on screen, so nothing had to scroll. Any choice needing a
                scroll tripped it — hence "1st, 5th, 10th breaks it, 1st, 2nd,
                3rd doesn't". */}
            <div
              className="relative flex-1 overflow-y-auto px-6 py-5 space-y-8"
              data-lenis-prevent
            >
              {/* 1. Applied Filters */}
              {appliedFilters.length > 0 && (
                <section aria-labelledby="filter-applied-heading">
                  <SectionHeading id="filter-applied-heading" label="Applied Filters" />
                  <div className="flex flex-wrap gap-2">
                    {appliedFilters.map((applied) => (
                      <span
                        key={`${applied.param}:${applied.value}`}
                        className="inline-flex items-center text-xs font-sans text-[#1A1A1A] bg-[#EFEFEF] rounded-full px-3 py-1"
                      >
                        {/* Every pill is a button and every one is value-level, so
                            a pill always means "remove this one filter and keep
                            the rest" — the literal text of its aria-label. The
                            type pill used to be a <Link> to the category route,
                            which both dropped the operator's other types and,
                            on a redundant `?type=<path type>`, navigated off
                            the type page to delete a single query param. */}
                        <button
                          type="button"
                          onClick={() => removeAppliedFilter(applied)}
                          aria-label={`Remove ${applied.label} filter`}
                          className="inline-flex items-center gap-1.5 hover:text-[#1A1A1A]/50 transition-colors cursor-pointer"
                        >
                          <span>{applied.label}</span>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* 2. Sort By */}
              <section aria-labelledby="filter-sort-heading">
                <SectionHeading id="filter-sort-heading" label="Sort By" />
                <div role="radiogroup" aria-labelledby="filter-sort-heading" className="space-y-1">
                  {SHOP_CONFIG.plp.sortOptions.map((option) => {
                    const selected = currentSort === option.value;
                    return (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-[#FAFAF9] transition-colors"
                      >
                        <input
                          type="radio"
                          name="filter-sort"
                          value={option.value}
                          checked={selected}
                          onChange={() => selectSort(option.value)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            selected ? "border-[#111110]" : "border-[#1A1A1A]/25"
                          }`}
                        >
                          {selected && <span className="w-2 h-2 rounded-full bg-[#111110]" />}
                        </span>
                        <span className="text-sm font-sans text-[#1A1A1A]">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* 3. Filter Groups, registry order preserved by the resolver. */}
              {facetGroups.map((group) => {
                const def = GROUP_BY_PARAM.get(group.param);
                if (!def) return null;

                const isRange = def.compare === "range";
                const selectedValues = filters[group.param] ?? NO_SELECTION;

                return (
                  <section key={group.param} aria-labelledby={`filter-group-${group.param}`}>
                    <SectionHeading id={`filter-group-${group.param}`} label={group.label} />
                    <div className="space-y-1">
                      {group.options.map((option) => {
                        const selected = selectedValues.includes(option.value);
                        // A zero-count option stays visible but is only clickable
                        // when it is already selected, so the operator can undo.
                        const disabled = option.count === 0 && !selected;

                        return (
                          <label
                            key={option.value}
                            className={`flex items-center gap-3 px-2 py-2 transition-colors ${
                              disabled
                                ? "opacity-40 cursor-not-allowed"
                                : "cursor-pointer hover:bg-[#FAFAF9]"
                            }`}
                          >
                            <input
                              type={isRange ? "radio" : "checkbox"}
                              name={isRange ? `filter-${group.param}` : undefined}
                              value={option.value}
                              checked={selected}
                              disabled={disabled}
                              onChange={() => toggleOption(group, option.value)}
                              className="sr-only"
                            />
                            <span
                              aria-hidden="true"
                              className={`w-4 h-4 flex items-center justify-center border transition-colors ${
                                isRange ? "rounded-full" : "rounded-[3px]"
                              } ${
                                selected
                                  ? "bg-[#111110] border-[#111110]"
                                  : "border-[#1A1A1A]/25 bg-white"
                              }`}
                            >
                              {selected &&
                                (isRange ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                ) : (
                                  <svg
                                    viewBox="0 0 12 12"
                                    className="w-2.5 h-2.5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M2 6.5 4.6 9 10 3.2" />
                                  </svg>
                                ))}
                            </span>
                            <span className="text-sm font-sans text-[#1A1A1A]">
                              {option.label}
                            </span>
                            {option.count > 0 && (
                              <span className="ml-auto pl-3 text-xs font-sans text-[#1A1A1A]/40 tabular-nums">
                                {option.count}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-black/5 px-6 py-4 bg-white flex items-center justify-between gap-4">
              <span className="text-xs font-sans text-[#1A1A1A]/60">
                {resultCount} {resultCount === 1 ? "result" : "results"}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#111110] text-white text-xs font-semibold px-6 py-3 rounded-full hover:bg-black transition-all"
              >
                Show {resultCount} {resultCount === 1 ? "result" : "results"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

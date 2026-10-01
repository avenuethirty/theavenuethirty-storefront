import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getCategoryLabel } from "../utils/category";
import { categoryPath, typePath } from "../utils/productSlug";

interface BreadcrumbsProps {
  category: string;
  typeLabel?: string;
  typeSlug?: string;
  productName?: string;
}

/** Chevron is decorative and sits inside the crumb it precedes. */
const SEPARATOR = (
  <ChevronRight aria-hidden="true" className="w-3 h-3 shrink-0" />
);

/**
 * One line, always.
 *
 * The children used to be direct flex items of the `<nav>`, where the default
 * `flex-shrink: 1` squeezed them to fit instead of letting them overflow — so a
 * long crumb broke at every space and rendered as one word per line. Each crumb
 * is now an `<li>` with `shrink-0` and the `<ol>` carries the overflow, so the
 * row scrolls sideways rather than collapsing. This also upgrades the markup to
 * the W3C APG breadcrumb pattern, which a flat `<nav>` of links is not.
 *
 * `data-lenis-prevent` is required: Lenis is initialised app-wide and would
 * otherwise swallow the gesture that drives this scroller. `no-scrollbar` is the
 * utility defined in `src/index.css`; `scrollbar-none` is not defined anywhere.
 *
 * Separators live INSIDE the crumb they precede rather than as their own `<li>`,
 * so the visible list has exactly as many items as the `BreadcrumbList` JSON-LD
 * built in `src/server/seo.ts` — which is derived from route data, not from this
 * DOM, so nothing here needs to be mirrored in the serverless copy.
 *
 * Nothing is truncated: a long product name scrolls like everything else.
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  category,
  typeLabel,
  typeSlug,
  productName,
}) => {
  const label = getCategoryLabel(category);
  const showCategoryLink = !!(typeLabel || productName);

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol
        className="flex flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain no-scrollbar text-xs text-[#1A1A1A]/60 font-sans uppercase tracking-wider"
        data-lenis-prevent
      >
        <li className="shrink-0">
          <Link
            to="/"
            className="hover:text-[#1A1A1A] transition-colors"
            aria-label="Home"
          >
            Home
          </Link>
        </li>

        {showCategoryLink && (
          <li className="shrink-0 flex items-center gap-2">
            {SEPARATOR}
            <Link
              to={categoryPath(category)}
              className="hover:text-[#1A1A1A] transition-colors"
            >
              {label}
            </Link>
          </li>
        )}

        {typeLabel && typeSlug && productName && (
          <li className="shrink-0 flex items-center gap-2">
            {SEPARATOR}
            <Link
              to={typePath(category, typeSlug)}
              className="hover:text-[#1A1A1A] transition-colors"
            >
              {typeLabel}
            </Link>
          </li>
        )}

        {productName && (
          <li className="shrink-0 flex items-center gap-2">
            {SEPARATOR}
            <span
              className="text-[#1A1A1A] font-semibold"
              aria-current="page"
            >
              {productName}
            </span>
          </li>
        )}

        {!productName && typeLabel && typeSlug && (
          <li className="shrink-0 flex items-center gap-2">
            {SEPARATOR}
            <span
              className="text-[#1A1A1A]/90 font-semibold"
              aria-current="page"
            >
              {typeLabel}
            </span>
          </li>
        )}

        {!productName && !typeLabel && showCategoryLink && (
          <li className="shrink-0 flex items-center gap-2">
            {SEPARATOR}
            <span
              className="text-[#1A1A1A]/90 font-semibold"
              aria-current="page"
            >
              {label}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
};

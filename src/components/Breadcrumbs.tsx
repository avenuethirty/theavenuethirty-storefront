import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getCategoryLabel } from "../utils/category";

interface BreadcrumbsProps {
  category: string;
  typeLabel?: string;
  typeSlug?: string;
  productName?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  category,
  typeLabel,
  typeSlug,
  productName,
}) => {
  const label = getCategoryLabel(category);
  const showCategoryLink = !!(typeLabel || productName);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#1A1A1A]/60 font-sans uppercase tracking-wider mb-4">
      <Link
        to="/"
        className="hover:text-[#1A1A1A] transition-colors"
        aria-label="Home"
      >
        Home
      </Link>
      {showCategoryLink && (
        <>
          <ChevronRight className="w-3 h-3" />
          <Link
            to={`/product/${category}`}
            className="hover:text-[#1A1A1A] transition-colors"
          >
            {label}
          </Link>
        </>
      )}
      {typeLabel && typeSlug && (
        <>
          <ChevronRight className="w-3 h-3" />
          <Link
            to={`/product/${category}/${typeSlug}`}
            className="hover:text-[#1A1A1A] transition-colors"
          >
            {typeLabel}
          </Link>
        </>
      )}
      {productName && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A] font-semibold">{productName}</span>
        </>
      )}
      {!productName && typeLabel && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A]/90 font-semibold">{typeLabel}</span>
        </>
      )}
      {!productName && !typeLabel && showCategoryLink && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A]/90 font-semibold">{label}</span>
        </>
      )}
    </nav>
  );
};

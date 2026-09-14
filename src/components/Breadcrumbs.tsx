import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getCategoryLabel } from "../utils/category";

interface BreadcrumbsProps {
  category: string;
  typeLabel?: string;
  typeSlug?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  category,
  typeLabel,
  typeSlug,
}) => {
  const label = getCategoryLabel(category);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#1A1A1A]/60 font-sans uppercase tracking-wider mb-4">
      <Link
        to="/"
        className="hover:text-[#1A1A1A] transition-colors"
        aria-label="Home"
      >
        Home
      </Link>
      <ChevronRight className="w-3 h-3" />
      {typeLabel && typeSlug ? (
        <>
          <Link
            to={`/product/${category}`}
            className="hover:text-[#1A1A1A] transition-colors"
          >
            {label}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A]/90 font-semibold">{typeLabel}</span>
        </>
      ) : (
        <span className="text-[#1A1A1A]/90 font-semibold">{label}</span>
      )}
    </nav>
  );
};

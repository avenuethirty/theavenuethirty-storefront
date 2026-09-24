import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { SHOP_CONFIG } from "../config/shop";
import { Check, Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { SkeletonCard } from "./SkeletonCard";
import { getDiscountBadge } from "../utils/discount";
import { EmptyState } from "./EmptyState";

interface PLPGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onOpenConsultation: () => void;
  loading?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: { label: string; href: string };
}

export const PLPGrid: React.FC<PLPGridProps> = ({ products, onAddToCart, onOpenConsultation, loading = false, emptyTitle = "No products match your filters", emptySubtitle = "Try adjusting your selection.", emptyAction }) => {
  const { plp } = SHOP_CONFIG;
  const itemsPerPage = plp.itemsPerPage;
  const gridColumns = plp.gridColumns || { mobile: 2, tablet: 3, desktop: 4 };
  const gridClass = `grid-cols-${gridColumns.mobile} sm:grid-cols-${gridColumns.tablet} lg:grid-cols-${gridColumns.desktop}`;

  if (loading) {
    return (
      <div className="w-full">
        <div className={`grid ${gridClass} gap-[10px]`}>
          {Array.from({ length: itemsPerPage }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <EmptyState title={emptyTitle} subtitle={emptySubtitle} action={emptyAction} />
      </div>
    );
  }

  return <PLPGridContent products={products} onAddToCart={onAddToCart} onOpenConsultation={onOpenConsultation} gridClass={gridClass} />;
};

const PLPGridContent: React.FC<PLPGridProps & { gridClass: string }> = ({ products, onAddToCart, gridClass }) => {
  const { plp } = SHOP_CONFIG;
  const itemsPerPage = plp.itemsPerPage;
  const [searchParams, setSearchParams] = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));

  const rawPage = Number(searchParams.get("page"));
  const currentPage =
    Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= totalPages
      ? rawPage - 1
      : 0;

  useEffect(() => {
    const paramValue = searchParams.get("page");
    if (paramValue === null) return;
    const n = Number(paramValue);
    if (!Number.isInteger(n) || n < 1 || n > totalPages) {
      const next = new URLSearchParams(searchParams);
      next.delete("page");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, totalPages, setSearchParams]);

  const paginate = (page1: number) => {
    const next = new URLSearchParams(searchParams);
    if (page1 <= 1) next.delete("page");
    else next.set("page", String(page1));
    setSearchParams(next, { replace: true });
  };

  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  const handleAdd = (product: Product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  const paginatedProducts = products.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="w-full">
      <div className={`grid ${gridClass} gap-[10px]`}>
        {paginatedProducts.map((product) => {
          const isAdded = addedProductId === product.id;
          const discountBadge = getDiscountBadge(product);

          return (
            <div
              key={product.id}
              className="group flex flex-col cursor-pointer"
              onClick={() => handleAdd(product)}
              onMouseEnter={() => setHoveredProductId(product.id)}
              onMouseLeave={() => setHoveredProductId(null)}
            >
              <div className="relative aspect-square w-full bg-[#EFEFEF] overflow-hidden flex items-center justify-center p-0 mb-4 transition-colors group-hover:bg-[#E8E8E8]">
                <img
                  src={hoveredProductId === product.id && product.imageUrl2 ? product.imageUrl2 : product.imageUrl}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-end justify-center p-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdd(product);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 w-full py-2.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-[10px] font-sans font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Quick Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col text-left">
                <h3 className="text-xs font-sans font-semibold tracking-wider text-[#1A1A1A] uppercase leading-tight">
                  {product.name}
                </h3>
                <span className="text-xs font-sans text-[#666666] tracking-wider uppercase mt-1">
                  {product.originalPrice ? (
                    <>
                      <span className="line-through opacity-70">
                        {SHOP_CONFIG.localization.currencySymbol}
                        {product.originalPrice.toFixed(2)}
                      </span>
                      <span className="ml-2 font-semibold text-[#1A1A1A]">
                        {SHOP_CONFIG.localization.currencySymbol}
                        {product.priceMonthly.toFixed(2)}
                      </span>
                      {discountBadge && (
                        <span className="ml-2 font-semibold text-red-600">{discountBadge}</span>
                      )}
                    </>
                  ) : (
                    <>
                      {SHOP_CONFIG.localization.currencySymbol}
                      {product.priceMonthly.toFixed(2)}
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 mt-12 mb-8">
          <button
            onClick={() => paginate(currentPage)}
            disabled={currentPage === 0}
            className={`text-xs font-sans uppercase tracking-widest transition-colors cursor-pointer ${
              currentPage === 0
                ? "text-[#1A1A1A]/30 cursor-not-allowed"
                : "text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
            }`}
          >
            Previous
          </button>
          <span className="text-xs font-sans text-[#1A1A1A]/60">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => paginate(currentPage + 2)}
            disabled={currentPage === totalPages - 1}
            className={`text-xs font-sans uppercase tracking-widest transition-colors cursor-pointer ${
              currentPage === totalPages - 1
                ? "text-[#1A1A1A]/30 cursor-not-allowed"
                : "text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

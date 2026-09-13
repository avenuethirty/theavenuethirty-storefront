import React, { useState } from 'react';
import { Product } from '../types';
import { SHOP_CONFIG } from '../config/shop';
import { Check, Plus } from 'lucide-react';

interface ProductRailProps {
  id?: string;
  title: string;
  subtitle?: string;
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const ITEMS_PER_PAGE = 4;

export const ProductRail: React.FC<ProductRailProps> = ({ id, title, subtitle, products, onAddToCart }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  if (!products || products.length === 0) return null;

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  const displayedProducts = products.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handleNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrev = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleAdd = (product: Product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  return (
    <section id={id} className="py-16 md:py-24 bg-[#FAFAF9] text-[#1A1A1A] w-full">
      <div className="w-full px-[10px]">

        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-[#1A1A1A] font-sans">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-sm sm:text-base text-[#5E5E5E] max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Navigation Controls (PREVIOUS / NEXT top right) */}
        <div className="flex items-center justify-end gap-6 mb-6">
          <button
            onClick={handlePrev}
            className="text-xs tracking-widest font-sans uppercase text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors cursor-pointer select-none"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="text-xs tracking-widest font-sans uppercase text-[#1A1A1A] font-semibold hover:opacity-70 transition-opacity cursor-pointer select-none"
          >
            Next
          </button>
        </div>

        {/* Product Cards 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[10px]">
          {displayedProducts.map((product) => {
            const isAdded = addedProductId === product.id;

            return (
              <div
                key={product.id}
                className="group flex flex-col cursor-pointer"
                onClick={() => handleAdd(product)}
              >
                {/* Product Image Studio Container (1:1 scale) */}
                <div className="relative aspect-square w-full bg-[#EFEFEF] overflow-hidden flex items-center justify-center p-0 mb-4 transition-colors group-hover:bg-[#E8E8E8]">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Subtle Action Overlay on hover */}
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

                {/* Product Meta below container (Title + Price) */}
                <div className="flex flex-col text-left">
                  <h3 className="text-xs font-sans font-semibold tracking-wider text-[#1A1A1A] uppercase leading-tight">
                    {product.name}
                  </h3>
                  <span className="text-xs font-sans text-[#666666] tracking-wider uppercase mt-1">
                    {product.originalPrice ? (
                      <>
                        <span className="line-through opacity-70">{SHOP_CONFIG.localization.currencySymbol}{product.originalPrice.toFixed(2)}</span>
                        <span className="ml-2 font-semibold text-[#1A1A1A]">{SHOP_CONFIG.localization.currencySymbol}{product.priceMonthly.toFixed(2)}</span>
                      </>
                    ) : (
                      <>{SHOP_CONFIG.localization.currencySymbol}{product.priceMonthly.toFixed(2)}</>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

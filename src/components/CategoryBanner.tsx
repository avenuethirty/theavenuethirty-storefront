import React from "react";
import { Link } from "react-router-dom";
import { SHOP_CONFIG } from "../config/shop";
import { motion } from "motion/react";
import { Product } from "../types";
import { getCollectionBySlug, matchCollection } from "../utils/collections";

export const CategoryBanner: React.FC<{ category: string; products: Product[] }> = ({ category, products }) => {
  const cat = SHOP_CONFIG.categories.find((c) => c.slug === category);
  if (!cat) return null;

  const hasProducts = products.some((p) => p.category === category);
  if (!hasProducts) return null;

  return (
    <section className="py-8 md:py-12 w-full">
      <div className="max-w-7xl mx-auto px-[10px]">
        <Link to={`/product/${cat.slug}`} className="block relative rounded-none overflow-hidden group aspect-[21/9]">
          {cat.image ? (
            <img
              src={cat.image}
              alt={cat.name}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center rounded-none transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-[#1A1A1A]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="relative z-10 flex items-center h-full p-8 sm:p-12">
            <div>
              <h3 className="text-2xl sm:text-4xl font-light tracking-tight text-white font-sans">
                {cat.name}
              </h3>
              <p className="mt-2 text-sm text-neutral-200 font-light">
                Shop the collection
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { SHOP_CONFIG } from '../config/shop';
import { Link } from 'react-router-dom';

interface CategoryCardsSectionProps {
  products: Product[];
}

// Desktop column classes for the configurable grid (SHOP_CONFIG.categoryGrid.columns)
const COLUMN_CLASSES: Record<number, string> = {
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
  8: 'lg:grid-cols-8',
};

export const CategoryCardsSection: React.FC<CategoryCardsSectionProps> = ({ products }) => {
  const counts: Record<string, number> = {};
  const coverImage: Record<string, string> = {};

  for (const product of products) {
    counts[product.category] = (counts[product.category] || 0) + 1;
    if (!coverImage[product.category] && product.imageUrl) {
      coverImage[product.category] = product.imageUrl;
    }
  }

  const columns = SHOP_CONFIG.categoryGrid.columns;
  const columnClass = COLUMN_CLASSES[columns] || COLUMN_CLASSES[4];

  return (
    <section id="categories" className="py-20 sm:py-28 w-full text-[#1A1A1A] bg-[#FAFAF9]">
      <div className="text-center mb-10 sm:mb-14 px-4">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#9A8C83]">
          Shop by Category
        </span>
        <h2 className="mt-3 text-3xl sm:text-5xl font-light tracking-tight text-[#1A1A1A] font-sans">
          Walk the <span className="italic font-serif-custom">avenue</span>
        </h2>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${columnClass} w-full gap-[10px] px-[10px]`}>
        {SHOP_CONFIG.categories.map((cat, idx) => {
          const count = counts[cat.slug] || 0;
          const isLive = count > 0;
          // Custom image from config wins; fall back to the first catalogue
          // product image for the category when no custom image is set.
          const image = cat.image || coverImage[cat.slug];

          const card = (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className={`relative rounded-none overflow-hidden group aspect-[4/5] flex flex-col justify-end p-[20px] text-white ${
                isLive ? '' : 'opacity-80'
              }`}
            >
              {image ? (
                <img
                  src={image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center rounded-none transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-[#1A1A1A]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {!isLive && (
                <span className="absolute top-4 right-4 bg-white/90 text-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  Coming Soon
                </span>
              )}

              <div className="relative z-10 space-y-2 max-w-sm">
                <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white font-sans">
                  {cat.name}
                </h3>
                {!isLive && (
                  <p className="text-xs sm:text-sm text-neutral-200 font-light leading-relaxed font-sans">
                    Opening soon on the avenue.
                  </p>
                )}
              </div>
            </motion.div>
          );

          return isLive ? (
            <Link
              key={cat.slug}
              to={`/product/${cat.slug}`}
              className="group flex flex-col overflow-hidden"
            >
              {card}
            </Link>
          ) : (
            <div key={cat.slug} className="group flex flex-col overflow-hidden">
              {card}
            </div>
          );
        })}
      </div>
    </section>
  );
};

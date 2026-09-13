import React from 'react';
import { Product } from '../types';
import { SHOP_CONFIG } from '../config/shop';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

interface CategoryCardsSectionProps {
  products: Product[];
}

export const CategoryCardsSection: React.FC<CategoryCardsSectionProps> = ({ products }) => {
  const counts: Record<string, number> = {};
  const coverImage: Record<string, string> = {};

  for (const product of products) {
    counts[product.category] = (counts[product.category] || 0) + 1;
    if (!coverImage[product.category] && product.imageUrl) {
      coverImage[product.category] = product.imageUrl;
    }
  }

  return (
    <section id="categories" className="py-20 sm:py-28 bg-[#FAFAF9] text-[#1A1A1A] w-full">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-[#1A1A1A] font-sans">
            Walk the <span className="italic font-serif-custom">avenue</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#5E5E5E] max-w-lg leading-relaxed">
            Every category is a shop on the avenue. Start where you like.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[10px]">
          {SHOP_CONFIG.categories.map((cat) => {
            const count = counts[cat.slug] || 0;
            const isLive = count > 0;
            const image = coverImage[cat.slug];

            const card = (
              <div className="group relative aspect-[4/5] w-full bg-[#EFEFEF] overflow-hidden flex items-end transition-colors">
                {image && (
                  <img
                    src={image}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />

                {!isLive && (
                  <span className="absolute top-4 right-4 bg-white/90 text-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                    Coming Soon
                  </span>
                )}

                <div className="relative z-10 p-6 text-white w-full">
                  <h3 className="text-lg sm:text-xl font-light tracking-tight">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] uppercase tracking-widest text-white/75 mt-1.5">
                    {isLive ? `${count} product${count === 1 ? '' : 's'}` : 'Opening soon'}
                  </p>
                  {isLive && (
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                      Shop now
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );

            return isLive ? (
              <Link
                key={cat.slug}
                to={`/product/${cat.slug}`}
                className="group flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {card}
              </Link>
            ) : (
              <div
                key={cat.slug}
                className="group flex flex-col rounded-xl overflow-hidden shadow-sm opacity-80"
              >
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

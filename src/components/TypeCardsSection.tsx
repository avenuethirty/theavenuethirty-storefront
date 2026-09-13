import React from 'react';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

interface TypeCardsSectionProps {
  products: Product[];
}

interface TypeEntry {
  tagline: string;
  count: number;
  dominantCategory: string;
}

export const TypeCardsSection: React.FC<TypeCardsSectionProps> = ({ products }) => {
  const byTagline = new Map<string, { count: number; categories: Record<string, number> }>();

  for (const product of products) {
    const tagline = product.tagline?.trim();
    if (!tagline) continue;

    const entry = byTagline.get(tagline) || { count: 0, categories: {} };
    entry.count += 1;
    entry.categories[product.category] = (entry.categories[product.category] || 0) + 1;
    byTagline.set(tagline, entry);
  }

  const types: TypeEntry[] = Array.from(byTagline.entries())
    .map(([tagline, entry]) => ({
      tagline,
      count: entry.count,
      dominantCategory: Object.entries(entry.categories).sort((a, b) => b[1] - a[1])[0][0],
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  if (types.length === 0) return null;

  return (
    <section id="shop-by-type" className="py-16 md:py-20 bg-[#FAFAF9] text-[#1A1A1A] w-full border-t border-black/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1A1A1A] font-sans">
            Shop by <span className="italic font-serif-custom">type</span>
          </h2>
          <p className="mt-3 text-sm text-[#5E5E5E] max-w-md leading-relaxed">
            Know what you are looking for? Jump straight to it.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {types.map((type) => (
            <Link
              key={type.tagline}
              to={`/product/${type.dominantCategory}`}
              className="group inline-flex items-center gap-2 border border-neutral-300 rounded-full px-5 py-2.5 text-xs font-medium text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all"
            >
              <span>{type.tagline}</span>
              <span className="text-[10px] opacity-60">{type.count}</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { toTypeSlug, formatTypeLabel } from '../utils/typeSlug';

interface TypeCardsSectionProps {
  products: Product[];
}

interface TypeEntry {
  slug: string;
  label: string;
  count: number;
  dominantCategory: string;
}

export const TypeCardsSection: React.FC<TypeCardsSectionProps> = ({ products }) => {
  const bySlug = new Map<string, { label: string; count: number; categories: Record<string, number> }>();

  for (const product of products) {
    const tagline = product.tagline?.trim();
    if (!tagline) continue;

    const slug = product.typeSlug || toTypeSlug(tagline);
    const entry = bySlug.get(slug) || { label: tagline, count: 0, categories: {} };
    entry.label = entry.label.length >= tagline.length ? entry.label : tagline;
    entry.count += 1;
    entry.categories[product.category] = (entry.categories[product.category] || 0) + 1;
    bySlug.set(slug, entry);
  }

  const types: TypeEntry[] = Array.from(bySlug.entries())
    .map(([slug, entry]) => {
      const [dominantCategory, categoryCount] = Object.entries(entry.categories).sort(
        (a, b) => b[1] - a[1]
      )[0];
      return {
        slug,
        label: formatTypeLabel(entry.label),
        // The pill links to the type page within its dominant category, so
        // the badge must show that page's result count, not the cross-category total.
        count: categoryCount,
        dominantCategory,
      };
    })
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
              key={type.slug}
              to={`/product/${type.dominantCategory}/${type.slug}`}
              className="group inline-flex items-center gap-2 border border-neutral-300 rounded-full px-5 py-2.5 text-xs font-medium text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all"
            >
              <span>{type.label}</span>
              <span className="text-[10px] opacity-60">{type.count}</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

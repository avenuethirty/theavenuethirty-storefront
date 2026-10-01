import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { SHOP_CONFIG } from '../config/shop';
import { Link } from 'react-router-dom';
import { getCategoryLabel } from '../utils/category';
import { buildTypeEntries, type TypeEntry } from '../utils/typeSections';
import { TypePills } from './TypePills';
import { TypeSectionConfig } from '../config/shop';

interface TypeSectionProps {
  category: string;
  products: Product[];
}

// Tailwind v4 scans source for static class strings, so grid values map to static classes.
const COLUMN_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  8: 'grid-cols-8',
};
const TABLET_COLUMN_CLASSES: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
  8: 'sm:grid-cols-8',
};
const DESKTOP_COLUMN_CLASSES: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
  8: 'lg:grid-cols-8',
};
const DEFAULT_GRID = { mobile: 2, tablet: 3, desktop: 3 };

export const TypeSection: React.FC<TypeSectionProps> = ({ category, products }) => {
  const config: TypeSectionConfig | undefined = SHOP_CONFIG.typeSections.find(
    (s) => s.category === category
  );
  if (!config) return null;

  // Shared with the PLP pill row so the homepage section and the listing page
  // cannot describe the same category differently.
  const types: TypeEntry[] = buildTypeEntries(products, category, config);
  if (types.length === 0) return null;

  const categoryLabel = getCategoryLabel(category);
  const title =
    config.title || `Shop ${categoryLabel} by type`;

  if (config.format === 'pills') {
    return (
      <section id={`types-${category}`} className="py-16 md:py-20 bg-[#FAFAF9] text-[#1A1A1A] w-full border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1A1A1A] font-sans">
              {title}
            </h2>
          </div>
          {/* No `activeSlug`: the homepage is not a type listing, so the row
              renders centred with no All pill and no active state — exactly as
              it did inline. */}
          <TypePills category={category} types={types} centered />
        </div>
      </section>
    );
  }

  const grid = config.grid || DEFAULT_GRID;
  const mobileClass = COLUMN_CLASSES[grid.mobile] || COLUMN_CLASSES[2];
  const tabletClass = TABLET_COLUMN_CLASSES[grid.tablet] || TABLET_COLUMN_CLASSES[3];
  const desktopClass =
    DESKTOP_COLUMN_CLASSES[grid.desktop] || DESKTOP_COLUMN_CLASSES[3];

  return (
    <section id={`types-${category}`} className="py-20 sm:py-28 w-full text-[#1A1A1A] bg-[#FAFAF9]">
      <div className="text-center mb-10 sm:mb-14 px-4">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#9A8C83]">
          {categoryLabel}
        </span>
        <h2 className="mt-3 text-3xl sm:text-5xl font-light tracking-tight text-[#1A1A1A] font-sans">
          {title}
        </h2>
      </div>

      <div className={`grid ${mobileClass} ${tabletClass} ${desktopClass} w-full gap-[10px] px-[10px]`}>
        {types.map((type, idx) => (
          <Link
            key={type.slug}
            to={`/product/${category}/${type.slug}`}
            className="group flex flex-col overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className="relative rounded-none overflow-hidden group aspect-[4/5] flex flex-col justify-end p-[20px] text-white"
            >
              {type.image ? (
                <img
                  src={type.image}
                  alt={type.label}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center rounded-none transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-[#1A1A1A]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="relative z-10 max-w-sm">
                <h3 className="text-xl sm:text-2xl font-light tracking-tight text-white font-sans">
                  {type.label}
                </h3>
                <span className="text-xs text-neutral-200 font-light font-sans">
                  {type.count} products
                </span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
};

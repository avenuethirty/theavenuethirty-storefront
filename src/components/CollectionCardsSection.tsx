import React from "react";
import { Link } from "react-router-dom";
import { SHOP_CONFIG } from "../config/shop";
import { motion } from "motion/react";
import { Product } from "../types";
import { matchCollection } from "../utils/collections";

const COLUMN_CLASSES: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  8: "grid-cols-8",
};

const TABLET_COLUMN_CLASSES: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
  8: "sm:grid-cols-8",
};

const DESKTOP_COLUMN_CLASSES: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  8: "lg:grid-cols-8",
};

export const CollectionCardsSection: React.FC<{ products: Product[] }> = ({ products }) => {
  const cards = SHOP_CONFIG.collections
    .filter((c) => !c.card?.hidden)
    .map((c) => {
      const matched = matchCollection(products, c.match);
      return { ...c, matchedProducts: matched };
    })
    .filter((c) => c.matchedProducts.length > 0)
    .sort((a, b) => (a.card?.order || 999) - (b.card?.order || 999));

  if (cards.length === 0) return null;

  const { mobile, tablet, desktop } = SHOP_CONFIG.collectionCardGrid.columns;
  const mobileClass = COLUMN_CLASSES[mobile] || COLUMN_CLASSES[2];
  const tabletClass = TABLET_COLUMN_CLASSES[tablet] || TABLET_COLUMN_CLASSES[3];
  const desktopClass = DESKTOP_COLUMN_CLASSES[desktop] || DESKTOP_COLUMN_CLASSES[4];

  return (
    <section className="py-16 md:py-24 w-full text-[#1A1A1A] bg-[#FAFAF9]">
      <div className="text-center mb-10 sm:mb-14 px-4">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#9A8C83]">
          Shop by Collection
        </span>
        <h2 className="mt-3 text-3xl sm:text-5xl font-light tracking-tight text-[#1A1A1A] font-sans">
          Curated picks
        </h2>
      </div>

      <div className={`grid ${mobileClass} ${tabletClass} ${desktopClass} w-full gap-[10px] px-[10px]`}>
        {cards.map((collection, idx) => {
          const cover = collection.image || collection.matchedProducts[0]?.imageUrl;
          return (
            <Link
              key={collection.slug}
              to={`/${collection.slug}`}
              className="group flex flex-col overflow-hidden"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="relative rounded-none overflow-hidden aspect-[4/5] flex flex-col justify-end p-[20px] text-white"
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={collection.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center rounded-none transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#1A1A1A]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10 space-y-1 max-w-sm">
                  <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white font-sans">
                    {collection.title}
                  </h3>
                  {collection.subtitle && (
                    <p className="text-xs sm:text-sm text-neutral-200 font-light">
                      {collection.subtitle}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-neutral-200 font-light">
                    {collection.matchedProducts.length} {collection.matchedProducts.length === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { CategoryCardsSection } from '../components/CategoryCardsSection';
import { CollectionCardsSection } from '../components/CollectionCardsSection';
import { ProductRail } from '../components/ProductRail';
import { TypeSection } from '../components/TypeSection';
import { HowItWorks } from '../components/HowItWorks';
import { CtaSection } from '../components/CtaSection';
import { TikTokTestimonials } from '../components/TikTokTestimonials';
import { Product } from '../types';
import { SHOP_CONFIG } from '../config/shop';
import { getCollectionBySlug, matchCollection } from '../utils/collections';
import { LazyMount } from '../components/LazyMount';

type HomepageSequenceItem = {
  type: 'rail';
  collection: string;
} | {
  type: 'types';
  category: string;
};

interface HomePageProps {
  onStartAiChat: (query?: string) => void;
  onAddToCart: (product: Product) => void;
  onNavigateToProduct?: (product: Product) => void;
  products?: Product[];
  catalogueReady?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartAiChat,
  onAddToCart,
  onNavigateToProduct,
  products,
  catalogueReady = true,
}) => {
  const catalogue = products || [];

  const getCollectionProducts = (slug: string) => {
    const collection = getCollectionBySlug(slug);
    if (!collection) return [];
    return matchCollection(catalogue, collection.match);
  };

  const renderSequenceItem = (item: HomepageSequenceItem, index: number) => {
    const content = (
      <div>
        {item.type === 'rail' && (() => {
          const collection = getCollectionBySlug(item.collection);
          const railProducts = getCollectionProducts(item.collection);
          return (
            <ProductRail
              id={item.collection}
              title={collection?.title || item.collection}
              products={railProducts}
              onAddToCart={onAddToCart}
              onNavigateToProduct={onNavigateToProduct}
              catalogueReady={catalogueReady}
              viewAllHref={`/${item.collection}`}
              viewAllLabel="View All"
            />
          );
        })()}
        {item.type === 'types' && (
          <TypeSection category={item.category} products={catalogue} />
        )}
      </div>
    );

    if (index === 0) return content;
    return <LazyMount key={index}>{content}</LazyMount>;
  };

  return (
    <main className="relative w-full">
      <div className="relative w-full">
        <HeroSection onStartAiChat={onStartAiChat} />
      </div>

      <div className="relative bg-[#FAFAF9]">
        <CategoryCardsSection products={catalogue} />
        <CollectionCardsSection products={catalogue} />

        {SHOP_CONFIG.homepage.sequence.map((item, index) =>
          renderSequenceItem(item, index)
        )}

        <HowItWorks />

        <TikTokTestimonials />

        <CtaSection />
      </div>
    </main>
  );
};

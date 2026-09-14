import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { CategoryCardsSection } from '../components/CategoryCardsSection';
import { ProductRail } from '../components/ProductRail';
import { TypeCardsSection } from '../components/TypeCardsSection';
import { HowItWorks } from '../components/HowItWorks';
import { CtaSection } from '../components/CtaSection';
import { SystemApproachSection } from '../components/SystemApproachSection';
import { AboutUsSection } from '../components/AboutUsSection';
import { TikTokTestimonials } from '../components/TikTokTestimonials';
import { Product } from '../types';

interface HomePageProps {
  onStartAiChat: (query?: string) => void;
  onAddToCart: (product: Product) => void;
  products?: Product[];
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartAiChat,
  onAddToCart,
  products,
}) => {
  const catalogue = products || [];

  // Carousel sections are driven by catalogue status labels
  // (Collections column on the sheet): 'Featured', 'Best Seller',
  // 'Trending', 'Sale', 'New Arrival', 'Must-Have Styles', 'Recommended'.
  // Sections with no matching products are hidden entirely.
  const byStatus = (status: string) =>
    catalogue.filter((p) =>
      p.collections?.some((c) => c.toLowerCase() === status.toLowerCase())
    );

  const mustHave = byStatus('Must-Have Styles');
  const bestSeller = byStatus('Best Seller');
  const featured = byStatus('Featured');
  const onSale = byStatus('Sale');
  const recommended = byStatus('Recommended');
  const trending = byStatus('Trending');
  const newArrival = byStatus('New Arrival');

  return (
    <main className="relative w-full">
      <div className="relative w-full">
        <HeroSection onStartAiChat={onStartAiChat} />
      </div>

      <div className="relative bg-[#FAFAF9]">
        <CategoryCardsSection products={catalogue} />
        <SystemApproachSection />
        <AboutUsSection />

        <ProductRail
          id="must-have"
          title="Must-Have Styles"
          products={mustHave}
          onAddToCart={onAddToCart}
        />

        <ProductRail
          id="best-seller"
          title="Best Seller"
          products={bestSeller}
          onAddToCart={onAddToCart}
        />

        <ProductRail
          id="featured"
          title="Featured"
          products={featured}
          onAddToCart={onAddToCart}
        />

        <ProductRail
          id="on-sale"
          title="On Sale"
          products={onSale}
          onAddToCart={onAddToCart}
        />

        <TypeCardsSection products={catalogue} />

        <ProductRail
          id="recommended"
          title="Recommended"
          products={recommended}
          onAddToCart={onAddToCart}
        />

        <ProductRail
          id="trending"
          title="Trending"
          products={trending}
          onAddToCart={onAddToCart}
        />

        <ProductRail
          id="new-arrival"
          title="New Arrival"
          products={newArrival}
          onAddToCart={onAddToCart}
        />

        <HowItWorks />

        <TikTokTestimonials />

        <CtaSection />
      </div>
    </main>
  );
};

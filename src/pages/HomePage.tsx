import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { CategoryCardsSection } from '../components/CategoryCardsSection';
import { ProductRail } from '../components/ProductRail';
import { TypeSection } from '../components/TypeSection';
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
  catalogueReady?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartAiChat,
  onAddToCart,
  products,
  catalogueReady = true,
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
          catalogueReady={catalogueReady}
        />

        <ProductRail
          id="best-seller"
          title="Best Seller"
          products={bestSeller}
          onAddToCart={onAddToCart}
          catalogueReady={catalogueReady}
        />

        <TypeSection category="bags" products={catalogue} />

        <ProductRail
          id="on-sale"
          title="On Sale"
          products={onSale}
          onAddToCart={onAddToCart}
          catalogueReady={catalogueReady}
        />

        <TypeSection category="jewellery" products={catalogue} />

        <ProductRail
          id="trending"
          title="Trending"
          products={trending}
          onAddToCart={onAddToCart}
          catalogueReady={catalogueReady}
        />

        <ProductRail
          id="featured"
          title="Featured"
          products={featured}
          onAddToCart={onAddToCart}
          catalogueReady={catalogueReady}
        />

        <TypeSection category="toys" products={catalogue} />

        <ProductRail
          id="new-arrival"
          title="New Arrival"
          products={newArrival}
          onAddToCart={onAddToCart}
          catalogueReady={catalogueReady}
        />

        <ProductRail
          id="recommended"
          title="Recommended"
          products={recommended}
          onAddToCart={onAddToCart}
          catalogueReady={catalogueReady}
        />

        <HowItWorks />

        <TikTokTestimonials />

        <CtaSection />
      </div>
    </main>
  );
};

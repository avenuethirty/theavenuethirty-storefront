import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { CategoryCardsSection } from '../components/CategoryCardsSection';
import { ProductRail } from '../components/ProductRail';
import { TypeCardsSection } from '../components/TypeCardsSection';
import { HowItWorks } from '../components/HowItWorks';
import { SellersSection } from '../components/SellersSection';
import { CtaSection } from '../components/CtaSection';
import { SystemApproachSection } from '../components/SystemApproachSection';
import { AboutUsSection } from '../components/AboutUsSection';
import { ProductGrid } from '../components/ProductGrid';
import { TikTokTestimonials } from '../components/TikTokTestimonials';
import { CommunityMarquee } from '../components/CommunityMarquee';
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

  // Must-Have Styles: products tagged "Featured", fallback to first 8
  const featured = catalogue.filter((p) => p.collections?.includes('Featured'));
  const mustHave = (featured.length > 0 ? featured : catalogue).slice(0, 8);

  // On Sale: discounted items, deepest discount first
  const onSale = catalogue
    .filter((p) => p.originalPrice && p.originalPrice > p.priceMonthly)
    .sort(
      (a, b) =>
        (b.originalPrice! - b.priceMonthly) / b.originalPrice! -
        (a.originalPrice! - a.priceMonthly) / a.originalPrice!
    )
    .slice(0, 8);

  // Recommended: the premium pick from each category, up to 4
  const bestByCategory = new Map<string, Product>();
  for (const product of catalogue) {
    const current = bestByCategory.get(product.category);
    if (!current || product.priceMonthly > current.priceMonthly) {
      bestByCategory.set(product.category, product);
    }
  }
  const recommended = Array.from(bestByCategory.values()).slice(0, 4);

  return (
    <main className="relative w-full">
      <div className="relative w-full">
        <HeroSection onStartAiChat={onStartAiChat} />
      </div>

      <div className="relative bg-[#FAFAF9]">
        <SystemApproachSection />
        <AboutUsSection />
        <CategoryCardsSection products={catalogue} />

        <ProductRail
          id="must-have"
          title="Must-Have Styles"
          subtitle="Every product on the avenue is picked from verified sellers and presented honestly. Real images, clear prices, no surprises. Start with the pieces our shoppers reach for first."
          products={mustHave}
          onAddToCart={onAddToCart}
        />

        <ProductRail
          id="on-sale"
          title="On Sale"
          subtitle="Real discounts on real products. Pay when it arrives."
          products={onSale}
          onAddToCart={onAddToCart}
        />

        <TypeCardsSection products={catalogue} />

        <ProductGrid
          products={catalogue}
          onAddToCart={onAddToCart}
        />

        <ProductRail
          id="recommended"
          title="Recommended"
          subtitle="A confident pick from every shop on the avenue."
          products={recommended}
          onAddToCart={onAddToCart}
        />

        <HowItWorks />

        <TikTokTestimonials />

        <CommunityMarquee />

        <SellersSection productCount={catalogue.length} />

        <CtaSection />
      </div>
    </main>
  );
};

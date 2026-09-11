import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { HowItWorks } from '../components/HowItWorks';
import { CtaSection } from '../components/CtaSection';
import { ProductGrid } from '../components/ProductGrid';
import { SystemApproachSection } from '../components/SystemApproachSection';
import { AboutUsSection } from '../components/AboutUsSection';
import { TikTokTestimonials } from '../components/TikTokTestimonials';
import { DermatologyTeam } from '../components/DermatologyTeam';
import { Product } from '../types';

interface HomePageProps {
  onStartAiChat: (query?: string) => void;
  onAddToCart: (product: Product) => void;
  onOpenConsultation: (query?: string) => void;
  products?: Product[];
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartAiChat,
  onAddToCart,
  onOpenConsultation,
  products,
}) => {
  const catalogue = products || [];
  return (
    <main className="relative w-full">
      <div className="relative w-full">
        <HeroSection onStartAiChat={onStartAiChat} />
      </div>

      <div className="relative bg-[#FAFAF9]">
        <SystemApproachSection />
        <AboutUsSection />
        <ProductGrid
          onAddToCart={onAddToCart}
          onOpenConsultation={() => onOpenConsultation?.('Prescription product recommendations for my skin')}
          products={catalogue}
          collection="Featured"
        />
        <HowItWorks onStartConsultation={() => onOpenConsultation?.('Medical prescription analysis for my skin condition')} />
        <CtaSection onOpenConsultation={() => onOpenConsultation?.('Prescription product recommendations for my skin')} />
        <TikTokTestimonials
          onAddToCart={(productName, priceStr) => {
            const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
            const matched = catalogue.find((p) => p.name === productName);
            onAddToCart(
              matched || {
                id: `tiktok-${Date.now()}`,
                name: productName,
                tagline: 'Featured in Consumer Video Review',
                priceMonthly: numericPrice,
                category: 'skincare_beauty',
                rating: 5.0,
                reviewsCount: 124,
                description: 'Directly featured formula in consumer TikTok video review',
                imageUrl: matched?.imageUrl || catalogue[0]?.imageUrl || '',
                keyIngredients: ['Active Rx Complex', 'Micro-encapsulated Retinal'],
                bestFor: ['All skin types', 'Barrier repair'],
              },
              'Featured TikTok Formula'
            );
          }}
        />
        <DermatologyTeam onOpenConsultation={() => onOpenConsultation?.('Consultation with dermatology team')} />
      </div>
    </main>
  );
};

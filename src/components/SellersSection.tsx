import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Store } from 'lucide-react';

interface SellersSectionProps {
  productCount: number;
}

export const SellersSection: React.FC<SellersSectionProps> = ({ productCount }) => {
  return (
    <section id="sellers" className="py-20 sm:py-28 bg-[#FAFAF9] text-[#1A1A1A] w-full">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-[#1A1A1A] font-sans leading-[1.15] mb-4">
            One avenue. <span className="italic font-serif-custom">Many shops.</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#5E5E5E] max-w-xl leading-relaxed">
            The Avenue Thirty is a marketplace. Every seller on it is chosen, and every order is backed by the platform from browse to doorstep.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] max-w-4xl mx-auto">
          {/* Circle Woman spotlight card */}
          <div className="relative bg-[#1A1A1A] text-white rounded-2xl p-8 sm:p-10 flex flex-col justify-between min-h-[280px]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 block mb-4">
                First shop on the avenue
              </span>
              <h3 className="text-2xl sm:text-3xl font-light tracking-tight mb-3">
                Circle Woman
              </h3>
              <p className="text-xs text-white/70 leading-relaxed max-w-sm">
                Skincare and beauty, bags, jewellery and accessories, and toys and kids. Every product presented honestly, with clear prices and real images.
              </p>
            </div>
            <p className="text-[11px] uppercase tracking-widest text-white/50 mt-6">
              {productCount > 0 ? `${productCount} products live` : 'Catalogue loading'}
            </p>
          </div>

          {/* Sell with us card */}
          <div className="relative bg-white text-[#1A1A1A] border border-neutral-200 rounded-2xl p-8 sm:p-10 flex flex-col justify-between min-h-[280px] hover:border-neutral-400 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center mb-6">
                <Store className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-light tracking-tight mb-3">
                Your shop could be next
              </h3>
              <p className="text-xs text-[#5E5E5E] leading-relaxed max-w-sm">
                We are onboarding verified sellers across fashion, beauty, electronics, and more. Bring your products. We handle the avenue.
              </p>
            </div>
            <Link
              to="/sell"
              className="mt-6 inline-flex items-center gap-2 self-start text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] hover:opacity-75 transition-opacity"
            >
              Sell with us
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

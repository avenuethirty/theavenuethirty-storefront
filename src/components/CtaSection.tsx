import React from 'react';
import { ArrowRight, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SHOP_CONFIG } from '../config/shop';

export const CtaSection: React.FC = () => {
  const firstCategory = SHOP_CONFIG.categories[0];

  return (
    <section id="cta-section" className="py-12 bg-[#FAFAF9] text-[#1A1A1A] w-full px-[10px]">
      <div
        className="w-full h-[600px] text-white p-8 md:p-12 rounded-3xl flex flex-col items-start justify-between gap-6 bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage:
            "url('https://i.postimg.cc/HLZwpk2S/cta-01.webp')",
        }}
      >
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        {/* Top Text Block + Buttons */}
        <div className="text-left relative z-10">
          <h3 className="text-[32px] sm:text-[57px] leading-[1.1] font-light tracking-tight max-w-[500px]">
            Ready to walk the avenue?
          </h3>
          <p className="text-sm text-white mt-4 max-w-[500px] leading-relaxed">
            Hundreds of products from verified sellers are waiting.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
            <Link
              id="products-cta-btn"
              to={`/product/${firstCategory.slug}`}
              className="bg-white text-[#1A1A1A] font-semibold px-8 py-4 rounded-full transition-all text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-100"
            >
              <span>Browse the Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/sell"
              className="text-white border border-white/50 bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold px-8 py-4 rounded-full transition-all text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <span>Sell With Us</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

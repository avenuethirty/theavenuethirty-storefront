import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SHOP_CONFIG } from '../config/shop';

interface CtaSectionProps {
  onOpenConsultation?: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenConsultation }) => {
  const currencySymbol = SHOP_CONFIG.localization.currencySymbol;
  return (
    <section id="cta-section" className="py-12 bg-[#FAFAF9] text-[#1A1A1A] w-full px-[10px]">
      <div 
        className="w-full h-[700px] text-white p-8 md:p-12 rounded-3xl flex flex-col items-start justify-between gap-6 bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: `url('https://www.dropbox.com/scl/fi/yug4xpykeewxfkzyg22x5/Clear_serum_bottle_on_moss_202608021917.jpeg?rlkey=xrrb1miktu69gr3uxz5opuk0j&st=yqoafy8o&raw=1')`
        }}
      >
        {/* Top Text Block + Button */}
        <div className="text-left relative z-10">
          <h3 className="text-[32px] sm:text-[57px] leading-[1.1] font-light tracking-tight max-w-[500px]">
            Ready to harmonize your skin ritual?
          </h3>
          <p className="text-sm text-white mt-4 max-w-[500px]">
            Take our 5-minute diagnostic evaluation to unlock your custom medical prescription formula from {currencySymbol}19.99/mo.
          </p>

          {/* Button created under the text */}
          <button
            id="products-cta-btn"
            onClick={onOpenConsultation}
            className="mt-6 bg-white/20 text-white border border-white/50 hover:bg-white/30 backdrop-blur-sm font-semibold px-8 py-4 rounded-full transition-all text-xs uppercase tracking-widest shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Start Free Consultation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Left Disclaimer */}
        <div className="relative z-10 flex flex-col items-start gap-2 max-w-xl">
          <p id="ai-disclaimer-text" className="text-[10px] sm:text-[11px] text-white/70 leading-normal font-sans">
            *Disclaimer: AI-assisted consultation guidelines and recommendations are for informational purposes only and may have limitations or inaccuracies. This information does not replace professional medical advice, diagnosis, or treatment. Always consult directly with a board-certified dermatologist or licensed healthcare provider before starting any medical skincare regimen.
          </p>
        </div>
      </div>
    </section>
  );
};


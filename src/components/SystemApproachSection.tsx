import React from 'react';
import { motion } from 'motion/react';

import imgPill1 from '../assets/images/regenerated_image_1785666716721.jpg';
import imgPill2 from '../assets/images/regenerated_image_1785666718362.jpg';
import imgPill3 from '../assets/images/regenerated_image_1785666720842.jpg';

export const SystemApproachSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 w-full text-[#1A1A1A] bg-[#FAFAF9]">
      {/* Top Header Label */}
      <div className="text-center mb-4 px-4">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#9A8C83]">
          SCIENCE-BACKED SKIN BIOLOGY
        </span>
      </div>

      {/* Main Headline with Inline Micro-Image Pill Indicators */}
      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-center max-w-4xl mx-auto leading-[1.18] text-[#1A1A1A] font-sans mb-16 sm:mb-20 px-4"
      >
        A system-level{' '}
        <span className="inline-flex items-center align-middle mx-1 transform -translate-y-1">
          <img
            src={imgPill1}
            alt="Skin profile"
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover border border-black/10 shadow-sm"
            referrerPolicy="no-referrer"
          />
        </span>{' '}
        approach to <span className="italic font-serif-custom">dermatology</span> — compounded for{' '}
        <span className="inline-flex items-center align-middle mx-1 transform -translate-y-1">
          <img
            src={imgPill2}
            alt="Custom Rx bottle"
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover border border-black/10 shadow-sm"
            referrerPolicy="no-referrer"
          />
        </span>{' '}
        consistency{' '}
        <span className="inline-flex items-center align-middle mx-1 transform -translate-y-1">
          <img
            src={imgPill3}
            alt="Clinical formula texture"
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover border border-black/10 shadow-sm"
            referrerPolicy="no-referrer"
          />
        </span>
        , not complexity.
      </motion.h2>

      {/* Full Width 2-Column Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-[10px] px-[10px]">
        
        {/* Card 1: Precision Rx Formulations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-none overflow-hidden group min-h-[500px] sm:min-h-[620px] flex flex-col justify-end p-[20px] text-white"
        >
          {/* Background Image */}
          <img
            src="https://res.cloudinary.com/mpdpiwxv/image/upload/f_auto,q_auto/v1785829347/Woman_with_curly_hair_shielding_202608021521_oxewl1.jpg"
            alt="Woman with curly hair shielding face"
            className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center rounded-none transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Soft Dark Vignette Overlay for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Bottom Text Content */}
          <div className="relative z-10 space-y-2 max-w-sm">
            <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white font-sans">
              Precision <span className="italic font-serif-custom">Rx</span> formulations
            </h3>
            <p className="text-xs sm:text-sm text-neutral-200 font-light leading-relaxed font-sans">
              Doctor-prescribed active ingredients compounded at exact strengths to target your specific skin biology.
            </p>
          </div>
        </motion.div>

        {/* Card 2: Long-Term Barrier Resilience */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative rounded-none overflow-hidden group min-h-[500px] sm:min-h-[620px] flex flex-col justify-end p-[20px] text-white"
        >
          {/* Background Image */}
          <img
            src="https://res.cloudinary.com/mpdpiwxv/image/upload/f_auto,q_auto/v1785829358/Young_woman_smiling_with_freckles_202608021448_bui0hk.jpg"
            alt="Young woman smiling with freckles"
            className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center rounded-none transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Soft Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Bottom Text Content */}
          <div className="relative z-10 space-y-2 max-w-md">
            <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white font-sans">
              Long-term <span className="italic font-serif-custom">barrier</span> resilience
            </h3>
            <p className="text-xs sm:text-sm text-neutral-200 font-light leading-relaxed font-sans">
              Every Avenue Thirty product is curated for quality, fit, and purpose — so your order arrives exactly as you imagined.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
};


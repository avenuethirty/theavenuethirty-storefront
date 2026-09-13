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
          CURATED WITH CARE
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
        A marketplace{' '}
        <span className="inline-flex items-center align-middle mx-1 transform -translate-y-1">
          <img
            src={imgPill1}
            alt="Curated product"
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover border border-black/10 shadow-sm"
            referrerPolicy="no-referrer"
          />
        </span>{' '}
        built on <span className="italic font-serif-custom">honesty</span> - picked for{' '}
        <span className="inline-flex items-center align-middle mx-1 transform -translate-y-1">
          <img
            src={imgPill2}
            alt="Verified seller product"
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover border border-black/10 shadow-sm"
            referrerPolicy="no-referrer"
          />
        </span>{' '}
        quality{' '}
        <span className="inline-flex items-center align-middle mx-1 transform -translate-y-1">
          <img
            src={imgPill3}
            alt="Product detail"
            className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover border border-black/10 shadow-sm"
            referrerPolicy="no-referrer"
          />
        </span>
        , not hype.
      </motion.h2>

      {/* Full Width 2-Column Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-[10px] px-[10px]">

        {/* Card 1: Verified Sellers */}
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
            alt="Shopper browsing curated marketplace finds"
            className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center rounded-none transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Soft Dark Vignette Overlay for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Bottom Text Content */}
          <div className="relative z-10 space-y-2 max-w-sm">
            <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white font-sans">
              Verified <span className="italic font-serif-custom">sellers</span>, honest listings
            </h3>
            <p className="text-xs sm:text-sm text-neutral-200 font-light leading-relaxed font-sans">
              Every seller on The Avenue Thirty is chosen, and every product is presented with real images and clear prices - no surprises.
            </p>
          </div>
        </motion.div>

        {/* Card 2: Platform-Backed Ordering */}
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
            alt="Happy shopper with her order"
            className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center rounded-none transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Soft Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Bottom Text Content */}
          <div className="relative z-10 space-y-2 max-w-md">
            <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white font-sans">
              Long-term <span className="italic font-serif-custom">trust</span> in every order
            </h3>
            <p className="text-xs sm:text-sm text-neutral-200 font-light leading-relaxed font-sans">
              Every order is backed by the platform from browse to doorstep, with Cash on Delivery so you pay only when it arrives.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

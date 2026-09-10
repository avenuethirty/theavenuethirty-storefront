import React from 'react';

const LOGO_IMAGES = [
  { id: '1', src: '/logos/Group 67.png', alt: 'Partner Skincare Brand Logo 1' },
  { id: '2', src: '/logos/Group 68.png', alt: 'Partner Skincare Brand Logo 2' },
  { id: '3', src: '/logos/Group 69.png', alt: 'Partner Skincare Brand Logo 3' },
  { id: '4', src: '/logos/Group 70.png', alt: 'Partner Skincare Brand Logo 4' },
  { id: '5', src: '/logos/Group 71.png', alt: 'Partner Skincare Brand Logo 5' },
];

export const BrandLogosSlider: React.FC = () => {
  // Multiply logos array for continuous seamless infinite marquee looping
  const doubleLogos = [...LOGO_IMAGES, ...LOGO_IMAGES, ...LOGO_IMAGES, ...LOGO_IMAGES];

  return (
    <section className="w-full bg-[#FAF9F6] border-y border-black/5 py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9A8C83]">
          Supported by Leading Skincare Brands & Clinical Formulators
        </span>
      </div>

      {/* Infinite Marquee Slider Container */}
      <div className="relative w-full overflow-hidden flex items-center py-2">
        {/* Left & Right Gradient Mask Overlays for smooth edge fading */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#FAF9F6] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#FAF9F6] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex items-center gap-12 sm:gap-16 whitespace-nowrap">
          {doubleLogos.map((logo, idx) => (
            <div
              key={`${logo.id}-${idx}`}
              className="flex items-center justify-center shrink-0 opacity-75 hover:opacity-100 transition-all duration-300 cursor-pointer group px-2"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                referrerPolicy="no-referrer"
                className="h-7 sm:h-9 md:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

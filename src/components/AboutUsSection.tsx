import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { ScrollTextReveal } from './ScrollTextReveal';

import imageAnalyze from '../assets/images/regenerated_image_1785665442679.jpg';
import imagePrescribe from '../assets/images/regenerated_image_1785665444081.jpg';
import imageSustain from '../assets/images/regenerated_image_1785665446435.jpg';

export const AboutUsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Calculate spread distance based on scroll position relative to viewport
  // As section enters view (0 to 0.45 progress), circles converge into default overlapping position (spread -> 0)
  // When scrolling through or past the section (0.45 to 1.0 progress), circles stay in normal overlapping position (spread = 0)
  const rawSpread = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    [220, 0, 0]
  );
  const spread = useSpring(rawSpread, { stiffness: 90, damping: 20, mass: 0.6 });

  const circles = [
    {
      type: 'image',
      title: 'Browse',
      subtitle: 'Curated Shops',
      image: imageAnalyze,
      alt: 'Browsing curated shops on the avenue',
      textColor: 'text-white',
      zIndex: 'z-20',
    },
    {
      type: 'outline',
      title: '',
      subtitle: '',
      bgColor: 'bg-transparent border border-[#a4a4a4]',
      textColor: 'text-transparent',
      zIndex: 'z-10',
    },
    {
      type: 'image',
      title: 'Order',
      subtitle: 'Cash on Delivery',
      image: imagePrescribe,
      alt: 'Confirming an order on WhatsApp',
      textColor: 'text-white',
      zIndex: 'z-30',
    },
    {
      type: 'outline',
      title: '',
      subtitle: '',
      bgColor: 'bg-transparent border border-[#a4a4a4]',
      textColor: 'text-transparent',
      zIndex: 'z-10',
    },
    {
      type: 'image',
      title: 'Enjoy',
      subtitle: 'Doorstep Delivery',
      image: imageSustain,
      alt: 'Order delivered to your door',
      textColor: 'text-white',
      zIndex: 'z-40',
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 w-full bg-[#FAFAF9] text-[#1A1A1A] border-t border-black/5 overflow-hidden">
      {/* Top Header & Paragraph Grid */}
      <div className="w-full pl-[10px] pr-6 sm:pr-10 mb-20">
        <div className="max-w-[1000px] w-full pl-0">
          <ScrollTextReveal
            text="Shopping well comes down to three simple pillars: browsing shops you can trust, ordering what you actually want with Cash on Delivery, and enjoying pieces that arrive exactly as promised. It all boils down to this mantra: browse, order, enjoy — a simple roadmap for confident shopping."
            boldWords={['browse,', 'order,', 'enjoy', 'browse', 'order']}
            className="text-xl sm:text-2xl md:text-[34px] text-[#2C2A29] font-light leading-[1.3] font-sans"
          />
        </div>
      </div>

      {/* Bottom 5 Overlapping Circles Graphic - Full Screen Width (Edge to Edge) */}
      <div className="relative w-full py-8 overflow-hidden">
        <div className="flex justify-center items-center -space-x-[40px] w-full px-0">
          {circles.map((item, idx) => {
            // Offset multiplier from center circle (index 2)
            const multiplier = idx - 2;
            const x = useTransform(spread, (v) => multiplier * v);

            return (
              <motion.div
                key={item.title || idx}
                style={{ x }}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className={`relative flex-shrink-0 flex flex-col items-center group cursor-pointer ${item.zIndex}`}
              >
                {/* Circular Card - Sized so 5 circles with 40px overlap fill 100vw */}
                <div
                  className={`relative w-[calc(20vw+32px)] h-[calc(20vw+32px)] min-w-[72px] min-h-[72px] rounded-full overflow-hidden flex flex-col items-center justify-center p-1 sm:p-3 md:p-4 text-center transition-transform duration-500 ease-out group-hover:scale-105 ${
                    item.type === 'image' ? 'shadow-sm border border-black/5' : item.bgColor
                  }`}
                >
                  {item.type === 'image' && (
                    <>
                      {/* Background Image */}
                      <img
                        src={item.image}
                        alt={item.alt}
                        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05] group-hover:brightness-95 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {/* Dark Overlay for Text Legibility */}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-500" />
                    </>
                  )}

                  {/* Centered Content */}
                  {item.title && (
                    <div className="relative z-10 flex flex-col items-center justify-center px-1 sm:px-2">
                      <span
                        className={`text-[10px] min-[380px]:text-xs min-[480px]:text-sm sm:text-lg md:text-2xl lg:text-3xl font-light tracking-wide font-sans ${item.textColor} drop-shadow-sm leading-tight`}
                      >
                        {item.title}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

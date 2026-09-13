import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CommunitySpotlight {
  name: string;
  title: string;
  imageUrl: string;
}

const COMMUNITY: CommunitySpotlight[] = [
  {
    name: 'Circle Woman',
    title: 'First shop on the avenue • Skincare & Beauty',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Ayesha K.',
    title: 'Verified shopper • Skincare enthusiast',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Fatima R.',
    title: 'Verified shopper • Bags & accessories',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Zara M.',
    title: 'Verified shopper • Jewellery lover',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Maryam S.',
    title: 'Verified shopper • Kids & toys',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  },
];

// Duplicate community array for continuous seamless looping
const INFINITE_COMMUNITY = [...COMMUNITY, ...COMMUNITY, ...COMMUNITY];

export const CommunityMarquee: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth continuous auto-sliding marquee effect
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      if (!isHovered && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        container.scrollLeft += 0.7; // Smooth auto slide speed

        // Reset scroll position seamlessly when reaching 1/3 of total width
        const singleSetWidth = container.scrollWidth / 3;
        if (singleSetWidth > 0 && container.scrollLeft >= singleSetWidth * 2) {
          container.scrollLeft -= singleSetWidth;
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered]);

  return (
    <section id="community" className="py-20 sm:py-28 bg-[#FAFAF9] text-[#1A1A1A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-[#1A1A1A] font-sans leading-[1.15] mb-4">
            Trusted by Over 25k+ <br className="hidden sm:inline" />
            <span className="italic font-serif-custom font-normal">Happy Shoppers</span>
          </h2>

          <p className="text-xs sm:text-sm text-[#5E5E5E] max-w-xl leading-relaxed mb-6">
            The people of the avenue — the sellers behind the shops and the shoppers behind the orders. Real faces, real finds, real deliveries.
          </p>

          <Link
            to="/sell"
            className="px-6 py-2.5 rounded-full border border-neutral-800 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all text-xs sm:text-sm font-medium inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Join the Avenue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Community Cards Carousel with Moving Slider Animation */}
        <div
          className="relative py-4"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Left White Fade Overlay - Ultra Soft Multi-Stop Gradient */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-32 md:w-44 bg-gradient-to-r from-[#FAFAF9] via-[#FAFAF9]/80 via-[#FAFAF9]/30 to-transparent z-20" />

          {/* Right White Fade Overlay - Ultra Soft Multi-Stop Gradient */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-32 md:w-44 bg-gradient-to-l from-[#FAFAF9] via-[#FAFAF9]/80 via-[#FAFAF9]/30 to-transparent z-20" />

          {/* Scrollable Community Cards Row */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-5 sm:gap-6 overflow-x-auto scrollbar-none py-4 px-6 sm:px-16 md:px-24 [mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)]"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {INFINITE_COMMUNITY.map((member, index) => (
              <div
                key={`${member.name}-${index}`}
                className="group relative flex-none w-[280px] sm:w-[320px] md:w-[350px] h-[500px] rounded-xl overflow-hidden bg-neutral-900 cursor-pointer select-none shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
              >
                {/* Full Card Background Image */}
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">

                  {/* Member Info */}
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">{member.name}</h4>
                    <span className="text-xs text-white/80 block tracking-tight font-sans mt-0.5">{member.title}</span>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

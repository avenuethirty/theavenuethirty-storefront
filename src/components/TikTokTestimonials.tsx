import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'motion/react';
import { Volume2, VolumeX, Play } from 'lucide-react';

export interface TikTokItem {
  id: string;
  creatorHandle: string;
  creatorName: string;
  creatorRole: string;
  views: string;
  likes: string;
  duration: string;
  quote: string;
  productName: string;
  productPrice: string;
  posterUrl: string;
  videoUrl: string;
  verified: boolean;
}

const TIKTOK_TESTIMONIALS: TikTokItem[] = [
  {
    id: '1',
    creatorHandle: '@ayesha.style',
    creatorName: 'Ayesha Khan',
    creatorRole: 'Verified Shopper • Skincare',
    views: '184.2K',
    likes: '24.1K',
    duration: '0:18',
    quote: 'Ordered my skincare bundle with Cash on Delivery. The parcel arrived in two days, exactly as shown on the avenue.',
    productName: 'Glow Ritual Skincare Set',
    productPrice: 'Rs. 4,500',
    posterUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.dropbox.com/scl/fi/9msmi2i6ngl9s2ahjyhh4/From-Klickpin.com-Confident-real-talk-lines-with-charm-and-useful-ideas-for-thoughtful-sharing-for-quiet-confidence-pin-id-600526931577072002.mp4?rlkey=65bxfmv3570z4i7j8n6e6no7c&raw=1',
    verified: true,
  },
  {
    id: '2',
    creatorHandle: '@fatima.bags',
    creatorName: 'Fatima Raza',
    creatorRole: 'Bags & Accessories Lover',
    views: '320.5K',
    likes: '45.8K',
    duration: '0:24',
    quote: 'The structured bag I ordered looks even better in person. Real images, honest prices, no surprises at all.',
    productName: 'Luna Structured Handbag',
    productPrice: 'Rs. 3,890',
    posterUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.dropbox.com/scl/fi/0vjnxog9celys6oj62fy2/From-Klickpin.com-Elegant-alteration-hacks-for-people-who-love-beauty-for-living-for-practical-creative-living-pin-id-11822017768226863.mp4?rlkey=pdaw57bwf8tw1tj6luycj7tma&raw=1',
    verified: true,
  },
  {
    id: '3',
    creatorHandle: '@zara.unboxes',
    creatorName: 'Zara Malik',
    creatorRole: 'Verified Shopper • Jewellery',
    views: '295.8K',
    likes: '38.2K',
    duration: '0:15',
    quote: 'Delicate jewellery that actually lasts. The order confirmation on WhatsApp took under a minute. So easy.',
    productName: 'Dawn Link Bracelet',
    productPrice: 'Rs. 2,990',
    posterUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.dropbox.com/scl/fi/hm10s1nwfd7yuge2bjo25/From-Klickpin.com-Steal-these-easy-wedding-decor-tips-that-turn-ordinary-ideas-into-scroll-stopping-inspiration-using-simple-ideas-you-can-actual.mp4?rlkey=8q7rz7rlieeo1jtrv0jr735g1&raw=1',
    verified: true,
  },
  {
    id: '4',
    creatorHandle: '@maryam.finds',
    creatorName: 'Maryam Sheikh',
    creatorRole: 'Verified Shopper • Kids',
    views: '168.5K',
    likes: '21.3K',
    duration: '0:22',
    quote: 'Toys for my kids arrived well-packed and exactly as described. Paying on delivery made it completely stress-free.',
    productName: "Kids' Play & Learn Set",
    productPrice: 'Rs. 3,100',
    posterUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.dropbox.com/scl/fi/fckb0z8iwht269rpnvdjv/From-Klickpin.com-Try-Smart-road-trip-essentials-that-are-perfect-for-beginners-who-still-want-an-impressive-result-for-your-next-Pinterest-save.mp4?rlkey=vzrd7k4mggd4pc9eoocrxatut&raw=1',
    verified: true,
  },
  {
    id: '5',
    creatorHandle: '@hina.curated',
    creatorName: 'Hina Ali',
    creatorRole: 'Marketplace Reviewer',
    views: '280.1K',
    likes: '34.9K',
    duration: '0:19',
    quote: 'The Avenue Thirty is my first stop for gifts now. Curated shops, real reviews, and orders that just work.',
    productName: 'Curated Gift Edit',
    productPrice: 'Rs. 3,650',
    posterUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.dropbox.com/scl/fi/7mykt7nyeuw5elnbb3gx7/From-Klickpin.com-Unique-Brunch-Ideas-Worth-Trying-pin-id-856528422895994614.mp4?rlkey=ftc14e7ews5gqt0jccvkh1h9u&raw=1',
    verified: true,
  },
];

interface TikTokTestimonialsProps {
  onAddToCart?: (productName: string, price: string) => void;
}

interface VideoCardProps {
  item: TikTokItem;
  isCenter: boolean;
  isMuted: boolean;
  onEnded: () => void;
  onToggleMute: (e: React.MouseEvent) => void;
  onClick: () => void;
  circularTransforms: {
    rotateY: number;
    scale: number;
    zIndex: number;
    opacity: number;
  };
  multiplier: number;
  spread: MotionValue<number>;
}

const VideoCard: React.FC<VideoCardProps> = ({
  item,
  isCenter,
  isMuted,
  onEnded,
  onToggleMute,
  onClick,
  circularTransforms,
  multiplier,
  spread,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const xTransform = useTransform(spread, (v: number) => multiplier * v);

  useEffect(() => {
    if (videoRef.current) {
      if (isCenter) {
        videoRef.current.currentTime = 0;
      }
      videoRef.current.muted = isCenter ? isMuted : true;
      videoRef.current.play().catch(() => {});
    }
  }, [isCenter, item.id, isMuted]);

  return (
    <motion.div
      key={item.id}
      animate={circularTransforms}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="group relative flex-none w-[160px] sm:w-[190px] md:w-[215px] lg:w-[235px] aspect-[9/16] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer select-none origin-center"
      style={{ x: xTransform, transformStyle: 'preserve-3d' }}
    >
      <video
        ref={videoRef}
        src={item.videoUrl}
        autoPlay
        loop={!isCenter}
        onEnded={isCenter ? onEnded : undefined}
        muted={isCenter ? isMuted : true}
        playsInline
        preload="auto"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 bg-neutral-900"
      />

      {/* Sound Toggle Icon (Top Right) - Only visible on the center video */}
      {isCenter && (
        <button
          onClick={onToggleMute}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-90 hover:opacity-100 shadow-md cursor-pointer"
          title={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}

      {/* Center Play Button on Hover (for non-center cards) */}
      {!isCenter && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const TikTokTestimonials: React.FC<TikTokTestimonialsProps> = () => {
  const [activeOriginalIndex, setActiveOriginalIndex] = useState(2);
  const [isCenterMuted, setIsCenterMuted] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Calculate spread distance based on scroll position relative to viewport
  const rawSpread = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    [220, 0, 0]
  );
  const spread = useSpring(rawSpread, { stiffness: 90, damping: 20, mass: 0.6 });

  const N = TIKTOK_TESTIMONIALS.length;

  const handleCenterVideoEnded = () => {
    setActiveOriginalIndex((prev) => (prev + 1) % N);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCenterMuted((prev) => !prev);
  };

  // 5 slots arranged so activeOriginalIndex is ALWAYS physically in slot index 2 (center)
  const slotIndices = [
    (activeOriginalIndex - 2 + N) % N,
    (activeOriginalIndex - 1 + N) % N,
    activeOriginalIndex,
    (activeOriginalIndex + 1) % N,
    (activeOriginalIndex + 2) % N,
  ];

  return (
    <section ref={sectionRef} id="video-testimonials" className="py-20 sm:py-28 bg-[#FAFAF9] text-[#1A1A1A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-[#1A1A1A] font-sans leading-[1.15] mb-4">
            Real shopper reviews, <br className="hidden sm:inline" />
            <span className="italic font-serif-custom font-normal">verified marketplace orders</span>
          </h2>

          <p className="text-xs sm:text-sm text-[#5E5E5E] max-w-xl leading-relaxed">
            Real people, real orders, real deliveries. See what shoppers across Pakistan say about their finds on the avenue.
          </p>
        </div>

        {/* 5 Video Cards Container with Left & Right Gradient Overlays */}
        <div className="relative py-6 sm:py-10">
          {/* Left White Overlay */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-20 md:w-32 bg-gradient-to-r from-[#FAFAF9] via-[#FAFAF9]/90 to-transparent z-20" />

          {/* Right White Overlay */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-20 md:w-32 bg-gradient-to-l from-[#FAFAF9] via-[#FAFAF9]/90 to-transparent z-20" />

          {/* Video Cards 3D Circular Gallery displaying 5 cards with exact 10px gap */}
          <div
            ref={scrollContainerRef}
            className="flex justify-center items-center gap-[10px] overflow-x-auto py-8 px-2 no-scrollbar min-h-[480px] sm:min-h-[540px]"
            style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
          >
            {slotIndices.map((origIdx, slotPos) => {
              const item = TIKTOK_TESTIMONIALS[origIdx];
              const isCenter = slotPos === 2;

              // 3D Circular Gallery rotational transforms
              const circularTransforms = [
                { rotateY: 30, scale: 0.82, zIndex: 10, opacity: 0.75 },  // 0: Far Left
                { rotateY: 16, scale: 0.92, zIndex: 20, opacity: 0.9 },   // 1: Near Left
                { rotateY: 0, scale: 1.12, zIndex: 30, opacity: 1 },      // 2: Center (Larger, facing front)
                { rotateY: -16, scale: 0.92, zIndex: 20, opacity: 0.9 },  // 3: Near Right
                { rotateY: -30, scale: 0.82, zIndex: 10, opacity: 0.75 }, // 4: Far Right
              ][slotPos];

              const multiplier = slotPos - 2;

              return (
                <VideoCard
                  key={item.id}
                  item={item}
                  isCenter={isCenter}
                  isMuted={isCenterMuted}
                  onEnded={handleCenterVideoEnded}
                  onToggleMute={toggleMute}
                  onClick={() => setActiveOriginalIndex(origIdx)}
                  circularTransforms={circularTransforms}
                  multiplier={multiplier}
                  spread={spread}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

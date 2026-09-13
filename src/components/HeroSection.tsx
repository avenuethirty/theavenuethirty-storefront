import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion } from 'motion/react';
import { SHOP_CONFIG } from '../config/shop';

interface HeroSectionProps {
  onStartAiChat: (query?: string) => void;
}

const TYPEWRITER_PROMPTS = [
  'What jewellery do you recommend?',
  'Show me skincare under Rs 2,000',
  'Gift ideas for kids?',
  'Which bags are trending?',
  'What is new on the avenue?'
];

const QUICK_ACTIONS = [
  'Skincare under Rs 2,000',
  'Jewellery picks',
  'Gifts for kids',
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartAiChat }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  // Typewriter Animation State
  const [placeholderText, setPlaceholderText] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Pause typewriter animation when user is actively typing or focused
    if (isFocused || query.trim().length > 0) return;

    const currentPrompt = TYPEWRITER_PROMPTS[promptIndex];
    const typingSpeed = isDeleting ? 25 : 55;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setPlaceholderText(currentPrompt.substring(0, placeholderText.length + 1));
        if (placeholderText.length + 1 === currentPrompt.length) {
          setTimeout(() => setIsDeleting(true), 2400); // Pause before deleting
        }
      } else {
        setPlaceholderText(currentPrompt.substring(0, placeholderText.length - 1));
        if (placeholderText.length - 1 === 0) {
          setIsDeleting(false);
          setPromptIndex((prev) => (prev + 1) % TYPEWRITER_PROMPTS.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, promptIndex, isFocused, query]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalMsg = query.trim() || placeholderText || 'What do you recommend?';
    onStartAiChat(finalMsg);
  };

  return (
    <section id="hero" className="relative w-full min-h-[85vh] sm:min-h-screen pt-24 pb-10 sm:pb-16 flex flex-col justify-end items-center overflow-hidden bg-neutral-900 text-white">
      {/* Background Media Layer: video wins, image is fallback */}
      <div className="absolute inset-0 z-0">
        {SHOP_CONFIG.hero.video && !videoFailed ? (
          <video
            src={SHOP_CONFIG.hero.video}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoFailed(true)}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <img
            src={SHOP_CONFIG.hero.image}
            alt={SHOP_CONFIG.hero.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center scale-105"
          />
        )}
        {/* Dark Gradient Overlay only at the bottom for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      {/* Main Hero Center Content */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center space-y-6 pt-6">

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-[34px] font-medium tracking-tight text-white drop-shadow-md font-sans"
        >
          {SHOP_CONFIG.hero.title}
        </motion.h1>

        {/* Floating AI Prompt Box with Animated Typing Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="w-full bg-white/95 backdrop-blur-xl border border-white/80 rounded-[28px] p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] text-[#1A1A1A] flex flex-col justify-between transition-all"
        >
          {/* Animated Input Text Area */}
          <form onSubmit={handleSubmit} className="w-full relative">
            <textarea
              rows={2}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={query ? '' : `${placeholderText}${isFocused ? '' : '│'}`}
              className="w-full bg-transparent text-[#1A1A1A] placeholder:text-neutral-500 text-sm sm:text-base font-normal resize-none focus:outline-none px-1 py-1"
            />
          </form>

          {/* Bottom Action Bar inside prompt card */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => onStartAiChat(action)}
                  className="text-[9px] font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100 hover:bg-neutral-200 hover:text-neutral-900 px-2 py-0.5 rounded-full border border-neutral-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  {action}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="w-9 h-9 rounded-full bg-[#525252] hover:bg-[#1A1A1A] text-white flex items-center justify-center shadow transition-all cursor-pointer active:scale-95 shrink-0"
              title="Send query"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

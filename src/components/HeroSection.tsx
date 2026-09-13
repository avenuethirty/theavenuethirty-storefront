import React, { useState, useEffect } from 'react';
import { ArrowUp, ShieldCheck, Banknote, MessagesSquare } from 'lucide-react';
import { motion } from 'motion/react';

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

const TRUST_BADGES = [
  { label: 'Verified sellers', icon: ShieldCheck },
  { label: 'Cash on Delivery', icon: Banknote },
  { label: 'Platform-backed support', icon: MessagesSquare },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartAiChat }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

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
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://res.cloudinary.com/mpdpiwxv/image/upload/f_auto,q_auto/Woman_with_glossy_skin_framing_202608021538_tqopqh"
          alt="Lifestyle shopping backdrop"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-105"
        />
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
          Your Avenue to Confident Living
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
          className="text-sm sm:text-base text-white/85 max-w-md leading-relaxed"
        >
          Fashion, beauty, and more from verified sellers across Pakistan. Cash on Delivery.
        </motion.p>

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
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest pl-1">
              Ask our shopping assistant
            </span>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="w-9 h-9 rounded-full bg-[#525252] hover:bg-[#1A1A1A] text-white flex items-center justify-center shadow transition-all cursor-pointer active:scale-95"
              title="Send query"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Trust Badge Row */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.32 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {TRUST_BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <span key={badge.label} className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/80">
                <Icon className="w-3.5 h-3.5" />
                {badge.label}
              </span>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
};

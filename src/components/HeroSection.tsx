import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, ArrowUp, Upload } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroSectionProps {
  onStartAiChat: (query?: string) => void;
}

const TYPEWRITER_PROMPTS = [
  "Is this mole or spot normal?",
  "How do I treat hormonal cystic breakouts?",
  "Is my skin barrier damaged and sensitive?",
  "Prescription recommendations for dark spots & melasma...",
  "How to treat sudden redness and rosacea flare-ups?",
  "How long does acne treatment with prescription Tretinoin take?"
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartAiChat }) => {
  const [query, setQuery] = useState('');
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const defaultText = placeholderText || 'Is this mole normal? Please analyze my skin condition.';
    const finalMsg = selectedImageName
      ? `[Photo Analysis: ${selectedImageName}] ${query || defaultText}`
      : query.trim() || defaultText;
    onStartAiChat(finalMsg);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageName(file.name);
    }
  };

  return (
    <section id="hero" className="relative w-full min-h-[85vh] sm:min-h-screen pt-24 pb-10 sm:pb-16 flex flex-col justify-end items-center overflow-hidden bg-neutral-900 text-white">
      {/* Background Image Layer - Sunlit living room with natural garden window */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://res.cloudinary.com/mpdpiwxv/image/upload/f_auto,q_auto/Woman_with_glossy_skin_framing_202608021538_tqopqh"
          alt="Woman with glossy skin framing face"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-105"
        />
        {/* Dark Gradient Overlay only at the bottom for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      {/* Hidden File Input for Image Analysis */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main Hero Center Content */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center space-y-6 pt-6">
        
        {/* Main Headline - Welcoming & Empathetic */}
        <motion.h1
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-[34px] font-medium tracking-tight text-white drop-shadow-md font-sans"
        >
          How is your skin feeling today?
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
              placeholder={query ? "" : `${placeholderText}${isFocused ? "" : "│"}`}
              className="w-full bg-transparent text-[#1A1A1A] placeholder:text-neutral-500 text-sm sm:text-base font-normal resize-none focus:outline-none px-1 py-1"
            />
          </form>

          {/* Selected Image File Badge */}
          {selectedImageName && (
            <div className="mb-2 self-start flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] px-2.5 py-1 rounded-full animate-fade-in">
              <Upload className="w-3 h-3 text-amber-800" />
              <span className="truncate max-w-[200px] font-medium">{selectedImageName}</span>
              <button
                type="button"
                onClick={() => setSelectedImageName(null)}
                className="ml-1 text-amber-900 font-bold hover:text-black cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* Bottom Action Bar inside prompt card */}
          <div className="flex items-center justify-between pt-2 border-t border-black/5 mt-1">
            {/* Left Button: Analyze Image */}
            <button
              type="button"
              onClick={handleImageClick}
              className="bg-neutral-100 hover:bg-neutral-200 border border-black/5 text-[#1A1A1A] text-xs font-semibold px-3.5 py-2 rounded-full flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-neutral-700" />
              <span>Analyze Image</span>
            </button>

            {/* Right Buttons: Voice Mic & Send Arrow */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStartAiChat('Consultation via active voice recording')}
                className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 text-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-9 h-9 rounded-full bg-[#525252] hover:bg-[#1A1A1A] text-white flex items-center justify-center shadow transition-all cursor-pointer active:scale-95"
                title="Send query"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

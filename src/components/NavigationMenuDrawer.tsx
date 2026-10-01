import React, { useRef } from "react";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LogoSvg } from "./Logo";
import { SHOP_CONFIG } from "../config/shop";
import { Link } from "react-router-dom";
import { useOverlayLock } from "../utils/overlay";

interface NavigationMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConsultation: () => void;
}

export const NavigationMenuDrawer: React.FC<NavigationMenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenConsultation,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * The same non-working `body { overflow: hidden }` the other two drawers
   * used, replaced by the shared lock: Lenis `stop()` plus an overflow on
   * `documentElement`, which is the scroller this site actually uses.
   */
  useOverlayLock({ active: isOpen, onRequestClose: onClose, panelRef });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-md flex justify-end"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative w-full max-w-sm bg-[#1A1A1A] text-white h-full shadow-2xl flex flex-col justify-between border-l border-white/10 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <Link to="/" onClick={onClose} className="flex items-center">
                 <LogoSvg className="h-[18px] w-auto text-white" />
              </Link>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6" data-lenis-prevent>
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#9A8C83] block mb-2">
                Shop by Category
              </span>

              <div className="space-y-1">
                {SHOP_CONFIG.categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/product/${cat.slug}`}
                    onClick={onClose}
                    className="block px-3 py-2.5 text-sm font-medium text-neutral-200 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/40 space-y-3">
              <button
                onClick={() => {
                  onClose();
                  onOpenConsultation();
                }}
                className="w-full bg-white text-[#1A1A1A] hover:bg-neutral-100 font-semibold text-xs uppercase tracking-widest py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-amber-900" />
                <span>Chat with Shopping Assistant</span>
              </button>

              <Link
                to="/sell"
                onClick={onClose}
                className="block w-full text-center border border-white/30 text-white hover:bg-white/10 font-semibold text-xs uppercase tracking-widest py-4 rounded-full transition-all"
              >
                Sell With Us
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

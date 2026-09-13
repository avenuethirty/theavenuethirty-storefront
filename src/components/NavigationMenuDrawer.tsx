import React from "react";
import { X, Sparkles } from "lucide-react";
import { LogoSvg } from "./Logo";
import { CATEGORIES } from "../utils/category";
import { Link } from "react-router-dom";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-md animate-fade-in flex justify-start">
      <div className="relative w-full max-w-sm bg-[#1A1A1A] text-white h-full shadow-2xl flex flex-col justify-between border-r border-white/10">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <Link to="/" onClick={onClose} className="flex items-center">
             <LogoSvg className="h-8 w-auto text-white" />
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

          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
                <span>{cat.label}</span>
              </div>
              <div className="space-y-0.5 ml-2 border-l border-white/5 pl-3">
                {cat.subCategories.map((sub) => (
                  <Link
                    key={sub.href}
                    to={`/product/${cat.key}`}
                    onClick={onClose}
                    className="block px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
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

          <p className="text-[10px] uppercase tracking-widest text-center text-white/50 font-medium">
            The Avenue Thirty, Curated for You
          </p>
        </div>
      </div>
    </div>
  );
};

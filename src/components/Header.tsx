import React from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, ShoppingBag, Menu } from "lucide-react";
import { LogoSvg } from "./Logo";
import { SHOP_CONFIG } from "../config/shop";
import { Link } from "react-router-dom";

interface HeaderProps {
  cartCount: number;
  isSignedIn?: boolean;
  onOpenCart: () => void;
  onOpenSignIn: () => void;
  onOpenConsultation: () => void;
  onOpenMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  isSignedIn = false,
  onOpenCart,
  onOpenSignIn,
  onOpenConsultation,
  onOpenMenu,
}) => {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 180) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const textColorClass = isScrolled ? "text-[#1A1A1A]" : "text-white";
  const bgHoverClass = isScrolled ? "hover:bg-black/5" : "hover:bg-white/10";

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 pointer-events-none transition-all duration-300 ${textColorClass} ${!isHome && !isScrolled ? 'bg-[#1A1A1A]' : ''} ${isScrolled ? 'glass-header' : ''}`}
    >
      <div className="w-full pointer-events-auto py-2">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center">
          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={onOpenConsultation}
              className={`p-2 transition-all cursor-pointer flex items-center justify-center rounded-xl hover:opacity-75 ${bgHoverClass}`}
              title="AI Chat"
              aria-label="AI Chat"
            >
              <Sparkles className="w-5 h-5 currentColor" />
            </button>
          </div>

          <Link
            to="/"
            className="hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center justify-center"
            aria-label="Home"
          >
             <LogoSvg className="h-[18px] w-auto transition-colors duration-300" />
          </Link>

          <div className="flex-1 flex items-center justify-end gap-3">
            <button
              id="header-cart-btn"
              onClick={onOpenCart}
              className={`relative p-2 rounded-full transition-colors cursor-pointer ${
                isScrolled ? "hover:bg-black/5" : "hover:bg-white/10"
              }`}
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#18181B] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={onOpenMenu}
              className={`p-2 transition-all cursor-pointer flex items-center justify-center rounded-xl hover:opacity-75 ${bgHoverClass}`}
              title="Menu"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 currentColor" />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-[auto_1fr_auto] items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenConsultation}
              className={`p-2 transition-all cursor-pointer flex items-center justify-center rounded-xl hover:opacity-75 ${bgHoverClass}`}
              title="AI Chat"
              aria-label="AI Chat"
            >
              <Sparkles className="w-5 h-5 currentColor" />
            </button>

            <Link
              to="/"
              className="hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center justify-center"
              aria-label="Home"
            >
               <LogoSvg className="h-[18px] w-auto transition-colors duration-300" />
            </Link>
          </div>

          <nav className="flex items-center justify-center gap-1 md:gap-2">
            {SHOP_CONFIG.categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/product/${cat.slug}`}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                  isScrolled ? "hover:bg-black/5" : "hover:bg-white/10"
                }`}
                aria-label={cat.name}
              >
                <span>{cat.name}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-5 md:gap-6 shrink-0">
            {!isSignedIn ? (
              <button
                id="header-signup-btn"
                onClick={onOpenSignIn}
                className="text-sm font-medium hover:opacity-75 transition-opacity cursor-pointer"
              >
                Sign Up
              </button>
            ) : (
              <button
                id="header-account-btn"
                onClick={onOpenSignIn}
                className="text-sm font-medium hover:opacity-75 transition-opacity cursor-pointer"
              >
                Account
              </button>
            )}
            <button
              id="header-cart-btn"
              onClick={onOpenCart}
              className={`relative p-2 rounded-full transition-colors cursor-pointer ${
                isScrolled ? "hover:bg-black/5" : "hover:bg-white/10"
              }`}
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#18181B] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

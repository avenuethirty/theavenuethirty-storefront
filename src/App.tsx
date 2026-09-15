import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Lenis from 'lenis';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AiChatPage } from './components/AiChatPage';
import { CartDrawer } from './components/CartDrawer';
import { NavigationMenuDrawer } from './components/NavigationMenuDrawer';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './components/CategoryPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FaqPage } from './pages/FaqPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SellPage } from './pages/SellPage';
import { Product, CartItem } from './types';
import { fetchCatalogue } from './utils/catalogue';

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [catalogueReady, setCatalogueReady] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();
  const lenisRef = useRef<Lenis | null>(null);
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  // Only the pagination param should scroll-reset — changing sort/price/rating
  // filters keeps the scroll position.
  const pageNumber = searchParams.get('page');

  useEffect(() => {
    fetchCatalogue()
      .then((products) => setCatalogue(products))
      .finally(() => setCatalogueReady(true));
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Reset scroll to top on every page change, and when the ?page= param
  // changes (pagination shows a fresh result set, so start from the top).
  // Other query-string changes (e.g. sort/price/rating filters) keep position.
  useLayoutEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, pageNumber]);

  const handleOpenAiChat = (query?: string) => {
    navigate('/ai-shopping', { state: { initialQuery: query || '' } });
  };

  const handleAddToCart = (product: Product, customFormulaName?: string) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          customFormulaName,
          frequency: 'Monthly'
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
      <Header
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenConsultation={() => handleOpenAiChat()}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onStartAiChat={handleOpenAiChat}
                onAddToCart={(product) => {
                  handleAddToCart(product);
                  setIsCartOpen(true);
                }}
                products={catalogue}
                catalogueReady={catalogueReady}
              />
            }
          />
          <Route path="/product/:slug" element={<CategoryPage onAddToCart={handleAddToCart} onOpenConsultation={() => handleOpenAiChat()} cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} products={catalogue} catalogueReady={catalogueReady} />} />
          <Route path="/product/:slug/:typeSlug" element={<CategoryPage onAddToCart={handleAddToCart} onOpenConsultation={() => handleOpenAiChat()} cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} products={catalogue} catalogueReady={catalogueReady} />} />
          <Route path="/ai-shopping" element={<AiChatPage onAddToCart={handleAddToCart} products={catalogue} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage onOpenConsultation={(query) => handleOpenAiChat(query)} />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/sell" element={<SellPage />} />
        </Routes>
      </main>

      <Footer />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      <NavigationMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenConsultation={() => handleOpenAiChat()}
      />
    </div>
  );
}

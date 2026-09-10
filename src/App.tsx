import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AiChatPage } from './components/AiChatPage';
import { CartDrawer } from './components/CartDrawer';
import { SignInModal } from './components/SignInModal';
import { NavigationMenuDrawer } from './components/NavigationMenuDrawer';
import { ConsultationQuizModal } from './components/ConsultationQuizModal';
import { useNavigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './components/CategoryPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FaqPage } from './pages/FaqPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { Product, CartItem } from './types';
import { PRODUCTS } from './data/mockData';

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      product: PRODUCTS[0],
      quantity: 1,
      customFormulaName: 'Avenue Custom Formulation #A-24',
      frequency: 'Monthly'
    }
  ]);

  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatQuery, setAiChatQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (isAiChatOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAiChatOpen]);

  const handleOpenAiChat = (query?: string) => {
    setAiChatQuery(query || '');
    setIsAiChatOpen(true);
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
      {!isAiChatOpen && (
        <Header
          cartCount={cartCount}
          isSignedIn={isSignedIn}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenSignIn={() => setIsSignInOpen(true)}
          onOpenConsultation={() => handleOpenAiChat()}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
      )}

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
                onOpenConsultation={(query) => handleOpenAiChat(query || 'Prescription product recommendations for my skin')}
              />
            }
          />
          <Route path="/product/:slug" element={<CategoryPage onAddToCart={handleAddToCart} onOpenConsultation={() => handleOpenAiChat()} cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </main>

      {!isAiChatOpen && <Footer />}

      {isAiChatOpen && (
        <AiChatPage
          initialQuery={aiChatQuery}
          onBackToHome={() => setIsAiChatOpen(false)}
          onAddToCart={handleAddToCart}
          cartCount={cartCount}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      <ConsultationQuizModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSignInSuccess={() => setIsSignedIn(true)}
      />

      <NavigationMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenConsultation={() => handleOpenAiChat()}
      />
    </div>
  );
}

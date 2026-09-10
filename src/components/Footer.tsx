import React from 'react';
import { ArrowUp } from 'lucide-react';
import { LogoSvg } from './Logo';
import { SHOP_CONFIG } from '../config/shop';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { name: 'Instagram', href: SHOP_CONFIG.social.instagram },
    { name: 'TikTok', href: SHOP_CONFIG.social.tiktok },
    { name: 'X', href: SHOP_CONFIG.social.x },
    { name: 'Snapchat', href: SHOP_CONFIG.social.snapchat },
  ];

  return (
    <footer id="footer-section" className="bg-[#1A1A1A] text-white pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center">
              <Link to="/" aria-label="Home">
                <LogoSvg className="h-5 w-auto text-white" />
              </Link>
            </div>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              Bespoke medical skincare compounded by board-certified dermatologists. Science-backed topical treatments adapted precisely to your evolving skin barrier.
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-neutral-400">
            <div>
              <span className="font-bold text-white block mb-3 uppercase tracking-widest text-[10px]">Shop</span>
              <ul className="space-y-2">
                {SHOP_CONFIG.categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link to={`/product/${cat.slug}`} className="hover:text-white transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-bold text-white block mb-3 uppercase tracking-widest text-[10px]">Company</span>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-white block mb-3 uppercase tracking-widest text-[10px]">Connect With Us</span>
              <ul className="space-y-2">
                {socialLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} The Avenue Thirty. All rights reserved.</p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all text-xs uppercase tracking-widest"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};

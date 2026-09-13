import React, { useState } from 'react';
import { MessageCircle, Sparkles, Mail, Phone, ChevronDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SHOP_CONFIG } from '../config/shop';

const WHATSAPP_HELP_URL = `https://wa.me/${SHOP_CONFIG.whatsapp.number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
  'Hi, I need help with an order from The Avenue Thirty.'
)}`;

const TEL_URL = `tel:+${SHOP_CONFIG.whatsapp.number}`;

const EMAIL = 'support@theavenuethirty.com';

const QUICK_FAQS = [
  {
    question: 'How long does delivery take?',
    answer: 'Standard delivery is 3-5 business days within Pakistan. Shipping is Rs. 240, and free on orders over Rs. 5,000.',
  },
  {
    question: 'How does cash on delivery work?',
    answer: 'Place your order, confirm it via the WhatsApp checkout link, and pay the courier when your parcel arrives. No advance payment needed.',
  },
  {
    question: 'Can I return or exchange an item?',
    answer: 'We accept returns and exchanges within 7 days of delivery for unused items in original packaging. Message us on WhatsApp to start one.',
  },
  {
    question: 'How do I track my order?',
    answer: 'Message us on WhatsApp with your order number and we will share the latest delivery status.',
  },
];

const SOCIALS = [
  { name: 'Instagram', href: SHOP_CONFIG.social.instagram },
  { name: 'TikTok', href: SHOP_CONFIG.social.tiktok },
  { name: 'X', href: SHOP_CONFIG.social.x },
  { name: 'Snapchat', href: SHOP_CONFIG.social.snapchat },
];

interface ContactPageProps {
  onOpenConsultation: (query?: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onOpenConsultation }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="pt-24">
        <section className="max-w-3xl mx-auto px-6 pt-12 pb-16">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">We're here to help</h1>
          <p className="text-sm text-neutral-600 leading-relaxed mb-6">
            Orders, delivery, products, selling on The Avenue Thirty — whatever it is, pick the fastest way to reach us.
          </p>
          <span className="inline-block text-[10px] uppercase font-bold tracking-[0.25em] text-neutral-500 border border-neutral-200 rounded-full px-4 py-2">
            Mon - Fri · 9:00 AM - 6:00 PM PKT
          </span>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <a
              href={WHATSAPP_HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1A1A1A] text-white rounded-2xl p-6 flex flex-col hover:bg-black transition-all"
            >
              <MessageCircle className="w-6 h-6 mb-4" />
              <h3 className="text-sm font-semibold mb-1">WhatsApp us</h3>
              <p className="text-xs text-white/60 mb-1">+92 333 1458843</p>
              <p className="text-xs text-neutral-400 mb-5">Fastest — order questions &amp; updates</p>
              <span className="mt-auto text-[10px] uppercase font-bold tracking-[0.25em] text-white/70 flex items-center gap-1.5">
                Chat now <ArrowRight className="w-3 h-3" />
              </span>
            </a>

            <button
              onClick={() => onOpenConsultation()}
              className="bg-white text-left rounded-2xl p-6 flex flex-col border border-neutral-200 hover:border-neutral-400 transition-all cursor-pointer"
            >
              <Sparkles className="w-6 h-6 mb-4 text-amber-900" />
              <h3 className="text-sm font-semibold mb-1">Ask our AI assistant</h3>
              <p className="text-xs text-neutral-500 mb-1">Shopping assistant</p>
              <p className="text-xs text-neutral-500 mb-5">Instant — product &amp; recommendation questions</p>
              <span className="mt-auto text-[10px] uppercase font-bold tracking-[0.25em] text-neutral-500 flex items-center gap-1.5">
                Start chat <ArrowRight className="w-3 h-3" />
              </span>
            </button>

            <a
              href={`mailto:${EMAIL}`}
              className="bg-white text-left rounded-2xl p-6 flex flex-col border border-neutral-200 hover:border-neutral-400 transition-all"
            >
              <Mail className="w-6 h-6 mb-4" />
              <h3 className="text-sm font-semibold mb-1">Email us</h3>
              <p className="text-xs text-neutral-500 mb-1">{EMAIL}</p>
              <p className="text-xs text-neutral-500 mb-5">Best for receipts &amp; order records</p>
              <span className="mt-auto text-[10px] uppercase font-bold tracking-[0.25em] text-neutral-500 flex items-center gap-1.5">
                Write to us <ArrowRight className="w-3 h-3" />
              </span>
            </a>
          </div>

          <a
            href={TEL_URL}
            className="mt-4 inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-[#1A1A1A] transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Prefer to call? +92 333 1458843
          </a>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-8">Quick answers</h2>
          <div>
            {QUICK_FAQS.map((faq, index) => (
              <div key={faq.question} className="border-t border-neutral-200 last:border-b">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left cursor-pointer"
                >
                  <span className="text-sm font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <p className="text-xs text-neutral-600 leading-relaxed pb-4">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
          <Link
            to="/faq"
            className="inline-flex items-center gap-1.5 mt-6 text-xs font-medium hover:opacity-75 transition-opacity"
          >
            See all FAQs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-200 pb-24">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-sm font-medium mb-1">A brand wanting to sell with us?</p>
              <Link to="/sell" className="text-xs text-neutral-600 hover:text-[#1A1A1A] transition-colors underline underline-offset-4">
                Learn about selling on The Avenue Thirty
              </Link>
            </div>
            <div className="flex items-center gap-5">
              {SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-500 hover:text-[#1A1A1A] transition-colors"
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

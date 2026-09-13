import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQS = [
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
  {
    question: 'Do you deliver outside Pakistan?',
    answer: 'Currently we deliver within Pakistan only. Follow us on social media for updates on international shipping.',
  },
  {
    question: 'How do I sell my products on The Avenue Thirty?',
    answer: 'We would love to hear from you. Visit our Sell page to tell us about your brand and what you make.',
  },
];

export const FaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="pt-24">
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">FAQs</h1>
          <p className="text-sm text-neutral-600 leading-relaxed mb-10">
            Quick answers about orders, delivery, and returns. Can't find what you need? Contact us — we reply fast.
          </p>

          <div>
            {FAQS.map((faq, index) => (
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

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-75 transition-opacity"
            >
              Contact us <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/sell"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-[#1A1A1A] transition-colors"
            >
              Sell with us <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

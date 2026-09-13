import React, { useState } from 'react';
import { ArrowDown, MessageCircle, Phone, CheckCircle2 } from 'lucide-react';
import { SHOP_CONFIG } from '../config/shop';

const WHATSAPP_SELL_URL = `https://wa.me/${SHOP_CONFIG.whatsapp.number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
  "Hi, I'd like to sell my products on The Avenue Thirty. My brand is called ..."
)}`;

const BENEFITS = [
  {
    title: 'Zero upfront cost',
    description: 'Free onboarding and a simple listing process to get you started.',
  },
  {
    title: 'We handle discovery',
    description: 'Marketing plus our AI shopping assistant recommends your products to shoppers.',
  },
  {
    title: 'COD built-in',
    description: 'Customers already check out via WhatsApp with cash on delivery.',
  },
  {
    title: 'You keep control',
    description: 'Your pricing, your inventory. You decide what to sell and when.',
  },
];

const STEPS = [
  'Tell us about your brand using the form below.',
  'We review and list your products, photos and pricing, done for you.',
  'You get orders, and we coordinate delivery and payment.',
];

type FormState = {
  brandName: string;
  contactName: string;
  phone: string;
  email: string;
  category: string;
  message: string;
};

const initialForm: FormState = {
  brandName: '',
  contactName: '',
  phone: '',
  email: '',
  category: '',
  message: '',
};

const inputClass =
  'w-full px-4 py-3 bg-[#F8F7F4] border border-neutral-300 rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] placeholder:text-neutral-400';

export const SellPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const scrollToForm = () => {
    document.getElementById('sell-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: form.brandName,
          contactName: form.contactName,
          phone: form.phone,
          email: form.email || undefined,
          category: form.category,
          message: form.message || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setStatus('success');
      } else {
        setErrorMessage(data?.error || 'Something went wrong. Please try again or reach us on WhatsApp.');
        setStatus('error');
      }
    } catch {
      setErrorMessage('Network error. Please try again or reach us on WhatsApp.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="pt-24">
        <section className="max-w-3xl mx-auto px-6 pt-12 pb-16 text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">Sell on The Avenue Thirty</h1>
          <p className="text-sm text-neutral-600 leading-relaxed mb-8">
            Put your products in front of shoppers across Pakistan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto bg-[#1A1A1A] text-white text-xs font-semibold px-8 py-3.5 rounded-full hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              Apply Now
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <a
              href={WHATSAPP_SELL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto border border-neutral-300 text-[#1A1A1A] text-xs font-semibold px-8 py-3.5 rounded-full hover:bg-neutral-100 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat on WhatsApp
            </a>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-10 text-center">Why sell with us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold mb-2">{benefit.title}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-10 text-center">How it works</h2>
          <div className="space-y-8">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-start gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-white text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <p className="text-sm text-neutral-700 leading-relaxed pt-1.5">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-200 text-center">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-10">We're looking for</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {SHOP_CONFIG.categories.map((cat) => (
              <span
                key={cat.slug}
                className="border border-neutral-300 rounded-full px-5 py-2 text-xs text-neutral-700"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </section>

        <section id="sell-form" className="max-w-xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-2 text-center">Tell us about your brand</h2>
          <p className="text-xs text-neutral-500 text-center mb-8">Required fields are marked with an asterisk.</p>

          {status === 'success' ? (
            <div className="text-center space-y-4 py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-semibold">Thanks!</h3>
              <p className="text-sm text-neutral-600">We'll reach out within 24–48 hours.</p>
              <a
                href={WHATSAPP_SELL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#1A1A1A] text-white text-xs font-semibold px-8 py-3.5 rounded-full hover:bg-black transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Continue on WhatsApp
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.brandName}
                  onChange={update('brandName')}
                  placeholder="Your brand's name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.contactName}
                  onChange={update('contactName')}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={update('phone')}
                    placeholder="03XX XXXXXXX"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                  Category *
                </label>
                <select
                  required
                  value={form.category}
                  onChange={update('category')}
                  className={`${inputClass} appearance-none ${form.category ? '' : 'text-neutral-400'}`}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {SHOP_CONFIG.categories.map((cat) => (
                    <option key={cat.slug} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={update('message')}
                  placeholder="Anything else we should know: product range, links, photos?"
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {status === 'error' && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {errorMessage}
                  <a
                    href={WHATSAPP_SELL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 ml-1"
                  >
                    Or reach us on WhatsApp.
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold py-3.5 rounded-full transition-all disabled:opacity-60"
              >
                {status === 'submitting' ? 'Sending...' : 'Partner With Us'}
              </button>
            </form>
          )}
        </section>

        <section className="max-w-xl mx-auto px-6 py-16 pb-24 border-t border-neutral-200 text-center">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-3">Prefer to talk first?</h2>
          <p className="text-xs text-neutral-500 mb-8">Reach us directly, we're happy to answer questions.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={WHATSAPP_SELL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-[#1A1A1A] text-white text-xs font-semibold px-8 py-3.5 rounded-full hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Us
            </a>
            <a
              href={`tel:+${SHOP_CONFIG.whatsapp.number}`}
              className="w-full sm:w-auto border border-neutral-300 text-[#1A1A1A] text-xs font-semibold px-8 py-3.5 rounded-full hover:bg-neutral-100 transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Us
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowDown, MessageCircle, Phone, CheckCircle2 } from 'lucide-react';
import { SHOP_CONFIG } from '../config/shop';
import { SystemApproachSection } from '../components/SystemApproachSection';
import { AboutUsSection } from '../components/AboutUsSection';

const WHATSAPP_SELL_URL = `https://wa.me/${SHOP_CONFIG.whatsapp.number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
  "Hi, I'd like to sell my products on The Avenue Thirty. My brand is called ..."
)}`;

const PLATFORM_PROOF_ITEMS = [
  { title: '24-Hour Dispatch SLA', description: 'Fast delivery commitment for all registered brands.', },
  { title: '0 Upfront Listing Fees', description: 'No hidden costs. Only charged on completed sales.', },
  { title: '100% Managed Logistics', description: 'End-to-end fulfillment handling through our partner network.', },
];

const ONBOARDING_STEPS = [
  'Submit your label or distribution details, online presence, and catalog.',
  'Our team conducts a quick review of product quality, build standards, and origin verification.',
  'Receive auto-routed courier pickups and dispatches within a 24-hour window.',
];

const VALUE_CARDS = [
  {
    title: 'Central Fulfillment & SLA Guarantee',
    description: 'Platform-owned dispatch tracking, auto-generated AWBs, and rapid 3PL pickup directly from your hub.',
  },
  {
    title: 'Transparent Payouts',
    description: 'Predictable weekly settlements directly to your business account with clear fee breakdowns and 0 upfront listing fees.',
  },
  {
    title: 'Direct Brand Control',
    description: 'Maintain full oversight over product stock levels, retail pricing, and catalog releases.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'How do weekly payouts work?',
    answer: 'Avenue Thirty settles Net Payouts on a predictable weekly schedule directly into your registered bank account following successful order delivery.',
  },
  {
    question: 'Who handles courier dispatches across Pakistan?',
    answer: 'We manage fulfillment through central corporate accounts with top national 3PL couriers in Pakistan, picking up directly from your hub.',
  },
  {
    question: 'What are the listing fees?',
    answer: 'There are 0 upfront listing fees and zero subscription fees. We only take a agreed platform commission on completed, delivered sales.',
  },
  {
    question: 'Can distributors for tech and appliances apply?',
    answer: 'Yes. We onboard authorized fashion houses, official mobile tech distributors, and home appliance brands with verified product origins.',
  },
];

const DEPARTMENTS = [
  'Fashion',
  'Mobile Tech',
  'Appliances',
];

type FormState = {
  brandName: string;
  contactName: string;
  phone: string;
  email: string;
  category: string;
};

const initialForm: FormState = {
  brandName: '',
  contactName: '',
  phone: '',
  email: '',
  category: '',
};

const inputClass =
  'w-full px-4 py-3 bg-[#F8F7F4] border border-neutral-300 rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] placeholder:text-neutral-400';

export const SellPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">Scale Your Label & Distribution Across Major Cities in Pakistan</h1>
          <p className="text-sm text-neutral-600 leading-relaxed mb-8">
            A high-touch marketplace connecting designer fashion, mobile technology, and white appliance brands with discerning shoppers across Pakistan. Direct label control, 0 upfront listing fees, and managed fulfillment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto bg-[#1A1A1A] text-white text-xs font-semibold px-8 py-3.5 rounded-full hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              Sell on Avenue Thirty
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

        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-10 text-center">Platform Capability Proof</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLATFORM_PROOF_ITEMS.map((item) => (
              <div key={item.title} className="bg-white border border-neutral-200 rounded-2xl p-6 text-center">
                <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-10 text-center">Three-Step Onboarding Process</h2>
          <div className="space-y-8">
            {ONBOARDING_STEPS.map((step, index) => (
              <div key={step} className="flex items-start gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-white text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <p className="text-sm text-neutral-700 leading-relaxed pt-1.5">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-10 text-center">What We Offer Your Brand</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUE_CARDS.map((card) => (
              <div key={card.title} className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold mb-2">{card.title}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-neutral-200">
          <SystemApproachSection />
          <AboutUsSection />
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, index) => (
              <details
                key={index}
                className="group border border-neutral-200 rounded-2xl bg-white p-4 open:bg-neutral-50"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-sm font-semibold text-neutral-700">{faq.question}</span>
                  <ArrowDown className="w-4 h-4 text-neutral-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-xs text-neutral-600 leading-relaxed mt-3">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="sell-form" className="max-w-xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-2 text-center">Label Onboarding Application</h2>
          <p className="text-xs text-neutral-500 text-center mb-8">Enter your details below to start selling on Avenue Thirty across Pakistan.</p>

          {status === 'success' ? (
            <div className="text-center space-y-4 py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-semibold">Thanks!</h3>
              <p className="text-sm text-neutral-600">Our onboarding team will review your details and contact you via WhatsApp or email within 24 to 48 business hours.</p>
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
                  Label / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.brandName}
                  onChange={update('brandName')}
                  placeholder="Enter official label or brand name"
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
                  placeholder="Full name of primary contact"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={update('phone')}
                    placeholder="03XX-XXXXXXX"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="contact@yourbrand.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                  Primary Department *
                </label>
                <select
                  required
                  value={form.category}
                  onChange={update('category')}
                  className={`${inputClass} appearance-none ${form.category ? '' : 'text-neutral-400'}`}
                >
                  <option value="" disabled>
                    Select a department
                  </option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
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
                {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
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

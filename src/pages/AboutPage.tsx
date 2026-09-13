import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Banknote, Eye, SlidersHorizontal, Store, Sprout } from 'lucide-react';

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Trust in the Platform',
    desc: 'We earn trust as the place itself. We vet sellers, offer Cash on Delivery, and stand behind every order.',
  },
  {
    icon: Eye,
    title: 'Honest Presentation',
    desc: 'Real images. Clear prices. Clear descriptions. No inflation on behalf of any seller.',
  },
  {
    icon: Banknote,
    title: 'Cash on Delivery First',
    desc: 'Buyers pay when the order arrives. COD stays a core option even as online payments join later.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Curation Over Volume',
    desc: 'The avenue grows partner by partner. More sellers are only better if they are the right sellers.',
  },
  {
    icon: Store,
    title: 'One Avenue, Many Shops',
    desc: 'Sellers bring their own identity. The platform provides the trusted home. You shop in one place, not a scatter of listings.',
  },
  {
    icon: Sprout,
    title: 'Grow With Purpose',
    desc: 'Partner by partner. Category by category. Every step is intentional. Built to last, not to chase volume.',
  },
];

const PHASES = [
  {
    label: 'Today',
    title: 'The marketplace is live',
    desc: 'Circle Woman is our first seller, with a catalogue spanning skincare and beauty, bags, jewellery and accessories, and toys. Cash on Delivery only.',
  },
  {
    label: 'Next',
    title: 'More partners join',
    desc: 'We onboard verified sellers and brands across fashion, electronics, beauty, and more. Their products sit alongside what is here today.',
  },
  {
    label: 'Later',
    title: 'More ways to pay',
    desc: 'Online payment collection arrives alongside Cash on Delivery, giving buyers more choice while COD stays.',
  },
];

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="pt-24">
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-16">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
            Welcome to your <span className="italic font-serif-custom">avenue</span>
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            The Avenue Thirty is Pakistan's trusted marketplace for fashion, beauty, and more. Verified sellers, Cash on Delivery, and honest presentation from browse to doorstep.
          </p>
        </div>

        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-8">
            Why it is called <span className="italic font-serif-custom">The Avenue Thirty</span>
          </h2>
          <div className="space-y-5 text-sm text-neutral-700 leading-relaxed">
            <p>
              An avenue is a street lined with shops. A destination where many stores sit together, and a visitor finds what she needs by walking one path. That is exactly what The Avenue Thirty is: a marketplace where multiple sellers and brands list their products, and buyers trust the avenue itself to host only the good ones.
            </p>
            <p>
              Thirty is not an age. It is a feeling: the confident, self-assured energy of a buyer who knows what she wants. The moment you stop guessing and start choosing intentionally.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-8">Our story</h2>
          <div className="space-y-5 text-sm text-neutral-700 leading-relaxed">
            <p>
              We are not a single shop. We are an avenue. Circle Woman is our first seller, with a catalogue of skincare and beauty, bags, jewellery and accessories, and toys. More partners will join the avenue, and their products will sit alongside what is here today.
            </p>
            <p>
              We built The Avenue Thirty because shopping online in Pakistan should feel safe and easy. You should be able to browse fashion, beauty, and more from multiple sellers in one place, see products presented honestly, and pay when your order arrives. Not upfront. Not risky. Not complicated.
            </p>
            <p>
              That is the trust we build: we vet the sellers who get to list, we offer Cash on Delivery, and we take responsibility for the experience from browse to doorstep. You trust The Avenue Thirty, and that trust carries across every seller on the avenue.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-2 text-center">What we stand for</h2>
          <p className="text-xs text-neutral-500 text-center mb-10">Six values that guide every decision on the avenue.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="bg-white border border-neutral-200 rounded-2xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{value.title}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{value.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-neutral-200">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-10">Where the avenue is going</h2>
          <div className="space-y-8">
            {PHASES.map((phase) => (
              <div key={phase.label} className="flex items-start gap-4">
                <span className="flex items-center justify-center min-w-[64px] px-3 h-8 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-widest shrink-0">
                  {phase.label}
                </span>
                <div className="pt-0.5">
                  <h3 className="text-sm font-semibold mb-1">{phase.title}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{phase.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 pb-24 border-t border-neutral-200">
          <div className="bg-[#1A1A1A] text-white rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-light tracking-tight mb-2">Your shop could be on the avenue</h2>
              <p className="text-xs text-white/70 leading-relaxed max-w-sm">
                We are onboarding verified sellers across fashion, beauty, electronics, and more.
              </p>
            </div>
            <Link
              to="/sell"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#1A1A1A] text-xs font-semibold px-8 py-3.5 rounded-full hover:bg-neutral-100 transition-all shrink-0"
            >
              Sell with us
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

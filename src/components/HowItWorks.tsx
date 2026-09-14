import React from 'react';
import { Store, MessageCircle, PackageCheck } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'Browse the avenue',
    desc: 'Fashion, beauty, toys, and more from verified sellers, all in one trusted place. Presented honestly with real images and clear prices.',
    icon: Store,
  },
  {
    num: '02',
    title: 'Place Your Order',
    desc: 'Add products to your cart and confirm your order on WhatsApp. No upfront payment, no risk. You pay only when your order arrives.',
    icon: MessageCircle,
  },
  {
    num: '03',
    title: 'Delivered to your door',
    desc: 'We coordinate delivery to your address and back every order with platform support. If something goes wrong, we own the conversation.',
    icon: PackageCheck,
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-[#1A1A1A] font-sans">
            How <span className="italic font-serif-custom">Avenue Thirty</span> Works
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#5E5E5E] max-w-lg leading-relaxed">
            Shopping online in Pakistan should feel safe and easy. Here is the whole flow, from browse to doorstep.
          </p>
        </div>

        {/* 3-Column Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="group relative flex flex-col items-center text-center p-2"
              >
                <div>
                  <div className="mb-6 flex justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <Icon className="w-6 h-6 stroke-[1.75]" />
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9A8C83] block mb-2">
                    {step.num}
                  </span>

                  <h3 className="text-xl font-medium text-[#1A1A1A] tracking-tight">{step.title}</h3>

                  <p className="text-sm text-[#5E5E5E] mt-3 leading-relaxed max-w-sm">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

import React from 'react';

export const FaqPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">FAQs</h1>
        <p className="text-sm text-neutral-600 leading-relaxed mb-10">
          Quick answers to the most common questions about prescriptions, shipping, and returns.
        </p>
        <div className="space-y-8 text-sm text-neutral-700">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Are the formulas medical-grade?</h3>
            <p>Yes. All formulations are compounded by board-certified dermatologists and manufactured in certified facilities.</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">How long does shipping take?</h3>
            <p>Standard delivery is 3-5 business days within Pakistan. Express options are available at checkout.</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Can I modify my formula?</h3>
            <p>Yes. You can update active percentages and bases monthly through your patient portal or during follow-up consultations.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

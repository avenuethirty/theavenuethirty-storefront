import React from 'react';

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">Contact Us</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Have questions about formulations, prescriptions, or orders? Reach out and our team will respond within one business day.
        </p>
        <div className="mt-10 space-y-6 text-sm text-neutral-700">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Email</h3>
            <p>support@theavenuethirty.com</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">WhatsApp</h3>
            <p>+92 333 1458843</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Hours</h3>
            <p>Mon - Fri: 9:00 AM - 6:00 PM PKT</p>
          </div>
        </div>
      </div>
    </div>
  );
};

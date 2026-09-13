import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="pt-24">
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-sm text-neutral-600 leading-relaxed mb-10">
            Your privacy matters. This policy explains how we collect, use, and protect your information.
          </p>
          <div className="space-y-6 text-sm text-neutral-700">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">What we collect</h3>
              <p className="leading-relaxed">
                We collect only the information necessary to process your order: your name, phone number, delivery address, city, and any delivery notes you choose to add.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">How we use it</h3>
              <p className="leading-relaxed">
                Your details are used to arrange delivery of your order and to reach you about it if needed. Orders are confirmed via WhatsApp, and order records are stored securely in our CRM for support and fulfilment purposes.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">What we never do</h3>
              <p className="leading-relaxed">
                We never sell your personal information to third parties, and we never use your order details for anything beyond running the marketplace and supporting your orders.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Your control</h3>
              <p className="leading-relaxed">
                You may request deletion or export of your data at any time by contacting our support team on WhatsApp or at support@theavenuethirty.com.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-sm text-neutral-600 leading-relaxed mb-10">
          Your privacy matters. This policy explains how we collect, use, and protect your information.
        </p>
        <div className="space-y-6 text-sm text-neutral-700">
          <p>
            We collect only the information necessary to process orders, coordinate prescriptions, and improve your experience.
          </p>
          <p>
            Medical records and consultation data are handled in accordance with HIPAA-equivalent standards and are never sold to third parties.
          </p>
          <p>
            You may request data deletion or export at any time by contacting our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

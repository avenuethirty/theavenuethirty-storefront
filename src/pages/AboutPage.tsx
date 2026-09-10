import React from 'react';
import { AboutUsSection } from '../components/AboutUsSection';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <AboutUsSection />
      </div>
    </div>
  );
};

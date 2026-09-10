import React from 'react';
import { Sparkles, Stethoscope, PackageCheck } from 'lucide-react';

interface HowItWorksProps {
  onStartConsultation: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartConsultation }) => {
  const steps = [
    {
      num: '01',
      title: 'Digital Consultation',
      subtitle: '5-Minute Diagnostic Quiz',
      desc: 'Answer quick questions about your skin concerns, breakout history, lifestyle, and sensitivity level.',
      icon: Sparkles
    },
    {
      num: '02',
      title: 'Doctor Prescribed',
      subtitle: 'Custom Compounded Active Ingredients',
      desc: 'A licensed U.S. dermatologist evaluates your skin profile and custom-mixes prescription ingredients at exact strengths.',
      icon: Stethoscope
    },
    {
      num: '03',
      title: 'Delivered & Adaptive',
      subtitle: 'Free Shipping Every 60 Days',
      desc: 'Delivered directly to your door. As your skin improves, your assigned doctor adjusts ingredient dosages automatically.',
      icon: PackageCheck
    }
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-[#1A1A1A] font-sans">
            How <span className="italic font-serif-custom">Avenue Thirty</span> Works
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#5E5E5E] max-w-lg leading-relaxed">
            Prescription skincare designed around your unique skin biology, with zero clinic waiting rooms or synthetic fillers.
          </p>
        </div>

        {/* 3-Column Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step) => {
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

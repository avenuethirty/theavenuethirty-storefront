import React, { useState } from 'react';
import { CLINICAL_RESULTS } from '../data/mockData';
import { ShieldCheck, Star, ArrowRight, Stethoscope } from 'lucide-react';

export const ClinicalResultsSlider: React.FC = () => {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const currentCase = CLINICAL_RESULTS[activeCaseIndex];

  return (
    <section id="clinical-results" className="py-20 md:py-28 bg-[#FAFAF9] text-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#9A8C83] block mb-2">
              Verified Outcomes
            </span>
            <h2 className="text-3xl sm:text-5xl font-light tracking-tight font-sans">
              Clinical Progress & <span className="italic font-serif-custom">Results</span>
            </h2>
          </div>

          <div className="mt-4 md:mt-0 flex gap-2">
            {CLINICAL_RESULTS.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => setActiveCaseIndex(idx)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-all ${
                  activeCaseIndex === idx
                    ? 'bg-[#1A1A1A] text-white shadow-md'
                    : 'bg-white border border-black/5 text-[#5E5E5E] hover:bg-neutral-100'
                }`}
              >
                Case #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Case Study Card */}
        <div className="bg-white rounded-3xl border border-black/5 p-6 md:p-10 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Images Comparison Grid (Left) */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4 relative">
            <div className="relative rounded-2xl overflow-hidden aspect-4/5 bg-gradient-to-tr from-[#E8E2DD] to-[#F5F2EF] shadow-inner">
              <img
                src={currentCase.beforeImg}
                alt="Before treatment"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover grayscale brightness-90"
              />
              <div className="absolute top-3 left-3 bg-[#1A1A1A]/80 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full backdrop-blur-md">
                BEFORE
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-4/5 bg-gradient-to-tr from-[#E8E2DD] to-[#F5F2EF] shadow-md">
              <img
                src={currentCase.afterImg}
                alt="After treatment"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-emerald-800 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full backdrop-blur-md">
                AFTER ({currentCase.timeframe})
              </div>
            </div>
          </div>

          {/* Patient Testimonial & Doctor Note (Right) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
              <span className="text-xs font-bold text-[#1A1A1A] ml-1">5.0 Verified Patient</span>
            </div>

            <blockquote className="text-xl font-normal text-[#1A1A1A] italic leading-relaxed font-serif-custom">
              "{currentCase.quote}"
            </blockquote>

            <div className="border-t border-black/5 pt-4">
              <span className="font-medium text-[#1A1A1A] text-sm block">{currentCase.patientName}</span>
              <span className="text-xs text-[#5E5E5E] block mt-0.5">Primary Concern: {currentCase.concern}</span>
            </div>

            {/* Doctor Note */}
            <div className="p-4 rounded-2xl bg-[#FAFAF9] border border-black/5 flex items-start gap-3">
              <Stethoscope className="w-5 h-5 text-[#1A1A1A] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-[#1A1A1A] block uppercase tracking-wider">Dermatologist Clinical Note</span>
                <p className="text-xs text-[#5E5E5E] mt-1 leading-relaxed">
                  {currentCase.doctorNote}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

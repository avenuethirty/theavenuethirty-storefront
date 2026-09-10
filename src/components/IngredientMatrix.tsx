import React, { useState } from 'react';
import { INGREDIENTS } from '../data/mockData';
import { Atom, ShieldCheck, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

export const IngredientMatrix: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeIng = INGREDIENTS[selectedIndex];

  return (
    <section id="ingredients" className="py-20 md:py-28 bg-[#1A1A1A] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#9A8C83] block mb-2">
            Active Compound Science
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight font-sans">
            Prescription <span className="italic font-serif-custom">Active Matrix</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-neutral-400 leading-relaxed">
            We only formulate with FDA-approved, peer-reviewed clinical actives at precise therapeutic concentrations.
          </p>
        </div>

        {/* Interactive Lab Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Ingredient Selection Tabs (Left Column) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3">
            {INGREDIENTS.map((ing, idx) => (
              <button
                key={ing.name}
                onClick={() => setSelectedIndex(idx)}
                className={`p-5 rounded-2xl text-left border transition-all duration-300 flex items-center justify-between ${
                  selectedIndex === idx
                    ? 'bg-white/10 border-white/40 shadow-xl scale-[1.02]'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/8 hover:border-white/20'
                }`}
              >
                <div>
                  <span className="text-xs font-mono font-medium text-amber-300/90 block">
                    {ing.type}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{ing.name}</h3>
                </div>
                <span className="text-xs font-mono bg-white/15 px-2.5 py-1 rounded-md text-white font-semibold">
                  {ing.strength}
                </span>
              </button>
            ))}
          </div>

          {/* Active Ingredient Inspector Detail (Right Column) */}
          <div className="lg:col-span-7 bg-white/5 border border-white/15 rounded-3xl p-8 md:p-10 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden">
            {/* Background Glow Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-300">
                    Clinical Inspector
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    {activeIng.name}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                  <Atom className="w-6 h-6 animate-spin-slow" />
                </div>
              </div>

              {/* Benefits list */}
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase text-neutral-400 block tracking-wider">
                  Targeted Mechanisms & Benefits:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeIng.benefits.map((b) => (
                    <div key={b} className="flex items-center gap-2.5 bg-white/5 p-3 rounded-xl border border-white/10">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-medium text-neutral-200">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Note */}
              <div className="mt-8 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-amber-300 block uppercase">Board Certification Note</span>
                  <p className="text-xs text-amber-100/90 mt-1 leading-relaxed">
                    {activeIng.clinicalNote}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Dosage Guarantee */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Compounded fresh upon doctor prescription
              </span>
              <span className="font-mono text-white/80 font-bold">Purity Grade: 99.8%</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

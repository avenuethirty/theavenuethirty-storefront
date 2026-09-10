import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, ArrowLeft, ShieldCheck, UserCheck, Stethoscope } from 'lucide-react';
import { Product } from '../types';

interface ConsultationQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, customFormulaName?: string) => void;
}

export const ConsultationQuizModal: React.FC<ConsultationQuizModalProps> = ({
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [step, setStep] = useState(1);
  const [selectedConcern, setSelectedConcern] = useState<string>('Acne & Breakouts');
  const [selectedSkinType, setSelectedSkinType] = useState<string>('Combination');
  const [sensitivity, setSensitivity] = useState<string>('Moderate');
  const [goals, setGoals] = useState<string[]>(['Clear Pores', 'Reduce Redness']);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (step === 3) {
      setIsGenerating(true);
      setTimeout(() => {
        setIsGenerating(false);
        setStep(4);
      }, 1200);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleGoalToggle = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter((g) => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  // Generated product recommendation based on selections
  const getCustomFormula = () => {
    if (selectedConcern.includes('Acne')) {
      return {
        name: 'Avenue Curated Pick #A-24',
        actives: [
          { name: 'Tea Tree', strength: '2%', role: 'Pore Clearance & Oil Control' },
          { name: 'Niacinamide', strength: '4%', role: 'Brightening & Barrier Support' },
          { name: 'Salicylic Acid', strength: '1%', role: 'Gentle Exfoliation & Acne Prevention' }
        ],
        description: 'A curated acne-fighting routine that clears pores and calms breakouts without stripping your skin.',
        baseProduct: {
          id: 'av30-tea-tree-facewash',
          name: 'Brighten Me Up Facewash',
          category: 'Skincare' as const,
          tagline: 'Purify and brighten with tea tree and niacinamide.',
          priceMonthly: 19.99,
          rating: 4.8,
          reviewsCount: 1240,
          imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=85',
          keyIngredients: ['Tea Tree Oil', 'Niacinamide', 'Salicylic Acid'],
          description: 'A gentle daily face wash that unclogs pores and brightens dull skin.',
          bestFor: ['Acne-Prone Skin', 'Oily Skin', 'Dullness']
        }
      };
    } else if (selectedConcern.includes('Redness')) {
      return {
        name: 'Avenue Curated Pick #R-08',
        actives: [
          { name: 'Centella Asiatica', strength: '2%', role: 'Soothing & Redness Reduction' },
          { name: 'Allantoin', strength: '0.5%', role: 'Calming & Skin Barrier Repair' },
          { name: 'Green Tea', strength: '1%', role: 'Anti-Inflammatory & Antioxidant' }
        ],
        description: 'A gentle, soothing routine engineered to calm redness and strengthen sensitive skin.',
        baseProduct: {
          id: 'av30-spf50',
          name: 'SPF 50+ Sunscreen',
          category: 'Skincare' as const,
          tagline: 'Lightweight mineral protection with zero white cast.',
          priceMonthly: 24.00,
          rating: 4.9,
          reviewsCount: 2180,
          imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=85',
          keyIngredients: ['Zinc Oxide', 'Vitamin E', 'Hyaluronic Acid'],
          description: 'Broad-spectrum mineral SPF that blends clear into all skin tones.',
          bestFor: ['Daily UV Shield', 'Sensitive Skin', 'Hyperpigmentation']
        }
      };
    } else {
      return {
        name: 'Avenue Curated Pick #V-12',
        actives: [
          { name: 'Hyaluronic Acid', strength: '2%', role: 'Deep Hydration & Plumping' },
          { name: 'Niacinamide', strength: '5%', role: 'Brightening & Even Tone' },
          { name: 'Ceramides', strength: '1%', role: 'Barrier Lock & Glow' }
        ],
        description: 'A hydration-first routine that plumps, brightens, and gives you that coveted glass-skin glow.',
        baseProduct: {
          id: 'av30-glass-skin-bundle',
          name: 'Flawless Glass Skin Bundle',
          category: 'Skincare' as const,
          tagline: 'The complete 3-step routine for dewy, translucent skin.',
          priceMonthly: 45.00,
          rating: 5.0,
          reviewsCount: 890,
          imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=85',
          keyIngredients: ['Hyaluronic Acid', 'Niacinamide', 'Ceramides'],
          description: 'Everything you need for the glass skin look: cleanser, serum, and moisturizer in one curated set.',
          bestFor: ['All Skin Types', 'Dullness', 'Dehydration']
        }
      };
    }
  };

  const formula = getCustomFormula();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#FAFAF9] text-[#1A1A1A] rounded-3xl shadow-2xl overflow-hidden border border-black/5">
        
        {/* Modal Top Header */}
        <div className="px-6 py-5 bg-white border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-semibold">
              ✦
            </div>
            <div>
              <h3 className="font-medium text-base text-[#1A1A1A]">Dermatology Consultation</h3>
              <p className="text-xs text-[#9A8C83] uppercase tracking-wider">Step {step} of 4 — Custom Profile</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAFAF9] hover:bg-neutral-200 text-[#1A1A1A] flex items-center justify-center transition-colors border border-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-neutral-100 h-1">
          <div
            className="bg-[#1A1A1A] h-1 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
          {isGenerating ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center animate-spin mb-4 text-[#111110]">
                <Sparkles className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-semibold text-[#111110]">Analyzing Skin Metrics...</h4>
              <p className="text-sm text-neutral-600 mt-2 max-w-md">
                Matching your profile against 4,000+ board-certified dermatological prescription variations.
              </p>
            </div>
          ) : step === 1 ? (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-md">
                Primary Goal
              </span>
              <h2 className="text-2xl font-bold text-[#111110] mt-3">What is your main skin concern?</h2>
              <p className="text-sm text-neutral-600 mt-1">Our board-certified dermatologists will formulate custom actives to address this directly.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                {[
                  { title: 'Acne & Breakouts', desc: 'Cysts, hormonal acne, clogged pores, red bumps' },
                  { title: 'Persistent Redness & Rosacea', desc: 'Facial flushing, visible capillaries, sensitive irritation' },
                  { title: 'Anti-Aging & Fine Lines', desc: 'Loss of firmness, crow’s feet, collagen depletion' },
                  { title: 'Hyperpigmentation & Dark Spots', desc: 'Sun spots, melasma, uneven skin tone' }
                ].map((item) => (
                  <button
                    key={item.title}
                    onClick={() => setSelectedConcern(item.title)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      selectedConcern === item.title
                        ? 'border-[#111110] bg-white shadow-md ring-1 ring-[#111110]'
                        : 'border-neutral-200 bg-white/60 hover:border-neutral-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#111110]">{item.title}</span>
                      {selectedConcern === item.title && (
                        <div className="w-5 h-5 rounded-full bg-[#111110] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : step === 2 ? (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-md">
                Skin Type & Barrier
              </span>
              <h2 className="text-2xl font-bold text-[#111110] mt-3">Describe your skin type & oil production</h2>
              <p className="text-sm text-neutral-600 mt-1">This determines the base vehicle texture (cream, lotion, or gel).</p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { title: 'Combination', desc: 'Oily T-zone, normal or dry cheeks' },
                  { title: 'Oily', desc: 'Slick shine throughout the day' },
                  { title: 'Dry & Flaky', desc: 'Tightness, roughness, prone to scaling' },
                  { title: 'Balanced / Normal', desc: 'Comfortable, neither dry nor greasy' }
                ].map((item) => (
                  <button
                    key={item.title}
                    onClick={() => setSelectedSkinType(item.title)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      selectedSkinType === item.title
                        ? 'border-[#111110] bg-white shadow-md ring-1 ring-[#111110]'
                        : 'border-neutral-200 bg-white/60 hover:border-neutral-300 hover:bg-white'
                    }`}
                  >
                    <span className="font-semibold text-sm text-[#111110] block">{item.title}</span>
                    <p className="text-xs text-neutral-500 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-neutral-200">
                <label className="text-xs font-semibold text-neutral-700 block mb-2">Sensitivity Level:</label>
                <div className="flex gap-2">
                  {['Resilient', 'Moderate', 'Highly Sensitive'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSensitivity(s)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border ${
                        sensitivity === s ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white border-neutral-200 text-neutral-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : step === 3 ? (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-md">
                Secondary Targets
              </span>
              <h2 className="text-2xl font-bold text-[#111110] mt-3">Select secondary skincare goals</h2>
              <p className="text-sm text-neutral-600 mt-1">We can add micro-ingredients to solve secondary issues at no extra cost.</p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  'Clear Pores & Blackheads',
                  'Reduce Redness',
                  'Fade Dark Spots',
                  'Smooth Rough Texture',
                  'Boost Glow & Radiance',
                  'Prevent Fine Lines'
                ].map((goal) => {
                  const isSelected = goals.includes(goal);
                  return (
                    <button
                      key={goal}
                      onClick={() => handleGoalToggle(goal)}
                      className={`p-3.5 rounded-2xl text-left border text-xs font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#111110] bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300'
                      }`}
                    >
                      <span>{goal}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Step 4: Prescription Match Result */
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-full text-xs font-medium w-fit mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Doctor Recommended Formula Match</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#111110] tracking-tight">
                {formula.name}
              </h2>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                {formula.description}
              </p>

              {/* Prescription Actives Card */}
              <div className="mt-5 p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-2 flex items-center justify-between">
                  <span>Prescription Active Ingredients</span>
                  <span className="text-emerald-700 font-bold">100% Medical Grade</span>
                </div>

                {formula.actives.map((act) => (
                  <div key={act.name} className="flex items-start justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#111110] text-sm">{act.name}</span>
                      <p className="text-neutral-500 text-[11px]">{act.role}</p>
                    </div>
                    <span className="font-mono font-bold bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded text-xs">
                      {act.strength}
                    </span>
                  </div>
                ))}
              </div>

              {/* Doctor Review Seal */}
              <div className="mt-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-amber-800 shrink-0" />
                <p className="text-xs text-amber-900 leading-snug">
                  Reviewed by <strong>Dr. Sarah Lin, MD</strong>. Your compound includes unlimited free virtual check-ins with your licensed dermatologist.
                </p>
              </div>

              {/* Price Callout */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-neutral-200">
                <div>
                  <div className="text-xs text-neutral-500">Subscription Price:</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#111110]">$19.99</span>
                    <span className="text-xs text-neutral-500">/ month</span>
                  </div>
                </div>

                <button
                  id="quiz-claim-formula-btn"
                  onClick={() => {
                    onAddToCart(formula.baseProduct, formula.name);
                    onClose();
                  }}
                  className="bg-[#111110] hover:bg-black text-white font-semibold text-sm px-6 py-3 rounded-full transition-all flex items-center gap-2 shadow-lg"
                >
                  <span>Claim Custom Formula</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 4 && !isGenerating && (
          <div className="px-6 py-4 bg-white border-t border-neutral-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="text-xs font-semibold text-neutral-600 hover:text-[#111110] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <div></div>
            )}

            <button
              id="quiz-next-step-btn"
              onClick={handleNextStep}
              className="bg-[#111110] text-white hover:bg-black font-semibold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-md"
            >
              <span>{step === 3 ? 'Generate Custom Formula' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

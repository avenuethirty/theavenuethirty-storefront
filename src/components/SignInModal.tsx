import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { LogoSvg } from './Logo';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInSuccess?: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, onSignInSuccess }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      if (onSignInSuccess) {
        onSignInSuccess();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white text-[#111110] rounded-3xl p-8 shadow-2xl border border-neutral-200">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex h-9 items-center justify-center bg-[#111110] text-white rounded-2xl px-3 mx-auto mb-3">
            <LogoSvg className="h-6 w-auto text-white" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-[#111110]">Patient Portal Sign In</h3>
          <p className="text-xs text-neutral-500 mt-1">Access your doctor prescription & formulation status</p>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-base text-[#111110]">Magic Link Sent!</h4>
            <p className="text-xs text-neutral-600">
              We emailed a secure sign-in link to <strong>{email}</strong>. Check your inbox to view your doctor prescription notes.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-[#111110] text-white text-xs font-semibold py-3 rounded-full hover:bg-black transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#F8F7F4] border border-neutral-300 rounded-xl text-xs text-[#111110] focus:outline-none focus:ring-2 focus:ring-[#111110]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#111110] hover:bg-black text-white text-xs font-semibold py-3.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>Send Secure Magic Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="text-center pt-3 border-t border-neutral-100">
              <span className="text-[11px] text-neutral-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-neutral-400" />
                256-Bit Encrypted HIPAA Medical Portal
              </span>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

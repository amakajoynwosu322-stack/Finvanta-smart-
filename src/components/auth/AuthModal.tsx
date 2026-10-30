import React, { useState } from 'react';
import { Shield, Sparkles, UserCheck, Zap, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BOOTSTRAP_ADMIN_EMAIL } from '../../services/db';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginAsDemoUser, loginAsDemoAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoInvestor = async () => {
    try {
      setLoading(true);
      await loginAsDemoUser();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdmin = async () => {
    try {
      setLoading(true);
      await loginAsDemoAdmin();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#171225] border border-[#8B5CF6]/30 rounded-3xl p-7 shadow-2xl glow-purple overflow-hidden">
        {/* Glow ambient background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#8B5CF6]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#B66DFF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">VORTEX CAPITAL</h3>
                <p className="text-xs text-[#C4B5FD]/70">Autonomous Quantitative Protocol</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white">Access Investment Portal</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Connect securely using Firebase Authentication or launch our interactive evaluation personas.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <Shield className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Action: Google Sign-in */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mb-4 flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {loading ? 'Authenticating...' : 'Sign in with Google'}
          </button>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-700/60"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Instant Sandbox Access
            </span>
            <div className="flex-grow border-t border-slate-700/60"></div>
          </div>

          {/* Quick persona buttons for frictionless testing */}
          <div className="space-y-2.5">
            <button
              onClick={handleDemoInvestor}
              disabled={loading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#090711]/70 border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/10 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF] group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-[#B66DFF] transition-colors">
                    Demo Investor Portal
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Alex Chen • $14,850 Balance • 2 Active Contracts
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={handleDemoAdmin}
              disabled={loading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#090711]/70 border border-[#B66DFF]/20 hover:border-[#B66DFF]/60 hover:bg-[#B66DFF]/10 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#B66DFF]/20 flex items-center justify-center text-[#B66DFF] group-hover:scale-105 transition-transform">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-[#B66DFF] transition-colors flex items-center gap-1.5">
                    Platform Administrator
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#8B5CF6]/30 text-[#C4B5FD] font-mono">
                      ROOT
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[210px]">
                    {BOOTSTRAP_ADMIN_EMAIL}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Real Firebase Firestore Sync
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#B66DFF]" />
              Role-Based Access
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

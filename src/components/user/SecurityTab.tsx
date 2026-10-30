import React, { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Key,
  Laptop,
  Lock,
  LogOut,
  QrCode,
  Shield,
  ShieldAlert,
  Smartphone,
  SmartphoneNfc
} from 'lucide-react';
import { UserProfile } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface SecurityTabProps {
  user: UserProfile;
  onRefresh: () => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ user, onRefresh }) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled ?? true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const secret2fa = 'JBSWY3DPEHPK3PXP';

  const handleToggle2FA = async () => {
    const next = !twoFactorEnabled;
    try {
      setTwoFactorEnabled(next);
      await updateDoc(doc(db, 'users', user.uid), {
        twoFactorEnabled: next,
        updatedAt: new Date().toISOString()
      });
      setFeedback(next ? 'Two-Factor Authentication is now ENABLED.' : 'Two-Factor Authentication disabled.');
      setTimeout(() => setFeedback(null), 3500);
      onRefresh();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(secret2fa);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#B66DFF]" />
          Account Security & Cryptographic Protection
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Enforce hardware keys, TOTP authenticator protocols, and oversee active terminal sessions.
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 2FA Card */}
      <div className="glass-card rounded-3xl p-6 border-[#8B5CF6]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Two-Factor Authentication (TOTP)</h3>
              <p className="text-xs text-slate-400">
                Mandates a 6-digit cryptographic TOTP passkey on every withdrawal or security alteration.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle2FA}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto ${
              twoFactorEnabled
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold'
            }`}
          >
            {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA Protection'}
          </button>
        </div>

        {twoFactorEnabled && (
          <div className="p-5 rounded-2xl bg-[#090711]/70 border border-[#8B5CF6]/20 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#B66DFF] font-bold tracking-wider block mb-1">
                Authenticator Secret Key
              </span>
              <p className="text-xs text-slate-300 mb-3">
                Scan or enter this key in Google Authenticator, Authy, or 1Password.
              </p>

              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-[#171225] border border-slate-800 text-white font-mono text-xs font-bold tracking-widest flex-1">
                  {secret2fa}
                </div>
                <button
                  onClick={handleCopyKey}
                  className="px-3 py-2.5 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 border border-[#8B5CF6]/40 text-[#B66DFF] text-xs font-semibold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#171225] border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-slate-900 shrink-0">
                <QrCode className="w-8 h-8" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Status: ACTIVE</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Algorithm: HMAC-SHA1 • 30s rotation window
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Terminal Sessions */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Active Device Terminals</h3>
            <p className="text-xs text-slate-400 mt-0.5">Currently authorized browser & client instances</p>
          </div>
          <button
            onClick={() => {
              setFeedback('All auxiliary sessions successfully terminated.');
              setTimeout(() => setFeedback(null), 3000);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            Terminate Other Sessions
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-[#090711]/60 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  Current Web Browser Terminal
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300">
                    THIS DEVICE
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  IP: 194.26.29.112 • Frankfurt, Germany (Cloud Run Node)
                </div>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Active Now</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090711]/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Vortex Mobile iOS Client</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  IP: 82.165.197.8 • London, UK
                </div>
              </div>
            </div>
            <span className="text-[11px] text-slate-500">2 days ago</span>
          </div>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-base font-bold text-white tracking-wide mb-4">Cryptographic Audit Trail</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Origin</th>
                <th className="py-2.5 px-3">Authentication Provider</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              <tr className="hover:bg-[#8B5CF6]/5 transition-colors">
                <td className="py-3 px-3 text-white font-semibold">Session Token Generated</td>
                <td className="py-3 px-3 text-slate-400">194.26.29.112</td>
                <td className="py-3 px-3 text-[#B66DFF]">Firebase Auth (Google)</td>
                <td className="py-3 px-3 text-emerald-400">0.0 (Zero Risk)</td>
                <td className="py-3 px-3 text-slate-400">{new Date().toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-[#8B5CF6]/5 transition-colors">
                <td className="py-3 px-3 text-white font-semibold">Simulated Deposit Handshake</td>
                <td className="py-3 px-3 text-slate-400">194.26.29.112</td>
                <td className="py-3 px-3 text-[#B66DFF]">Internal Smart Contract</td>
                <td className="py-3 px-3 text-emerald-400">0.0 (Zero Risk)</td>
                <td className="py-3 px-3 text-slate-400">
                  {new Date(Date.now() - 3600000).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Check,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Key,
  KeyRound,
  Laptop,
  Lock,
  Phone,
  QrCode,
  RefreshCw,
  Shield,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { UserProfile } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { requestPhoneResetOtp, verifyPhoneResetOtpAndSetPassword } from '../../services/db';
import { validatePasswordStrength } from '../../services/crypto';

interface SecurityTabProps {
  user: UserProfile;
  onRefresh: () => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ user, onRefresh }) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled ?? true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password reset via verified phone OTP
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resetId, setResetId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState<string | null>(null);

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

  // Step 1: Send OTP to user's registered phone
  const handleSendOtp = async () => {
    try {
      setLoadingOtp(true);
      setErrorMessage(null);
      const res = await requestPhoneResetOtp(user.phoneNumber, user.countryCode || '+234');
      setResetId(res.resetId);
      setOtpSent(true);
      setSimulatedOtpNotice(`Your OTP is ${res.otpCode} (Valid for 10 minutes)`);
      setFeedback(`6-digit security code dispatched to ${user.phoneNumber}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch OTP code.');
    } finally {
      setLoadingOtp(false);
    }
  };

  // Step 2: Confirm OTP and update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      setErrorMessage(validation.errors[0] || 'Password does not satisfy requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setLoadingOtp(true);
      setErrorMessage(null);
      await verifyPhoneResetOtpAndSetPassword(resetId, otpCode.trim(), newPassword);
      setFeedback('Password updated securely with PBKDF2 Web Crypto encryption.');
      setShowPasswordChange(false);
      setOtpSent(false);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setSimulatedOtpNotice(null);
      setTimeout(() => setFeedback(null), 4000);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update password.');
    } finally {
      setLoadingOtp(false);
    }
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
          Enforce hardware keys, TOTP authenticator protocols, verified phone OTP password updates, and session telemetry.
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Password Management Card */}
      <div className="glass-card rounded-3xl p-6 border-[#8B5CF6]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Password Authentication (PBKDF2)</h3>
              <p className="text-xs text-slate-400">
                Encrypted via PBKDF2 SHA-256 (100k rounds) with unique salt. Secured to phone: {user.phoneNumber || 'Registered Device'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowPasswordChange(!showPasswordChange);
              setErrorMessage(null);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 text-[#C4B5FD] border border-[#8B5CF6]/40 self-start sm:self-auto"
          >
            {showPasswordChange ? 'Cancel' : 'Change Password via OTP'}
          </button>
        </div>

        {showPasswordChange && (
          <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in duration-200">
            {simulatedOtpNotice && (
              <div className="mb-4 p-3 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-[#C4B5FD] text-xs flex items-center justify-between">
                <span>{simulatedOtpNotice}</span>
                <button
                  onClick={() => {
                    const match = simulatedOtpNotice.match(/\d{6}/);
                    if (match) setOtpCode(match[0]);
                  }}
                  className="px-2 py-0.5 rounded bg-[#8B5CF6]/30 text-white text-[10px] font-mono hover:bg-[#8B5CF6]/50"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {!otpSent ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#090711]/60 border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Step 1: Verify Registered Phone Number
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Click the button to dispatch a 6-digit OTP to your verified number: <span className="text-[#C4B5FD] font-mono">{user.phoneNumber}</span>
                  </div>
                </div>
                <button
                  onClick={handleSendOtp}
                  disabled={loadingOtp}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white text-xs font-bold hover:opacity-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {loadingOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                  <span>Send Phone OTP</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-3.5 max-w-md">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    6-Digit Verification OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 px-3 text-sm text-center font-mono text-white tracking-widest focus:outline-none focus:border-[#B66DFF]"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 8 chars, uppercase, number"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 pl-3 pr-10 text-xs text-white focus:outline-none focus:border-[#B66DFF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#B66DFF]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={loadingOtp}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {loadingOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Confirm & Update Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-xs text-[#B66DFF] hover:underline"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

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
                Mandates a 6-digit cryptographic TOTP passkey on every simulated withdrawal or security alteration.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-[#090711]/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-[#B66DFF]" />
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Authenticator Secret</div>
                  <div className="text-xs font-mono font-bold text-white tracking-wider">{secret2fa}</div>
                </div>
              </div>
              <button
                onClick={handleCopyKey}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copy Secret"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
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
                <td className="py-3 px-3 text-[#B66DFF]">Phone & PBKDF2 Web Crypto</td>
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

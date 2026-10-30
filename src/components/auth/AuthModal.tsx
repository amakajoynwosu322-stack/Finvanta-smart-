/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BOOTSTRAP_ADMIN_PHONE } from '../../services/db';
import { validatePasswordStrength } from '../../services/crypto';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'admin';
}

const COUNTRY_CODES = [
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', default: true },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' }
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login'
}) => {
  const { login, register, requestOtp, resetPasswordWithOtp } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin' | 'forgot'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Common Phone inputs
  const [countryCode, setCountryCode] = useState('+234');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Register state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Login state
  const [loginPassword, setLoginPassword] = useState('');

  // Admin state
  const [adminPhone, setAdminPhone] = useState(BOOTSTRAP_ADMIN_PHONE);
  const [adminPassword, setAdminPassword] = useState('');

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [resetId, setResetId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = () => {
    setError(null);
    setSuccessMsg(null);
    setSimulatedOtpNotice(null);
  };

  // Password strength for registration
  const passwordAnalysis = validatePasswordStrength(regPassword);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please provide your phone number.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your account password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(phoneNumber.trim(), loginPassword, countryCode);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your phone number and password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both your first and last name.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!passwordAnalysis.isValid) {
      setError(passwordAnalysis.errors[0] || 'Password does not meet complexity requirements.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        countryCode,
        phoneNumber: phoneNumber.trim(),
        password: regPassword,
        referralCode: referralCode.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. This phone number may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Portal Login
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPhone.trim() || !adminPassword) {
      setError('Please enter administrator phone credentials.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(adminPhone.trim(), adminPassword, '+234');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Administrative verification failed. Invalid root credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter your registered phone number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await requestOtp(phoneNumber.trim(), countryCode);
      setResetId(res.resetId);
      setForgotStep('verify');
      setSimulatedOtpNotice(`Your OTP is ${res.otpCode} (Valid for 10 minutes)`);
      setSuccessMsg(`A 6-digit verification code has been dispatched to ${res.phoneNumber}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch reset code. Ensure your phone number is registered.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Verify OTP & Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the valid 6-digit OTP code.');
      return;
    }
    const newPwdAnalysis = validatePasswordStrength(newPassword);
    if (!newPwdAnalysis.isValid) {
      setError(newPwdAnalysis.errors[0] || 'New password does not meet requirements.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await resetPasswordWithOtp(resetId, otpCode.trim(), newPassword);
      setSuccessMsg(res.message);
      setTimeout(() => {
        setActiveTab('login');
        setForgotStep('request');
        resetFormState();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The OTP code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#171225] border border-[#8B5CF6]/30 rounded-3xl p-6 sm:p-8 shadow-2xl glow-purple overflow-hidden my-auto">
        {/* Glow ambient background element */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-[#8B5CF6]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-[#B66DFF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white tracking-tight">FINVANTA</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30">
                    QUANTUM
                  </span>
                </div>
                <p className="text-[11px] text-[#C4B5FD]/70">Phone & Password Authentication</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#090711] transition-colors text-sm"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          {activeTab !== 'forgot' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#090711]/80 border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  resetFormState();
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'login'
                    ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  resetFormState();
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'register'
                    ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  resetFormState();
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-[#6D28D9] text-white shadow-md shadow-[#6D28D9]/40 border border-[#B66DFF]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3 h-3 text-[#B66DFF]" />
                Admin
              </button>
            </div>
          )}

          {/* Error & Success Toasts */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {simulatedOtpNotice && (
            <div className="mb-4 p-3.5 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-[#C4B5FD] text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#B66DFF] shrink-0" />
                <span className="font-mono font-medium">{simulatedOtpNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const match = simulatedOtpNotice.match(/\d{6}/);
                  if (match) setOtpCode(match[0]);
                }}
                className="px-2 py-1 rounded bg-[#8B5CF6]/30 text-white hover:bg-[#8B5CF6]/50 text-[10px] font-mono shrink-0"
              >
                Auto-fill
              </button>
            </div>
          )}

          {/* ======================= TAB 1: LOGIN ======================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="appearance-none bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-[#B66DFF] cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={`${c.country}-${c.code}`} value={c.code} className="bg-[#171225] text-white">
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0803 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-300 font-medium">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setForgotStep('request');
                      resetFormState();
                    }}
                    className="text-[11px] text-[#B66DFF] hover:text-[#C4B5FD] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-[#8B5CF6]/30 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to FINVANTA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    resetFormState();
                  }}
                  className="text-xs text-[#B66DFF] hover:underline font-semibold"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* ======================= TAB 2: REGISTER ======================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Amaka"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Nwosu"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Phone Number (Primary Login)
                </label>
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="appearance-none bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 pl-2.5 pr-7 text-xs text-white focus:outline-none focus:border-[#B66DFF] cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={`reg-${c.country}-${c.code}`} value={c.code} className="bg-[#171225] text-white">
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0801 234 5678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 pl-3 pr-9 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 chars, uppercase, number"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 pl-3 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {regPassword && (
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Password Security</span>
                      <span className={passwordAnalysis.score >= 3 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-medium'}>
                        {passwordAnalysis.score === 4 ? 'Very Strong' : passwordAnalysis.score === 3 ? 'Strong' : 'Weak'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1 rounded-full overflow-hidden bg-slate-800">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full transition-colors ${
                            passwordAnalysis.score >= step
                              ? passwordAnalysis.score >= 3
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 pl-3 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Referral Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. FV-ABC123"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/20 rounded-xl py-2 px-3 text-xs text-white uppercase font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-[#8B5CF6]/30 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-3"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Secure Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-slate-400">Already registered? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    resetFormState();
                  }}
                  className="text-xs text-[#B66DFF] hover:underline font-semibold"
                >
                  Log In
                </button>
              </div>
            </form>
          )}

          {/* ======================= TAB 3: ADMIN ======================= */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#6D28D9]/20 border border-[#8B5CF6]/40 text-xs text-[#C4B5FD] flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#B66DFF] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Administrator Terminal</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Root protocol governance, simulated audit logs, and contract risk configurations.
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Admin Phone Credential
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                  />
                  <Phone className="w-3.5 h-3.5 text-[#B66DFF] absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">Root Master Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter platform administrator password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                  <span>Authorized Personnel Only</span>
                  <button
                    type="button"
                    onClick={() => setAdminPassword('AdminFINVANTA2026!')}
                    className="text-[#B66DFF] hover:underline"
                  >
                    Load Default Admin Key
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-[#6D28D9]/40 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Security Clearance...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Access Admin Portal</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ======================= TAB 4: FORGOT PASSWORD ======================= */}
          {activeTab === 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    resetFormState();
                  }}
                  className="text-xs text-[#B66DFF] hover:text-[#C4B5FD] flex items-center gap-1"
                >
                  ← Back to Login
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  {forgotStep === 'request' ? 'Step 1 of 2' : 'Step 2 of 2'}
                </span>
              </div>

              {forgotStep === 'request' ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[#090711]/70 border border-[#8B5CF6]/30 text-xs text-slate-300">
                    Enter your registered phone number. We will generate and transmit a 6-digit cryptographic verification OTP code.
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1.5">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="appearance-none bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-[#B66DFF] cursor-pointer"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={`fgt-${c.country}-${c.code}`} value={c.code} className="bg-[#171225] text-white">
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          required
                          placeholder="Registered phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                        />
                        <Phone className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-[#8B5CF6]/30 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1.5">
                      6-Digit Phone OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#090711] border border-[#8B5CF6]/40 rounded-xl py-2.5 px-3.5 text-center text-lg tracking-widest text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="At least 8 chars, uppercase, number"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm & Reset Password</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Educational Simulation Notice */}
          <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#B66DFF]" />
              PBKDF2 SHA-256 Hashing
            </span>
            <span className="text-slate-500">
              Simulation Mode Only
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

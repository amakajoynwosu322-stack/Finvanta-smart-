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
  Flame,
  KeyRound,
  Lock,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingUp,
  User,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  BOOTSTRAP_ADMIN_PHONE,
  validatePromoCode
} from '../../services/db';
import { validatePasswordStrength } from '../../services/crypto';
import { PromoCode } from '../../types';

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

export const AuthWelcomeScreen: React.FC = () => {
  const { login, register, requestOtp, resetPasswordWithOtp } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Common Phone inputs
  const [countryCode, setCountryCode] = useState('+234');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  // Register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoValidationStatus, setPromoValidationStatus] = useState<{
    checking: boolean;
    valid?: boolean;
    message?: string;
    promo?: PromoCode;
  }>({ checking: false });
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Login form state
  const [loginPassword, setLoginPassword] = useState('');

  // Admin form state
  const [adminPhone, setAdminPhone] = useState(BOOTSTRAP_ADMIN_PHONE);
  const [adminPassword, setAdminPassword] = useState('');

  // Forgot password OTP state
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [resetId, setResetId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setSuccessMsg(null);
    setSimulatedOtpNotice(null);
  };

  const passwordAnalysis = validatePasswordStrength(regPassword);

  // Instant backend promo code verification button/blur
  const handleVerifyPromoCode = async () => {
    const raw = promoCodeInput.trim();
    if (!raw) {
      setPromoValidationStatus({ checking: false });
      return;
    }
    setPromoValidationStatus({ checking: true });
    try {
      const res = await validatePromoCode(raw);
      setPromoValidationStatus({
        checking: false,
        valid: res.valid,
        message: res.message,
        promo: res.promoCode
      });
    } catch (err: any) {
      setPromoValidationStatus({
        checking: false,
        valid: false,
        message: err?.message || 'Failed to validate code with server.'
      });
    }
  };

  // Sign In handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please provide your phone number.');
      return;
    }
    if (!loginPassword) {
      setError('Please provide your account password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(phoneNumber.trim(), loginPassword, countryCode);
      // AuthContext sets currentUser which triggers immediate re-render into Dashboard
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your phone number and password.');
    } finally {
      setLoading(false);
    }
  };

  // Registration handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both your first and last name.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (!passwordAnalysis.isValid) {
      setError(passwordAnalysis.errors[0] || 'Password does not meet complexity guidelines.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      return;
    }
    if (!termsAgreed) {
      setError('You must accept the Simulated Platform Terms & Privacy Guidelines to continue.');
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
        promoCode: promoCodeInput.trim() ? promoCodeInput.trim().toUpperCase() : undefined
      });
      // AuthContext sets currentUser which triggers immediate re-render into Dashboard
    } catch (err: any) {
      setError(err?.message || 'Registration failed. This phone number may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // Admin Portal login
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
    } catch (err: any) {
      setError(err?.message || 'Administrative verification failed. Invalid root credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Request Reset OTP
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
      setSuccessMsg(`A 6-digit cryptographic verification OTP code has been dispatched to ${res.phoneNumber}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch reset code. Verify your phone number is registered.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and reset password
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
        resetMessages();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. OTP may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090711] text-white flex flex-col font-sans selection:bg-[#8B5CF6]/30 bg-mesh relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[30rem] h-[30rem] bg-[#B66DFF]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Banner: Educational Sandbox Notice */}
      <div className="w-full bg-[#171225]/90 border-b border-[#8B5CF6]/30 py-2 px-4 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="text-amber-300 font-semibold uppercase tracking-wider text-[11px]">
            Simulation Mode Only:
          </span>
          <span className="text-slate-300 text-[11px] truncate">
            FINVANTA is an educational algorithmic trading sandbox. All transactions and portfolio balances are simulated.
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 my-auto">
        {/* Left Side: Brand presentation & protocol features */}
        <div className="flex-1 max-w-xl text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#C4B5FD] text-xs font-semibold glow-purple-sm">
            <Sparkles className="w-4 h-4 text-[#B66DFF]" />
            <span>FINVANTA QUANTUM V5.0 PROTOCOL</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Next-Gen <span className="bg-gradient-to-r from-[#B66DFF] via-[#8B5CF6] to-[#60A5FA] bg-clip-text text-transparent">Simulated Wealth</span> & Yield Engine
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Experience real-time high-frequency algorithmic arbitrage, multi-tier yield vaults, and simulated DeFi liquidity management inside a secure, server-authoritative institutional sandbox.
          </p>

          {/* Key security feature pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-[#171225]/80 border border-[#8B5CF6]/25 backdrop-blur-md flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[#B66DFF] shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-white">PBKDF2 Crypt</div>
                <div className="text-[10px] text-slate-400">100k SHA-256</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#171225]/80 border border-[#8B5CF6]/25 backdrop-blur-md flex items-center gap-2.5">
              <Phone className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-white">Phone Auth</div>
                <div className="text-[10px] text-slate-400">Unique Central Registry</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#171225]/80 border border-[#8B5CF6]/25 backdrop-blur-md flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-white">Zero Leakage</div>
                <div className="text-[10px] text-slate-400">Strict Server State</div>
              </div>
            </div>
          </div>

          {/* Sample Active Promo Code Hint */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/15 via-[#6D28D9]/20 to-[#171225] border border-[#8B5CF6]/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-[#B66DFF] shrink-0" />
              <span className="text-slate-300">
                New user? Try code <span className="font-mono font-bold text-white bg-[#8B5CF6]/30 px-2 py-0.5 rounded border border-[#8B5CF6]/40">QUANTUM2026</span> for VIP perks!
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setPromoCodeInput('QUANTUM2026');
                setTimeout(() => handleVerifyPromoCode(), 100);
              }}
              className="text-[11px] font-bold text-[#B66DFF] hover:text-white underline shrink-0"
            >
              Use Code
            </button>
          </div>
        </div>

        {/* Right Side: The Authentication Card */}
        <div className="w-full max-w-md bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 sm:p-8 shadow-2xl glow-purple relative overflow-hidden backdrop-blur-xl">
          {/* Card top banner badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#B66DFF] flex items-center justify-center text-slate-950 font-black shadow-lg shadow-[#8B5CF6]/30">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-white">FINVANTA</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40">
                    GATEWAY
                  </span>
                </div>
                <p className="text-[11px] text-[#C4B5FD]/70">Secure Server-Side Access</p>
              </div>
            </div>

            <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </div>
          </div>

          {/* Tab Selector */}
          {activeTab !== 'forgot' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#090711] border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  resetMessages();
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
                  resetMessages();
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'register'
                    ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  resetMessages();
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

          {/* Feedback toasts */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-tight">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span className="leading-tight">{successMsg}</span>
            </div>
          )}

          {simulatedOtpNotice && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 text-[#C4B5FD] text-xs flex items-center justify-between gap-2 animate-in fade-in">
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
                className="px-2.5 py-1 rounded bg-[#8B5CF6] text-white hover:bg-[#7C3AED] text-[10px] font-mono font-bold shrink-0 transition-colors"
              >
                Auto-fill
              </button>
            </div>
          )}

          {/* ===================== VIEW 1: SIGN IN ===================== */}
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
                      resetMessages();
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

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="rounded bg-[#090711] border-slate-700 text-[#8B5CF6] focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">256-bit Secure</span>
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
                    resetMessages();
                  }}
                  className="text-xs text-[#B66DFF] hover:underline font-semibold"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* ===================== VIEW 2: CREATE ACCOUNT ===================== */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">First Name</label>
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
                  <label className="text-[11px] text-slate-300 font-medium block mb-1">Last Name</label>
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
                <label className="text-[11px] text-slate-300 font-medium block mb-1">
                  Phone Number (Primary Login ID)
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
                <label className="text-[11px] text-slate-300 font-medium block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 chars, uppercase & number"
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
                      <span>Password Strength</span>
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
                <label className="text-[11px] text-slate-300 font-medium block mb-1">Confirm Password</label>
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

              {/* Promo Code Field (Optional, Backend Validated) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-300 font-medium">Promo Code (Optional)</label>
                  <span className="text-[10px] text-[#B66DFF] font-mono">Educational Perks</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="e.g. QUANTUM2026"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value.toUpperCase());
                        if (promoValidationStatus.valid !== undefined) {
                          setPromoValidationStatus({ checking: false });
                        }
                      }}
                      className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 pl-3 pr-3 text-xs text-white uppercase font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#B66DFF]"
                    />
                  </div>
                  {promoCodeInput.trim() && (
                    <button
                      type="button"
                      onClick={handleVerifyPromoCode}
                      disabled={promoValidationStatus.checking}
                      className="px-3 py-2 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#C4B5FD] hover:bg-[#8B5CF6]/40 text-[11px] font-bold shrink-0 transition-colors"
                    >
                      {promoValidationStatus.checking ? 'Checking...' : 'Check Code'}
                    </button>
                  )}
                </div>

                {/* Promo Code Server Feedback Message */}
                {promoValidationStatus.message && (
                  <div
                    className={`mt-1.5 p-2 rounded-xl text-[10px] flex items-center gap-1.5 ${
                      promoValidationStatus.valid
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {promoValidationStatus.valid ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span>{promoValidationStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Terms and Privacy Policy agreement */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-slate-300 select-none">
                  <input
                    type="checkbox"
                    required
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded bg-[#090711] border-slate-700 text-[#8B5CF6] focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="leading-tight">
                    I agree to the <span className="text-[#B66DFF] font-medium">Terms of Service</span> and <span className="text-[#B66DFF] font-medium">Privacy Policy</span>. I acknowledge this is an educational simulation sandbox without real-money deposits.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-[#8B5CF6]/30 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Protected Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create FINVANTA Account</span>
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
                    resetMessages();
                  }}
                  className="text-xs text-[#B66DFF] hover:underline font-semibold"
                >
                  Log In
                </button>
              </div>
            </form>
          )}

          {/* ===================== VIEW 3: ADMIN CONSOLE ===================== */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#6D28D9]/20 border border-[#8B5CF6]/40 text-xs text-[#C4B5FD] flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#B66DFF] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Administrator Terminal</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Root protocol governance, simulated audit logs, promo code management, and contract risk configurations.
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
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                  <span>Protected Access Only</span>
                  <button
                    type="button"
                    onClick={() => setAdminPassword('AdminFINVANTA2026!')}
                    className="text-[#B66DFF] hover:underline font-medium"
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

          {/* ===================== VIEW 4: FORGOT PASSWORD ===================== */}
          {activeTab === 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    resetMessages();
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
                      placeholder="Min 8 chars, uppercase & number"
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

          {/* Bottom Security Footer */}
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

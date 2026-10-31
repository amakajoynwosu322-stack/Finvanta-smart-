import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpCircle,
  Award,
  Building,
  CheckCircle,
  Clock,
  ExternalLink,
  Info,
  Lock,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  Wallet,
  Zap
} from 'lucide-react';
import { PlatformConfig, UserProfile, WithdrawalRequest } from '../../types';
import { submitWithdrawalRequest } from '../../services/db';
import { formatNaira } from '../../utils/currency';
import {
  getAffiliateWithdrawalStatus,
  getTaskWithdrawalStatus,
  getWatTime,
  ScheduleStatus
} from '../../utils/watTime';
import confetti from 'canvas-confetti';

const NIGERIAN_BANKS = [
  'Access Bank Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'Zenith Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Microfinance Bank',
  'OPay Digital Services',
  'PalmPay Nigeria',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Fidelity Bank',
  'Sterling Bank',
  'Union Bank of Nigeria',
  'Wema Bank'
];

interface WithdrawalTabProps {
  user: UserProfile;
  config?: PlatformConfig;
  withdrawalRequests: WithdrawalRequest[];
  onRefresh: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export const WithdrawalTab: React.FC<WithdrawalTabProps> = ({
  user,
  config,
  withdrawalRequests,
  onRefresh,
  onNavigateTab
}) => {
  const [selectedBalanceType, setSelectedBalanceType] = useState<'task' | 'affiliate'>('task');
  const [selectedBank, setSelectedBank] = useState<string>(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState<string>('0124896721');
  const [accountName, setAccountName] = useState<string>(user.displayName || '');
  const [amount, setAmount] = useState<number>(1000);
  const [twoFactorCode, setTwoFactorCode] = useState<string>('849201');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live ticking schedule status (Nigeria Time - WAT)
  const [taskSchedule, setTaskSchedule] = useState<ScheduleStatus>(getTaskWithdrawalStatus());
  const [affiliateSchedule, setAffiliateSchedule] = useState<ScheduleStatus>(getAffiliateWithdrawalStatus());
  const [currentWat, setCurrentWat] = useState(getWatTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTaskSchedule(getTaskWithdrawalStatus());
      setAffiliateSchedule(getAffiliateWithdrawalStatus());
      setCurrentWat(getWatTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mainBalance = user.balance || 0;
  const taskBalance = user.taskBalance || 0;
  const affiliateBalance = user.affiliateBalance || 0;

  const activeSchedule = selectedBalanceType === 'task' ? taskSchedule : affiliateSchedule;
  const activeAvailableBalance = selectedBalanceType === 'task' ? taskBalance : affiliateBalance;

  const minWithdrawal = config?.minWithdrawal || 1000;
  const feePercentage = config?.withdrawalFeePercentage || 1.5;
  const feeAmount = (amount * feePercentage) / 100;
  const netPayout = Math.max(0, amount - feeAmount);

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify schedule actively
    if (!activeSchedule.isOpen) {
      setFeedback({
        type: 'error',
        message: `Withdrawal for ${selectedBalanceType === 'task' ? 'Task Balance' : 'Affiliate Balance'} is currently CLOSED. ${activeSchedule.nextWindowText}.`
      });
      return;
    }

    if (amount < minWithdrawal) {
      setFeedback({ type: 'error', message: `Minimum withdrawal is ${formatNaira(minWithdrawal)}.` });
      return;
    }
    if (amount > activeAvailableBalance) {
      setFeedback({
        type: 'error',
        message: `Insufficient ${selectedBalanceType === 'task' ? 'Task' : 'Affiliate'} Balance. Available: ${formatNaira(activeAvailableBalance)}.`
      });
      return;
    }
    if (!accountNumber || accountNumber.trim().length !== 10) {
      setFeedback({ type: 'error', message: 'Please specify a valid 10-digit Nigerian NUBAN account number.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const destination = `${selectedBank} - Acc: ${accountNumber} (${accountName})`;
      const res = await submitWithdrawalRequest(
        user,
        amount,
        'NGN',
        'NIP Instant Bank Transfer',
        destination,
        selectedBalanceType
      );
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
        setFeedback({ type: 'success', message: res.message });
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to submit withdrawal.' });
    } finally {
      setSubmitting(false);
    }
  };

  const userWithdrawals = withdrawalRequests.filter((w) => w.userId === user.uid);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Simulation Notice Banner */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-bold text-white block">EDUCATIONAL SIMULATION MODE & BALANCE SEGREGATION</span>
          All withdrawals demonstrate automated settlement flows using simulated Nigerian Naira (₦). Schedules are strictly enforced in Nigeria Time (WAT: UTC+1) using trusted server time. Main Balance is never withdrawable.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-[#B66DFF]" />
            Request Simulated Withdrawal (Nigeria WAT Time)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Current Nigeria Time: <span className="font-mono text-emerald-400 font-semibold">{String(currentWat.hours).padStart(2, '0')}:{String(currentWat.minutes).padStart(2, '0')}:{String(currentWat.seconds).padStart(2, '0')} WAT</span> (UTC+1)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#171225] border border-slate-800 text-xs text-slate-300 font-mono">
            {currentWat.day} / {currentWat.month} / {currentWat.year}
          </span>
        </div>
      </div>

      {/* 1. THREE SEPARATE BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Main Balance (Non-Withdrawable) */}
        <div className="p-5 rounded-3xl bg-[#171225]/80 border border-slate-800 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <Lock className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs font-bold text-white">Main Balance</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                NON-WITHDRAWABLE
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-200 font-mono mt-1">
              {formatNaira(mainBalance)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Used <strong className="text-white">exclusively</strong> to purchase simulated investment plans. Never eligible for withdrawal.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('plans')}
                className="w-full py-1.5 px-3 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 text-[#C4B5FD] hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Explore Investment Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Task Balance (Eligible on 30th) */}
        <div
          onClick={() => setSelectedBalanceType('task')}
          className={`p-5 rounded-3xl cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between border ${
            selectedBalanceType === 'task'
              ? 'bg-gradient-to-b from-[#182329] to-[#0f191b] border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
              : 'bg-[#171225]/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Task Balance</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                  taskSchedule.isOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {taskSchedule.isOpen ? 'WINDOW OPEN' : 'WINDOW CLOSED'}
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {formatNaira(taskBalance)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Earned from daily tasks. Withdrawable <strong className="text-white">only on the 30th</strong> (4:50 PM – 6:20 PM WAT).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-mono">
              {taskSchedule.isOpen ? 'Closes in:' : 'Next window:'}
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {taskSchedule.formattedCountdown}
            </span>
          </div>
        </div>

        {/* Card 3: Affiliate Balance (Eligible Daily 7:30-8:40 PM) */}
        <div
          onClick={() => setSelectedBalanceType('affiliate')}
          className={`p-5 rounded-3xl cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between border ${
            selectedBalanceType === 'affiliate'
              ? 'bg-gradient-to-b from-[#251535] to-[#170e24] border-[#B66DFF] shadow-lg shadow-[#8B5CF6]/15 ring-1 ring-[#8B5CF6]/30'
              : 'bg-[#171225]/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF]">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Affiliate Balance</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                  affiliateSchedule.isOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {affiliateSchedule.isOpen ? 'WINDOW OPEN' : 'WINDOW CLOSED'}
              </span>
            </div>
            <div className="text-2xl font-bold text-[#C4B5FD] font-mono mt-1">
              {formatNaira(affiliateBalance)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Earned from referral rewards. Withdrawable <strong className="text-white">daily</strong> (7:30 PM – 8:40 PM WAT).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-mono">
              {affiliateSchedule.isOpen ? 'Closes in:' : 'Next window:'}
            </span>
            <span className="font-mono font-bold text-[#B66DFF]">
              {affiliateSchedule.formattedCountdown}
            </span>
          </div>
        </div>
      </div>

      {/* 2. WITHDRAWAL FORM CARD WITH LIVE SCHEDULE ENFORCEMENT */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        {/* Balance Selector Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#090711] border border-slate-800 mb-6 max-w-md">
          <button
            type="button"
            onClick={() => {
              setSelectedBalanceType('task');
              setFeedback(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              selectedBalanceType === 'task'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Task Balance ({formatNaira(taskBalance)})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedBalanceType('affiliate');
              setFeedback(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              selectedBalanceType === 'affiliate'
                ? 'bg-gradient-to-r from-[#B66DFF] to-[#8B5CF6] text-slate-950 shadow-md shadow-[#8B5CF6]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Affiliate Balance ({formatNaira(affiliateBalance)})</span>
          </button>
        </div>

        {/* Live Window Schedule Banner */}
        <div
          className={`p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            activeSchedule.isOpen
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 shrink-0 ${activeSchedule.isOpen ? 'text-emerald-400 animate-spin-slow' : 'text-rose-400'}`} />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{activeSchedule.statusText}</span>
                <span className={`w-2 h-2 rounded-full ${activeSchedule.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {selectedBalanceType === 'task'
                  ? 'Task Schedule: 30th of every month (4:50 PM – 6:20 PM WAT)'
                  : 'Affiliate Schedule: Every day (7:30 PM – 8:40 PM WAT)'}
                {' • '}
                <span className="text-white font-medium">{activeSchedule.nextWindowText}</span>
              </div>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#090711] border border-slate-800 text-xs font-mono font-bold self-start sm:self-auto">
            {activeSchedule.isOpen ? (
              <span className="text-emerald-400">{activeSchedule.closesInText}</span>
            ) : (
              <span className="text-slate-300">Countdown: {activeSchedule.formattedCountdown}</span>
            )}
          </div>
        </div>

        {/* Toast Feedback */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between mb-6 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmitWithdrawal} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Selector */}
            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#B66DFF]" />
                <span>Destination Bank</span>
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#B66DFF]"
              >
                {NIGERIAN_BANKS.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            {/* NUBAN Account Number */}
            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                10-Digit NUBAN Account Number
              </label>
              <input
                type="text"
                maxLength={10}
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 0123456789"
                className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-[#B66DFF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Name */}
            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                Account Beneficiary Name
              </label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Beneficiary full name"
                className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#B66DFF]"
              />
            </div>

            {/* Withdrawal Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="text-slate-300 font-medium">Withdrawal Amount (₦)</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Available: <strong className="text-white">{formatNaira(activeAvailableBalance)}</strong>
                </span>
              </div>
              <input
                type="number"
                min={minWithdrawal}
                max={activeAvailableBalance}
                step={500}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-[#B66DFF]"
              />

              {/* Quick Percent Buttons */}
              <div className="flex gap-2 mt-2">
                {[
                  { label: 'Min', val: minWithdrawal },
                  { label: '25%', val: Math.floor(activeAvailableBalance * 0.25) },
                  { label: '50%', val: Math.floor(activeAvailableBalance * 0.5) },
                  { label: '100%', val: activeAvailableBalance }
                ].map((pct, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAmount(Math.max(minWithdrawal, pct.val))}
                    className="flex-1 py-1 rounded-lg bg-[#090711] hover:bg-[#8B5CF6]/20 border border-slate-800 text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
                  >
                    {pct.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fee & Net Calculation Breakdown */}
          <div className="p-4 rounded-2xl bg-[#090711]/70 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Source Balance:</span>
              <span className="font-semibold text-white capitalize">
                {selectedBalanceType === 'task' ? 'Task Balance' : 'Affiliate / Referral Balance'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Requested Amount:</span>
              <span className="font-mono text-white">{formatNaira(amount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Administrative Processing Fee ({feePercentage}%):</span>
              <span className="font-mono text-rose-400">-{formatNaira(feeAmount)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold">
              <span className="text-white">Estimated Net Simulated Payout:</span>
              <span className="font-mono text-emerald-400 text-sm">{formatNaira(netPayout)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !activeSchedule.isOpen || amount > activeAvailableBalance || amount < minWithdrawal}
            className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
              activeSchedule.isOpen && amount <= activeAvailableBalance && amount >= minWithdrawal
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : !activeSchedule.isOpen ? (
              <span>Withdrawal Disabled Outside Schedule ({activeSchedule.nextWindowText})</span>
            ) : amount > activeAvailableBalance ? (
              <span>Insufficient {selectedBalanceType === 'task' ? 'Task' : 'Affiliate'} Balance</span>
            ) : (
              <span>Confirm & Dispatch Simulated Payout ({formatNaira(netPayout)})</span>
            )}
          </button>
        </form>
      </div>

      {/* 3. WITHDRAWAL HISTORY LEDGER */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">My Simulated Withdrawal Requests</h3>
            <p className="text-xs text-slate-400">Audit trail of outbound simulated disbursements</p>
          </div>
          <span className="text-xs font-mono text-[#B66DFF] bg-[#8B5CF6]/10 px-2.5 py-1 rounded-lg border border-[#8B5CF6]/30">
            {userWithdrawals.length} Total Requests
          </span>
        </div>

        {userWithdrawals.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No withdrawal requests logged yet. Eligible funds can be withdrawn during active schedule windows.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Source Balance</th>
                  <th className="py-2.5 px-3">Destination Account</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {userWithdrawals.map((req) => (
                  <tr key={req.id} className="hover:bg-[#8B5CF6]/5 transition-colors">
                    <td className="py-3 px-3 text-slate-400 text-[11px] font-sans">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-400">
                      -{formatNaira(req.amount)}
                    </td>
                    <td className="py-3 px-3 font-sans text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        req.balanceSource === 'task'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30'
                      }`}>
                        {req.balanceSource === 'task' ? 'Task Balance' : 'Affiliate Balance'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 text-[11px] truncate max-w-[200px]" title={req.walletAddress}>
                      {req.walletAddress}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : req.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Award,
  CheckCircle,
  CreditCard,
  HelpCircle,
  PieChart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import { UserProfile } from '../../types';
import { formatNaira } from '../../utils/currency';

interface AvailableBalanceTabProps {
  user: UserProfile;
  onNavigateTab: (tabId: string) => void;
}

export const AvailableBalanceTab: React.FC<AvailableBalanceTabProps> = ({
  user,
  onNavigateTab
}) => {
  const mainBalance = user.balance || 0;
  const taskBalance = user.taskBalance || 0;
  const affiliateBalance = user.affiliateBalance ?? (user.totalEarned ? user.totalEarned * 0.15 : 0);
  const totalInvested = user.totalInvested || 0;
  const totalCombinedAssets = mainBalance + taskBalance + affiliateBalance + totalInvested;

  const liquidPct = totalCombinedAssets > 0 ? Math.round(((mainBalance + taskBalance + affiliateBalance) / totalCombinedAssets) * 100) : 100;
  const investedPct = 100 - liquidPct;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Wallet & Balance Portfolio (NGN / ₦)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time liquid capital ready for immediate savings plan deployment or Nigerian bank payout.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('deposit')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Fund Wallet</span>
          </button>
          <button
            onClick={() => onNavigateTab('withdrawal')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171225] hover:bg-[#201538] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/60 text-white font-semibold text-xs transition-all active:scale-95"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#1F1735] via-[#171225] to-[#120E1E] border border-[#8B5CF6]/40 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#C4B5FD] font-bold">
                Total Available Liquid Balance
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Nigerian Naira (₦)
              </span>
            </div>

            <div className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2 tabular-nums">
              {formatNaira(mainBalance)}
            </div>

            <p className="text-xs text-slate-300 mt-2 max-w-lg">
              Main wallet balance ready for instantaneous plan subscriptions, compounding allocations, or NIP bank settlement.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#090711]/70 border border-[#8B5CF6]/30 flex flex-col gap-2 min-w-[200px]">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Total Combined Assets</span>
            <span className="text-xl font-black text-emerald-400 tabular-nums">
              {formatNaira(totalCombinedAssets)}
            </span>
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Liquid: {liquidPct}%</span>
              <span>Active Plans: {investedPct}%</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Three Detailed Wallet Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Main Wallet */}
        <div className="rounded-3xl p-6 bg-[#171225] border border-[#8B5CF6]/30 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Main Balance</span>
              <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white tabular-nums">
              {formatNaira(mainBalance)}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Available liquid balance for initiating new Nigerian savings plans or withdrawing to your bank.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('deposit')}
            className="mt-5 w-full py-2.5 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#C4B5FD] hover:text-white text-xs font-semibold transition-colors"
          >
            Fund Main Balance
          </button>
        </div>

        {/* Task Earnings Wallet */}
        <div className="rounded-3xl p-6 bg-[#171225] border border-emerald-500/30 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Task Balance</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 tabular-nums">
              {formatNaira(taskBalance)}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Accumulated rewards from daily literacy lessons, platform attendance check-ins, and surveys.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('tasks')}
            className="mt-5 w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Earn & Transfer Tasks
          </button>
        </div>

        {/* Affiliate Commission Wallet */}
        <div className="rounded-3xl p-6 bg-[#171225] border border-amber-500/30 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Affiliate Balance</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-300 tabular-nums">
              {formatNaira(affiliateBalance)}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Earned from 7.0% Tier 1 and 3.0% Tier 2 member invitations and community network growth.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('referrals')}
            className="mt-5 w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Invite Friends & Earn
          </button>
        </div>
      </div>

      {/* Security & Regulatory Strip */}
      <div className="p-5 rounded-3xl bg-[#171225] border border-[#8B5CF6]/20 flex items-center justify-between gap-4 flex-wrap text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Encrypted Nigerian financial ledger backed by central database integrity.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#C4B5FD]">Currency Code: NGN</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-emerald-400">Symbol: ₦</span>
        </div>
      </div>
    </div>
  );
};

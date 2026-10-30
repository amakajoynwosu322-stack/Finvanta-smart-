import React, { useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  Coins,
  CreditCard,
  DollarSign,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { UserProfile } from '../../types';

interface AvailableBalanceTabProps {
  user: UserProfile;
  onNavigateTab: (tabId: string) => void;
}

export const AvailableBalanceTab: React.FC<AvailableBalanceTabProps> = ({
  user,
  onNavigateTab
}) => {
  const [targetCurrency, setTargetCurrency] = useState<'USDT' | 'BTC' | 'ETH' | 'EUR'>('USDT');

  const btcRate = 98420.0;
  const ethRate = 3450.0;
  const eurRate = 1.08;

  const balance = user.balance || 0;
  const convertedValues = {
    USDT: balance.toFixed(2),
    BTC: (balance / btcRate).toFixed(5),
    ETH: (balance / ethRate).toFixed(4),
    EUR: (balance / eurRate).toFixed(2),
  };

  const totalCapital = balance + (user.totalInvested || 0);
  const liquidPct = totalCapital > 0 ? Math.round((balance / totalCapital) * 100) : 100;
  const lockedPct = 100 - liquidPct;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Available Liquid Balance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time liquid capital ready for immediate plan deployment or simulated payout.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('deposit')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <ArrowDownCircle className="w-4 h-4" />
            Simulate Deposit
          </button>
          <button
            onClick={() => onNavigateTab('withdrawal')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171225] hover:bg-[#201538] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/60 text-white font-semibold text-xs transition-all active:scale-95"
          >
            <ArrowUpCircle className="w-4 h-4 text-[#B66DFF]" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Main Glass Hero Card */}
      <div className="glass-card rounded-3xl p-7 relative overflow-hidden border-[#8B5CF6]/30 glow-purple-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Settled Liquid Balance
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-lg font-bold text-[#B66DFF] ml-2">USD</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% available without lockups or settlement delays.
            </p>
          </div>

          {/* Quick Currency Conversion Badges */}
          <div className="p-4 rounded-2xl bg-[#090711]/70 border border-[#8B5CF6]/20 flex flex-col gap-2 min-w-[240px]">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Real-Time Equivalent Valuations
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-[#171225] border border-slate-800">
                <div className="text-[10px] text-slate-400">USDT (TRC-20)</div>
                <div className="font-bold text-white font-mono">{convertedValues.USDT}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#171225] border border-slate-800">
                <div className="text-[10px] text-slate-400">Bitcoin (BTC)</div>
                <div className="font-bold text-amber-400 font-mono">{convertedValues.BTC}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#171225] border border-slate-800">
                <div className="text-[10px] text-slate-400">Ethereum (ETH)</div>
                <div className="font-bold text-sky-400 font-mono">{convertedValues.ETH}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#171225] border border-slate-800">
                <div className="text-[10px] text-slate-400">Euro (EUR)</div>
                <div className="font-bold text-slate-200 font-mono">€{convertedValues.EUR}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Capital Structure Split: Liquid vs Locked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-base font-bold text-white tracking-wide mb-2">Liquidity Ratio</h3>
          <p className="text-xs text-slate-400 mb-5">Current allocation of your account capital</p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                <span className="text-emerald-400">Liquid Available ({liquidPct}%)</span>
                <span className="text-[#B66DFF]">Locked in Yield Plans ({lockedPct}%)</span>
              </div>
              <div className="w-full h-3 bg-[#090711] rounded-full overflow-hidden flex">
                <div style={{ width: `${liquidPct}%` }} className="bg-emerald-400 h-full transition-all" />
                <div style={{ width: `${lockedPct}%` }} className="bg-[#8B5CF6] h-full transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#090711]/60 border border-emerald-500/20">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Liquid Ready</span>
                <div className="text-lg font-bold text-white mt-1">${balance.toLocaleString()}</div>
                <span className="text-[10px] text-emerald-400">Ready for instant plans</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#090711]/60 border border-[#8B5CF6]/20">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Locked Active</span>
                <div className="text-lg font-bold text-white mt-1">${(user.totalInvested || 0).toLocaleString()}</div>
                <span className="text-[10px] text-[#B66DFF]">Generating daily yield</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Inflows & Outflows */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-base font-bold text-white tracking-wide mb-2">Capital Ledger Summary</h3>
          <p className="text-xs text-slate-400 mb-5">Aggregated inflow and yield metrics</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090711]/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Total Simulated Deposits</span>
              <span className="font-bold text-white font-mono">
                +${(user.totalDeposited || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090711]/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Total Harvested ROI Profits</span>
              <span className="font-bold text-emerald-400 font-mono">
                +${(user.totalEarned || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090711]/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Total Simulated Withdrawals</span>
              <span className="font-bold text-amber-400 font-mono">
                -${(user.totalWithdrawn || 0).toLocaleString()}
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs text-[#B66DFF] hover:underline font-semibold"
              >
                Inspect Ledger Records →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

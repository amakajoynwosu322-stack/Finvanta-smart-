import React, { useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Flame,
  Percent,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Investment, UserProfile } from '../../types';
import { claimInvestmentProfit } from '../../services/db';
import confetti from 'canvas-confetti';

interface MyInvestmentsTabProps {
  user: UserProfile;
  investments: Investment[];
  onNavigateTab: (tabId: string) => void;
  onRefresh: () => void;
}

export const MyInvestmentsTab: React.FC<MyInvestmentsTabProps> = ({
  user,
  investments,
  onNavigateTab,
  onRefresh
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const filtered = investments.filter((i) => {
    if (filter === 'all') return true;
    return i.status === filter;
  });

  const activeInvestments = investments.filter((i) => i.status === 'active');
  const totalActiveCapital = activeInvestments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalHarvestedProfits = investments.reduce((acc, curr) => acc + (curr.totalEarned || 0), 0);

  const handleHarvest = async (inv: Investment) => {
    try {
      setClaimingId(inv.id);
      const res = await claimInvestmentProfit(user, inv);
      if (res.success) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
        setToastMsg(res.message);
        setTimeout(() => setToastMsg(null), 4000);
        onRefresh();
      } else {
        setToastMsg(res.message);
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch (err: any) {
      setToastMsg(err?.message || 'Error harvesting yield');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-[#8B5CF6]/30 border border-[#8B5CF6]/60 text-white text-xs font-semibold flex items-center justify-between shadow-lg glow-purple-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B66DFF]" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#B66DFF]" />
            Active & Settled Investments
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time duration elapsed, harvest daily yield payouts, and view completed contracts.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('investment_plans')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-semibold shadow-md self-start sm:self-auto"
        >
          New Investment +
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-3xl p-5">
          <span className="text-xs font-mono uppercase text-slate-400">Active Capital Deployed</span>
          <div className="text-2xl font-extrabold text-white mt-1">
            ${totalActiveCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {activeInvestments.length} running algorithmic contracts
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <span className="text-xs font-mono uppercase text-slate-400">Total Harvested Profits</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            +${totalHarvestedProfits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Directly credited to liquid balance
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <span className="text-xs font-mono uppercase text-slate-400">Next Distribution Cycle</span>
          <div className="text-2xl font-extrabold text-[#B66DFF] mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Every 24h
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-2">
            Automatic & manual claim supported
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {(['active', 'completed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              filter === tab
                ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab} ({tab === 'all' ? investments.length : investments.filter((i) => i.status === tab).length})
          </button>
        ))}
      </div>

      {/* Contracts List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#171225]/40 border border-dashed border-[#8B5CF6]/20">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No {filter} contracts found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Ready to participate in algorithmic yield strategies? Choose from our curated investment packages.
          </p>
          <button
            onClick={() => onNavigateTab('investment_plans')}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white text-xs font-bold transition-all shadow-md"
          >
            Browse Investment Plans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((inv) => {
            const progress = Math.min(100, Math.round(((inv.daysElapsed || 0) / inv.durationDays) * 100));
            const isCompleted = inv.status === 'completed';
            const expectedDaily = (inv.amount * inv.dailyRoi) / 100;

            return (
              <div
                key={inv.id}
                className="glass-card rounded-3xl p-5 border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-[10px] font-mono text-[#B66DFF] font-bold px-2 py-0.5 rounded bg-[#8B5CF6]/20">
                      ID: {inv.id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isCompleted
                          ? 'bg-slate-700/50 text-slate-300'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isCompleted ? 'Matured & Settled' : 'Accruing Yield'}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white">{inv.planName}</h3>

                  <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#090711]/60 border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Principal</span>
                      <div className="font-extrabold text-white font-mono text-sm">
                        ${inv.amount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Daily Yield</span>
                      <div className="font-extrabold text-emerald-400 font-mono text-sm">
                        +${expectedDaily.toFixed(2)} ({inv.dailyRoi}%)
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Harvested</span>
                      <div className="font-bold text-amber-300 font-mono">
                        +${(inv.totalEarned || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Max Payout</span>
                      <div className="font-bold text-slate-300 font-mono">
                        +${(inv.totalRoiExpected || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Duration timeline */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        Duration
                      </span>
                      <span className="font-mono font-semibold text-white">
                        {inv.daysElapsed || 0} / {inv.durationDays} Days ({progress}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#090711] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#B66DFF] to-emerald-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Started: {new Date(inv.startDate).toLocaleDateString()}</span>
                      <span>Matures: {new Date(inv.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => handleHarvest(inv)}
                    disabled={claimingId === inv.id}
                    className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6]/30 to-[#B66DFF]/20 hover:from-[#8B5CF6] hover:to-[#B66DFF] border border-[#8B5CF6]/50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-md shadow-[#8B5CF6]/15"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    {claimingId === inv.id ? 'Processing Harvest...' : 'Harvest Accrued Yield'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

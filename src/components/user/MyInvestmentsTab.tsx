import React, { useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Percent,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Investment, UserProfile } from '../../types';
import { claimInvestmentProfit, renewInvestmentPlan } from '../../services/db';
import { formatNaira } from '../../utils/currency';
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
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('active');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [isRenewingId, setIsRenewingId] = useState<string | null>(null);
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

  const handleRenew = async (inv: Investment) => {
    try {
      setIsRenewingId(inv.id);
      const res = await renewInvestmentPlan(user, inv);
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
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
      setToastMsg(err?.message || 'Error renewing plan');
    } finally {
      setIsRenewingId(null);
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
            My Investment Plans & Subscriptions
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track active 30-day contracts, view 30th-day monthly cycle expirations, and renew your plans in Nigerian Naira (₦).
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('investment_plans')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-semibold shadow-md self-start sm:self-auto"
        >
          Subscribe to New Plan +
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 shadow-md">
          <span className="text-xs font-mono uppercase text-slate-400">Active Capital Allocated</span>
          <div className="text-2xl font-extrabold text-white mt-1 tabular-nums font-mono">
            {formatNaira(totalActiveCapital)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {activeInvestments.length} running savings contracts
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 shadow-md">
          <span className="text-xs font-mono uppercase text-slate-400">Total Harvested Task Returns</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 tabular-nums font-mono">
            +{formatNaira(totalHarvestedProfits)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Simulated educational yields
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 shadow-md">
          <span className="text-xs font-mono uppercase text-slate-400">Monthly Expiration Cycle</span>
          <div className="text-2xl font-extrabold text-[#B66DFF] mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            30th of Month
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Nigeria WAT (UTC+1) Server Clock
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {(['active', 'expired', 'completed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
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
            Ready to participate in FINVANTA educational packages? Choose from our 5 investment tiers.
          </p>
          <button
            onClick={() => onNavigateTab('investment_plans')}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white text-xs font-bold transition-all shadow-md"
          >
            Browse 5 Investment Plans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((inv) => {
            const progress = Math.min(100, Math.round(((inv.daysElapsed || 0) / (inv.durationDays || 30)) * 100));
            const isCompleted = inv.status === 'completed';
            const isExpired = inv.status === 'expired';
            const isActive = inv.status === 'active';

            return (
              <div
                key={inv.id}
                className={`rounded-3xl p-5 border transition-all flex flex-col justify-between group shadow-lg ${
                  isExpired
                    ? 'bg-[#1b121c] border-amber-500/35'
                    : 'bg-[#171225] border-[#8B5CF6]/25 hover:border-[#8B5CF6]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-[10px] font-mono text-[#B66DFF] font-bold px-2 py-0.5 rounded bg-[#8B5CF6]/20">
                      REF: {inv.id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isExpired
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : isCompleted
                          ? 'bg-slate-700/50 text-slate-300'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isExpired ? 'Cycle Expired (30th Day)' : isCompleted ? 'Completed' : 'Active & Accruing'}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white">{inv.planName}</h3>

                  <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#090711]/60 border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Simulated Capital</span>
                      <div className="font-extrabold text-white font-mono text-xs sm:text-sm tabular-nums">
                        {formatNaira(inv.amount)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Daily Task Reward</span>
                      <div className="font-extrabold text-emerald-400 font-mono text-xs sm:text-sm tabular-nums">
                        +{formatNaira(inv.dailyRoi || 400, false)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Total Earned</span>
                      <div className="font-bold text-amber-300 font-mono text-xs sm:text-sm tabular-nums">
                        +{formatNaira(inv.totalEarned || 0)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Projected Value</span>
                      <div className="font-bold text-[#B66DFF] font-mono text-xs sm:text-sm tabular-nums">
                        {formatNaira(inv.totalRoiExpected || (inv.amount * 4))}
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
                        {inv.daysElapsed || 0} / {inv.durationDays || 30} Days ({progress}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#090711] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#B66DFF] to-emerald-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Started: {new Date(inv.startDate).toLocaleDateString('en-NG')}</span>
                      <span>Matures: {new Date(inv.endDate).toLocaleDateString('en-NG')}</span>
                    </div>
                  </div>
                </div>

                {isExpired && (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-[11px] text-amber-300/90 mb-3">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Expired on 30th of the month. Renew to restore daily task rewards.</span>
                    </div>
                    <button
                      onClick={() => handleRenew(inv)}
                      disabled={isRenewingId === inv.id}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{isRenewingId === inv.id ? 'Renewing...' : 'Renew Plan Now'}</span>
                    </button>
                  </div>
                )}

                {isActive && (
                  <button
                    onClick={() => onNavigateTab('tasks')}
                    className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6]/30 to-[#B66DFF]/20 hover:from-[#8B5CF6] hover:to-[#B66DFF] border border-[#8B5CF6]/50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#8B5CF6]/15"
                  >
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Go to Plan Tasks</span>
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

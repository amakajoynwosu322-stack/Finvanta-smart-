import React, { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Layers,
  PieChart,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap
} from 'lucide-react';
import { Investment, UserProfile } from '../../types';
import { formatNaira } from '../../utils/currency';

interface PortfolioTabProps {
  user: UserProfile;
  investments: Investment[];
  onNavigateTab: (tabId: string) => void;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  user,
  investments,
  onNavigateTab
}) => {
  const [compoundingMonths, setCompoundingMonths] = useState(12);

  const totalInvested = user.totalInvested || 0;
  const liquidBalance = user.balance || 0;
  const taskBalance = user.taskBalance || 0;
  const affiliateBalance = user.affiliateBalance ?? (user.totalEarned ? user.totalEarned * 0.15 : 0);
  const netWorth = totalInvested + liquidBalance + taskBalance + affiliateBalance;

  // Institutional asset allocation categories in Nigeria
  const categories = [
    { name: 'Nigerian Sovereign Treasury & FGN Notes', share: 40, color: '#8B5CF6', apy: '45.0%' },
    { name: 'Tier-1 Commercial Paper & Money Market', share: 30, color: '#B66DFF', apy: '99.0%' },
    { name: 'Infrastructure Trust Bonds', share: 18, color: '#6366F1', apy: '74.0%' },
    { name: 'Enterprise Growth Revenue Syndicate', share: 12, color: '#38BDF8', apy: '186.0%' },
  ];

  // Compound projection calculation
  const monthlyRate = 0.04;
  const projectedFutureValue = Math.round(
    netWorth * Math.pow(1 + monthlyRate, compoundingMonths)
  );
  const totalGain = projectedFutureValue - netWorth;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#B66DFF]" />
            Portfolio Analytics & Asset Allocation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time asset distribution, capital preservation index, and compounding growth projections in Nigerian Naira.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('investment_plans')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-semibold shadow-md self-start sm:self-auto"
        >
          Subscribe to New Plan +
        </button>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 shadow-md">
          <span className="text-xs font-mono uppercase text-slate-400">Total Net Portfolio</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tabular-nums">
            {formatNaira(netWorth)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Liquid: {formatNaira(liquidBalance, false)}</span>
            <span>Active Plans: {formatNaira(totalInvested, false)}</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 shadow-md">
          <span className="text-xs font-mono uppercase text-slate-400">Capital Protection Grade</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 flex items-center gap-2">
            AAA Rated
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              SECURED
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Principal capital guarantee structured on all plans
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 shadow-md">
          <span className="text-xs font-mono uppercase text-slate-400">Projected 365D Yield</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#B66DFF] mt-1">
            68.4% APY
          </div>
          <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily NGN compound returns</span>
          </div>
        </div>
      </div>

      {/* Allocation breakdown + Compounding Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Allocation Breakdown */}
        <div className="p-6 rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">Diversified Nigerian Asset Allocation</h3>
            <span className="text-xs font-mono text-[#B66DFF]">100% Capital Accounted</span>
          </div>

          {/* Allocation Progress Bar */}
          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
            {categories.map((c, idx) => (
              <div
                key={idx}
                style={{ width: `${c.share}%`, backgroundColor: c.color }}
                className="h-full"
                title={`${c.name}: ${c.share}%`}
              />
            ))}
          </div>

          <div className="space-y-3 pt-2">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#0d0918] border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-200 font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">{cat.share}%</span>
                  <span className="text-emerald-400 font-bold">{cat.apy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compounding Yield Projection */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C1433] via-[#171225] to-[#120E1E] border border-[#8B5CF6]/35 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white tracking-wide">Compounding Growth Projection</h3>
              <span className="text-xs font-mono text-emerald-400 font-bold">~4% / month</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Estimate your compounding portfolio growth over 3 to 36 months when returns are reinvested into automated savings plans.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-[#090711]/70 border border-[#8B5CF6]/30">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Projection Horizon:</span>
                <span className="font-bold text-white font-mono">{compoundingMonths} Months</span>
              </div>
              <input
                type="range"
                min="3"
                max="36"
                step="3"
                value={compoundingMonths}
                onChange={(e) => setCompoundingMonths(Number(e.target.value))}
                className="w-full accent-[#8B5CF6] h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>3 Months</span>
                <span>12 Months</span>
                <span>24 Months</span>
                <span>36 Months</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#090711]/50 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Projected Value</span>
                <div className="text-base sm:text-lg font-black text-[#B66DFF] tabular-nums mt-0.5">
                  {formatNaira(projectedFutureValue)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#090711]/50 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Estimated Gain</span>
                <div className="text-base sm:text-lg font-black text-emerald-400 tabular-nums mt-0.5">
                  +{formatNaira(totalGain)}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('investment_plans')}
            className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Start a Nigerian Savings Plan
          </button>
        </div>
      </div>
    </div>
  );
};

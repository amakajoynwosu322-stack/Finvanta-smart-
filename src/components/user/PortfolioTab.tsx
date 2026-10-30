import React, { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Cpu,
  Layers,
  PieChart,
  Shield,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Investment, UserProfile } from '../../types';

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
  const netWorth = totalInvested + liquidBalance;

  // Quantitative breakdown categories
  const categories = [
    { name: 'Quantum Algorithmic HFT', share: 42, color: '#8B5CF6', apy: '45.0%' },
    { name: 'Cross-Chain Neural Arbitrage', share: 28, color: '#B66DFF', apy: '99.0%' },
    { name: 'Perpetuals Delta-Neutral', share: 18, color: '#6366F1', apy: '74.0%' },
    { name: 'Apex Sovereign Yield', share: 12, color: '#38BDF8', apy: '186.0%' },
  ];

  // Compound projection calculation
  // A = P * (1 + r/n)^(nt) with simulated monthly yield rate ~ 4%
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
            Real-time quantitative distribution, risk telemetry, and compounding projections.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('investment_plans')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-semibold shadow-md self-start sm:self-auto"
        >
          Deploy More Capital +
        </button>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-3xl p-5">
          <span className="text-xs font-mono uppercase text-slate-400">Total Net Capital</span>
          <div className="text-3xl font-extrabold text-white mt-1">
            ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Liquid: ${liquidBalance.toFixed(0)}</span>
            <span>Locked: ${totalInvested.toFixed(0)}</span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <span className="text-xs font-mono uppercase text-slate-400">Risk Profile Index</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1 flex items-center gap-2">
            94/100
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              OPTIMAL
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Delta-neutral hedging reduces drawdown to &lt; 1.4%
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <span className="text-xs font-mono uppercase text-slate-400">Projected 365D APY</span>
          <div className="text-3xl font-extrabold text-[#B66DFF] mt-1">
            68.4%
          </div>
          <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Yield compounding enabled</span>
          </div>
        </div>
      </div>

      {/* Allocation breakdown + Institutional Quantitative Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Allocation Bars */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-white tracking-wide">Strategy Allocation</h3>
            <span className="text-xs font-mono text-slate-400">4 Active Nodes</span>
          </div>

          {/* Combined Progress Bar */}
          <div className="w-full h-4 rounded-full overflow-hidden flex mb-6 p-0.5 bg-[#090711]">
            {categories.map((c, i) => (
              <div
                key={i}
                style={{ width: `${c.share}%`, backgroundColor: c.color }}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                title={`${c.name}: ${c.share}%`}
              />
            ))}
          </div>

          {/* List items */}
          <div className="space-y-4">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#090711]/60 border border-[#8B5CF6]/15 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-md shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{cat.name}</div>
                    <div className="text-[11px] text-slate-400">Target APY: {cat.apy}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-white">{cat.share}%</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    ${((netWorth * cat.share) / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compound Growth Simulation */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white tracking-wide">Compound Yield Simulator</h3>
              <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/25 text-[#C4B5FD] text-[10px] font-mono">
                Formula: P(1 + r)^t
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Simulate exponential capital accumulation by automatically reinvesting harvested daily profits.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-300">Investment Horizon</span>
                  <span className="text-[#B66DFF] font-bold font-mono">{compoundingMonths} Months</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="36"
                  step="3"
                  value={compoundingMonths}
                  onChange={(e) => setCompoundingMonths(Number(e.target.value))}
                  className="w-full accent-[#8B5CF6] h-2 bg-[#090711] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>3 Mo</span>
                  <span>12 Mo</span>
                  <span>24 Mo</span>
                  <span>36 Mo</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1E1634] to-[#120E1E] border border-[#8B5CF6]/30 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Capital Base</span>
                  <span className="font-mono font-semibold text-white">${netWorth.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Projected Total Gain</span>
                  <span className="font-mono font-semibold text-emerald-400">+${totalGain.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Estimated Value</span>
                  <span className="text-base font-extrabold text-[#B66DFF] font-mono">
                    ${projectedFutureValue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Historical Quantitative Backtest: 99.8% Reliability
            </span>
          </div>
        </div>
      </div>

      {/* Quantitative Engine Metrics Table */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-base font-bold text-white tracking-wide mb-4">Algorithmic Execution Metrics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#090711]/60 border border-[#8B5CF6]/15">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Sharpe Ratio</span>
            <div className="text-xl font-extrabold text-white mt-1">3.42</div>
            <span className="text-[10px] text-emerald-400 font-medium">Top decile hedge fund tier</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090711]/60 border border-[#8B5CF6]/15">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Max Drawdown</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">1.28%</div>
            <span className="text-[10px] text-slate-400">Trailing 180-day window</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090711]/60 border border-[#8B5CF6]/15">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Trade Win Rate</span>
            <div className="text-xl font-extrabold text-white mt-1">94.6%</div>
            <span className="text-[10px] text-emerald-400">Sub-millisecond limit arb</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090711]/60 border border-[#8B5CF6]/15">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Liquidity Depth</span>
            <div className="text-xl font-extrabold text-[#B66DFF] mt-1">$480M+</div>
            <span className="text-[10px] text-slate-400">Across Binance, OKX, Bybit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

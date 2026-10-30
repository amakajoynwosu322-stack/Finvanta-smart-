import React, { useState } from 'react';
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowUpRight,
  Briefcase,
  CheckCircle,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Megaphone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap
} from 'lucide-react';
import { Announcement, Investment, InvestmentPlan, Transaction, UserProfile } from '../../types';
import { claimInvestmentProfit } from '../../services/db';
import confetti from 'canvas-confetti';

interface OverviewTabProps {
  user: UserProfile;
  investments: Investment[];
  transactions: Transaction[];
  plans: InvestmentPlan[];
  announcements: Announcement[];
  onNavigateTab: (tabId: string) => void;
  onRefresh: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  user,
  investments,
  transactions,
  plans,
  announcements,
  onNavigateTab,
  onRefresh
}) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimToast, setClaimToast] = useState<string | null>(null);

  const totalPortfolio = (user.balance || 0) + (user.totalInvested || 0);
  const activeInvestments = investments.filter((i) => i.status === 'active');

  const handleClaimYield = async (inv: Investment) => {
    try {
      setClaimingId(inv.id);
      const res = await claimInvestmentProfit(user, inv);
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
        setClaimToast(res.message);
        setTimeout(() => setClaimToast(null), 4000);
        onRefresh();
      } else {
        setClaimToast(res.message);
        setTimeout(() => setClaimToast(null), 3000);
      }
    } catch (err: any) {
      setClaimToast(err?.message || 'Failed to claim yield');
    } finally {
      setClaimingId(null);
    }
  };

  // Mock chart coordinates based on timeRange
  const chartPointsMap = {
    '7D': [
      { label: 'Mon', value: 35 },
      { label: 'Tue', value: 42 },
      { label: 'Wed', value: 48 },
      { label: 'Thu', value: 54 },
      { label: 'Fri', value: 68 },
      { label: 'Sat', value: 76 },
      { label: 'Sun', value: 92 },
    ],
    '30D': [
      { label: 'W1', value: 20 },
      { label: 'W2', value: 38 },
      { label: 'W3', value: 62 },
      { label: 'W4', value: 85 },
      { label: 'Today', value: 100 },
    ],
    '90D': [
      { label: 'M1', value: 15 },
      { label: 'M2', value: 45 },
      { label: 'M3', value: 90 },
      { label: 'Now', value: 120 },
    ],
    '1Y': [
      { label: 'Q1', value: 10 },
      { label: 'Q2', value: 35 },
      { label: 'Q3', value: 80 },
      { label: 'Q4', value: 150 },
    ]
  };

  const points = chartPointsMap[timeRange];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {claimToast && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/30 to-[#B66DFF]/20 border border-[#8B5CF6]/50 text-white text-xs font-semibold flex items-center justify-between shadow-lg glow-purple-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B66DFF]" />
            <span>{claimToast}</span>
          </div>
          <button onClick={() => setClaimToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Announcement Bar */}
      {announcements.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171225] via-[#23153d] to-[#171225] border border-[#8B5CF6]/30 p-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/25 border border-[#8B5CF6]/40 flex items-center justify-center shrink-0 text-[#B66DFF]">
              <Megaphone className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{announcements[0].title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#8B5CF6]/30 text-[#C4B5FD] uppercase">
                  {announcements[0].category.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">{announcements[0].content}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('notifications')}
            className="shrink-0 text-xs text-[#B66DFF] hover:text-white font-medium flex items-center gap-1 transition-colors"
          >
            Details <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold tracking-wide uppercase font-mono">Net Portfolio</span>
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            ${totalPortfolio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="flex items-center text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              +18.4%
            </span>
            <span className="text-slate-400 text-[11px]">All-time simulated yield</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#8B5CF6]/10 rounded-full blur-2xl group-hover:bg-[#8B5CF6]/20 transition-all pointer-events-none" />
        </div>

        {/* Liquid Balance */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold tracking-wide uppercase font-mono">Available Liquid</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            ${(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('deposit')}
              className="text-[11px] font-semibold text-[#B66DFF] hover:text-white flex items-center gap-1 transition-colors"
            >
              Deposit +
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => onNavigateTab('withdrawal')}
              className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Withdraw ↑
            </button>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
        </div>

        {/* Active Capital Locked */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold tracking-wide uppercase font-mono">Active Capital</span>
            <div className="w-8 h-8 rounded-xl bg-[#B66DFF]/20 flex items-center justify-center text-[#B66DFF]">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            ${(user.totalInvested || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>{activeInvestments.length} Active Plans</span>
            <span className="text-[#C4B5FD] font-mono">Avg 2.1% daily</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#B66DFF]/10 rounded-full blur-2xl group-hover:bg-[#B66DFF]/20 transition-all pointer-events-none" />
        </div>

        {/* Total Earned Yield */}
        <div className="glass-card glass-card-hover rounded-3xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold tracking-wide uppercase font-mono">Harvested Profit</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-amber-300 tracking-tight">
            +${(user.totalEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto Compounding Active</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
        </div>
      </div>

      {/* Main Grid: Interactive Curve Chart + Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Growth Trajectory Chart */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 relative flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">Yield Growth Trajectory</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#B66DFF] text-[10px] font-mono">
                  Autonomous Alpha
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Simulated cumulative returns over time</p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center bg-[#090711] p-1 rounded-xl border border-[#8B5CF6]/20 self-start sm:self-auto">
              {(['7D', '30D', '90D', '1Y'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    timeRange === r
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Glow Chart */}
          <div className="w-full h-56 relative flex items-end justify-between px-2 pt-6">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 180"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B66DFF" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#090711" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="50%" stopColor="#B66DFF" />
                  <stop offset="100%" stopColor="#E9D5FF" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#8B5CF6" strokeOpacity="0.1" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#8B5CF6" strokeOpacity="0.1" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#8B5CF6" strokeOpacity="0.1" strokeDasharray="4 4" />

              {/* Dynamic Path Calculation based on points */}
              {(() => {
                const maxVal = Math.max(...points.map((p) => p.value));
                const minVal = Math.min(...points.map((p) => p.value));
                const range = maxVal - minVal || 1;
                const coords = points.map((p, idx) => {
                  const x = (idx / (points.length - 1)) * 500;
                  const y = 160 - ((p.value - minVal) / range) * 120;
                  return { x, y };
                });

                // Generate smooth cubic bezier string
                let d = `M ${coords[0].x} ${coords[0].y}`;
                for (let i = 0; i < coords.length - 1; i++) {
                  const p0 = coords[i];
                  const p1 = coords[i + 1];
                  const mx = (p0.x + p1.x) / 2;
                  d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
                }

                const areaD = `${d} L 500 180 L 0 180 Z`;

                return (
                  <>
                    <path d={areaD} fill="url(#purpleGradient)" />
                    <path d={d} fill="none" stroke="url(#lineStroke)" strokeWidth="3.5" strokeLinecap="round" />
                    {coords.map((c, i) => (
                      <g key={i}>
                        <circle cx={c.x} cy={c.y} r="5" fill="#171225" stroke="#B66DFF" strokeWidth="2.5" />
                        <circle cx={c.x} cy={c.y} r="2" fill="#FFFFFF" />
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Chart X-axis labels */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-3 px-1">
            {points.map((p, idx) => (
              <span key={idx}>{p.label}</span>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Quant Algorithms active across 4 liquidity nodes
            </div>
            <button
              onClick={() => onNavigateTab('portfolio')}
              className="text-[#B66DFF] hover:underline flex items-center gap-1 font-semibold"
            >
              Detailed Breakdown <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Actions & Protocol Highlights */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide mb-1">Quick Actions</h3>
            <p className="text-xs text-slate-400 mb-5">Instant execution sandbox triggers</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => onNavigateTab('deposit')}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#6D28D9]/30 border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/60 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/30 flex items-center justify-center text-white mb-2 group-hover:scale-105 transition-transform">
                  <ArrowDownCircle className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Deposit</div>
                <div className="text-[10px] text-slate-400">Simulate funds</div>
              </button>

              <button
                onClick={() => onNavigateTab('investment_plans')}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-[#B66DFF]/20 to-[#8B5CF6]/20 border border-[#B66DFF]/30 hover:border-[#B66DFF]/60 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#B66DFF]/30 flex items-center justify-center text-white mb-2 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Invest Plans</div>
                <div className="text-[10px] text-slate-400">Up to 3.1% daily</div>
              </button>

              <button
                onClick={() => onNavigateTab('withdrawal')}
                className="p-3.5 rounded-2xl bg-[#090711]/70 border border-slate-800 hover:border-[#8B5CF6]/40 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 mb-2 group-hover:scale-105 transition-transform">
                  <ArrowUpCircle className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Withdraw</div>
                <div className="text-[10px] text-slate-400">Simulated payout</div>
              </button>

              <button
                onClick={() => onNavigateTab('referrals')}
                className="p-3.5 rounded-2xl bg-[#090711]/70 border border-slate-800 hover:border-[#8B5CF6]/40 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 mb-2 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Affiliate</div>
                <div className="text-[10px] text-slate-400">7% commission</div>
              </button>
            </div>
          </div>

          {/* Featured Plan highlight */}
          {plans.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1F1835] to-[#120E1E] border border-[#8B5CF6]/35 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[10px] uppercase font-bold text-[#B66DFF] tracking-wider font-mono">
                  HOTTEST PLAN
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  {plans[0].dailyRoi}% DAILY
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-white">{plans[0].name}</h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{plans[0].description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-mono">
                  Min ${plans[0].minDeposit.toLocaleString()}
                </span>
                <button
                  onClick={() => onNavigateTab('investment_plans')}
                  className="px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white text-xs font-bold transition-all shadow-md shadow-[#8B5CF6]/30"
                >
                  Allocate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Investments Harvest Section */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Active Investment Contracts</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live harvesting & yield accrual</p>
          </div>
          <button
            onClick={() => onNavigateTab('my_investments')}
            className="text-xs text-[#B66DFF] hover:underline font-semibold flex items-center gap-1"
          >
            View All ({investments.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeInvestments.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl bg-[#090711]/50 border border-dashed border-[#8B5CF6]/20">
            <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No active investment contracts yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Allocate your simulated liquid balance into any quantum plan to begin harvesting daily profits.
            </p>
            <button
              onClick={() => onNavigateTab('investment_plans')}
              className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-xs font-semibold shadow-md"
            >
              Explore Plans
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeInvestments.slice(0, 3).map((inv) => {
              const progressPct = Math.min(100, Math.round(((inv.daysElapsed || 0) / inv.durationDays) * 100));
              return (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl bg-[#090711]/70 border border-[#8B5CF6]/25 hover:border-[#8B5CF6]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono text-[#B66DFF] font-bold">
                        {inv.dailyRoi}% Daily ROI
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{inv.planName}</h4>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400">Principal</span>
                        <div className="font-bold text-white">${inv.amount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Earned So Far</span>
                        <div className="font-bold text-emerald-400">+${(inv.totalEarned || 0).toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>Duration Progress</span>
                        <span className="font-mono">{inv.daysElapsed || 0} / {inv.durationDays} Days</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#B66DFF]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClaimYield(inv)}
                    disabled={claimingId === inv.id}
                    className="mt-4 w-full py-2 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 border border-[#8B5CF6]/40 text-[#B66DFF] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {claimingId === inv.id ? 'Harvesting...' : 'Harvest Accrued Yield'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Ledger Feed */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white tracking-wide">Recent Transactions</h3>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs text-[#B66DFF] hover:underline font-semibold"
          >
            Full Ledger →
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">No recorded transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#8B5CF6]/5 transition-colors">
                    <td className="py-3 px-3 capitalize font-medium text-white flex items-center gap-2">
                      {tx.type === 'deposit' && <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />}
                      {tx.type === 'withdrawal' && <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400" />}
                      {tx.type === 'roi_payout' && <Zap className="w-3.5 h-3.5 text-[#B66DFF]" />}
                      {tx.type === 'investment' && <Briefcase className="w-3.5 h-3.5 text-purple-400" />}
                      {tx.type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{tx.reference || tx.id.slice(-8)}</td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toLocaleString()} {tx.currency || 'USD'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : tx.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString()}
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

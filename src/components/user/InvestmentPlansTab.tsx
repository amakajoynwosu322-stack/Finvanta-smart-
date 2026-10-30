import React, { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  HelpCircle,
  Percent,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap
} from 'lucide-react';
import { InvestmentPlan, UserProfile } from '../../types';
import { executeInvestment } from '../../services/db';
import confetti from 'canvas-confetti';

interface InvestmentPlansTabProps {
  user: UserProfile;
  plans: InvestmentPlan[];
  onNavigateTab: (tabId: string) => void;
  onRefresh: () => void;
}

export const InvestmentPlansTab: React.FC<InvestmentPlansTabProps> = ({
  user,
  plans,
  onNavigateTab,
  onRefresh
}) => {
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [calcPlan, setCalcPlan] = useState<InvestmentPlan>(plans[0] || {} as any);
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [investAmount, setInvestAmount] = useState<number>(1000);
  const [isInvesting, setIsInvesting] = useState<boolean>(false);
  const [investStatus, setInvestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active plans only
  const activePlans = plans.filter((p) => p.active);

  // ROI Calculator Calculations
  const activeCalcPlan = calcPlan?.id ? calcPlan : activePlans[0] || plans[0];
  const dailyProfit = (calcAmount * (activeCalcPlan?.dailyRoi || 1.5)) / 100;
  const totalProfit = dailyProfit * (activeCalcPlan?.durationDays || 30);
  const totalPayout = calcAmount + totalProfit;

  const handleOpenInvestModal = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setInvestAmount(plan.minDeposit);
    setInvestStatus(null);
  };

  const handleConfirmInvestment = async () => {
    if (!selectedPlan) return;
    try {
      setIsInvesting(true);
      setInvestStatus(null);
      const res = await executeInvestment(user, selectedPlan, investAmount);
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setInvestStatus({ type: 'success', message: res.message });
        setTimeout(() => {
          setSelectedPlan(null);
          onRefresh();
          onNavigateTab('my_investments');
        }, 2000);
      } else {
        setInvestStatus({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setInvestStatus({ type: 'error', message: err?.message || 'Transaction failed.' });
    } finally {
      setIsInvesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#B66DFF]" />
            Quantitative Yield Plans
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audited algorithmic trading vaults with daily accrued profits and capital return at maturity.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/30 text-xs">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Available:</span>
          <span className="font-bold text-white font-mono">${(user.balance || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Interactive ROI Calculator Card */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden border-[#8B5CF6]/35 glow-purple-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF]">
            <Calculator className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white tracking-wide">Interactive Yield & Return Calculator</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Plan selection buttons */}
            <div>
              <label className="text-xs text-slate-400 block mb-2 font-medium">Select Investment Strategy</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activePlans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCalcPlan(p);
                      if (calcAmount < p.minDeposit) setCalcAmount(p.minDeposit);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                      activeCalcPlan?.id === p.id
                        ? 'bg-[#8B5CF6]/20 border-[#B66DFF] text-white shadow-sm'
                        : 'bg-[#090711]/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold truncate">{p.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-[#B66DFF] font-mono">{p.dailyRoi}% / day</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input & Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300">Deposit Amount (USD)</span>
                <span className="text-[#B66DFF] font-bold font-mono text-sm">${calcAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={activeCalcPlan?.minDeposit || 100}
                max={activeCalcPlan?.maxDeposit || 50000}
                step={50}
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                className="w-full accent-[#8B5CF6] h-2 bg-[#090711] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Min: ${activeCalcPlan?.minDeposit.toLocaleString()}</span>
                <span>Max: ${activeCalcPlan?.maxDeposit.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Calculator Output Display */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1E1635] to-[#120E1E] border border-[#8B5CF6]/40 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#B66DFF] font-bold">
                Projected Yield Breakdown
              </span>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Daily Profit:</span>
                <span className="font-mono font-bold text-emerald-400">+${dailyProfit.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Duration:</span>
                <span className="font-mono font-semibold text-white">{activeCalcPlan?.durationDays} Days</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Net Yield:</span>
                <span className="font-mono font-bold text-emerald-400">+${totalProfit.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white">Total Payout:</span>
                <span className="text-lg font-extrabold text-[#B66DFF] font-mono">
                  ${totalPayout.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleOpenInvestModal(activeCalcPlan)}
              className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Lock in Strategy Now
            </button>
          </div>
        </div>
      </div>

      {/* Available Plans Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {activePlans.map((plan, idx) => {
          const isFeatured = idx === 1; // Neural Arbitrage
          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                isFeatured
                  ? 'bg-gradient-to-b from-[#1C1433] via-[#171225] to-[#120E1E] border-2 border-[#B66DFF] shadow-2xl glow-purple'
                  : 'glass-card border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50'
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#B66DFF] text-white text-[10px] font-black tracking-wider uppercase shadow-md">
                  MOST POPULAR
                </div>
              )}

              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#C4B5FD] font-mono text-[10px] uppercase">
                    {plan.riskLevel} Risk
                  </span>
                  <span className="text-emerald-400 font-bold font-mono text-xs">
                    {plan.capitalReturn ? 'Capital Return: YES' : 'Yield Only'}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-white leading-tight">{plan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{plan.description}</p>

                {/* Big Daily ROI highlight */}
                <div className="my-5 p-4 rounded-2xl bg-[#090711]/70 border border-[#8B5CF6]/20 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Daily ROI</span>
                  <div className="text-3xl font-black text-[#B66DFF] tracking-tight mt-0.5">
                    {plan.dailyRoi}%
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold font-mono">
                    {plan.totalRoi}% Total in {plan.durationDays} Days
                  </span>
                </div>

                {/* Min / Max Deposits */}
                <div className="space-y-2 text-xs border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Min Deposit:</span>
                    <span className="font-mono font-bold text-white">${plan.minDeposit.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Max Deposit:</span>
                    <span className="font-mono font-bold text-white">${plan.maxDeposit.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Contract Term:</span>
                    <span className="font-mono text-slate-200">{plan.durationDays} Calendar Days</span>
                  </div>
                </div>

                {/* Feature bullet points */}
                <div className="space-y-2 mb-6">
                  {plan.features.slice(0, 4).map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleOpenInvestModal(plan)}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 ${
                  isFeatured
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#B66DFF] text-white shadow-lg shadow-[#8B5CF6]/30 hover:brightness-110'
                    : 'bg-[#171225] hover:bg-[#8B5CF6]/20 text-white border border-[#8B5CF6]/40'
                }`}
              >
                Invest in Plan <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Invest Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 shadow-2xl glow-purple">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Confirm Plan Allocation</h3>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#090711]/80 border border-[#8B5CF6]/25 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Target Strategy:</span>
                <span className="text-xs font-bold text-white">{selectedPlan.name}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-400">Daily Return:</span>
                <span className="text-xs font-bold text-[#B66DFF] font-mono">{selectedPlan.dailyRoi}% Daily</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-400">Duration:</span>
                <span className="text-xs font-bold text-white font-mono">{selectedPlan.durationDays} Days</span>
              </div>
            </div>

            {investStatus && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                  investStatus.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                }`}
              >
                {investStatus.message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                  Investment Capital (USD)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={selectedPlan.minDeposit}
                    max={selectedPlan.maxDeposit}
                    value={investAmount}
                    onChange={(e) => setInvestAmount(Number(e.target.value))}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white font-mono focus:outline-none focus:border-[#B66DFF]"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>Available Balance: ${(user.balance || 0).toLocaleString()}</span>
                  <button
                    onClick={() => setInvestAmount(Math.min(user.balance, selectedPlan.maxDeposit))}
                    className="text-[#B66DFF] font-bold hover:underline"
                  >
                    Use Max Available
                  </button>
                </div>
              </div>

              {/* Expected payout estimation */}
              <div className="p-3.5 rounded-xl bg-[#090711]/50 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Daily Yield:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    +${((investAmount * selectedPlan.dailyRoi) / 100).toFixed(2)}/day
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Return at Maturity:</span>
                  <span className="text-[#B66DFF] font-bold font-mono">
                    +${(((investAmount * selectedPlan.dailyRoi) / 100) * selectedPlan.durationDays).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInvestment}
                  disabled={isInvesting || user.balance < investAmount || investAmount < selectedPlan.minDeposit}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-bold shadow-lg shadow-[#8B5CF6]/25 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isInvesting ? 'Authorizing Quantum Node...' : 'Confirm Allocation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

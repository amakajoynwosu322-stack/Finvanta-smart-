import React, { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Percent,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap
} from 'lucide-react';
import { InvestmentPlan, UserProfile } from '../../types';
import { DEFAULT_PLANS, executeInvestment } from '../../services/db';
import { formatNaira } from '../../utils/currency';
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
  // Use DEFAULT_PLANS fallback if plans from Firestore are empty or not yet loaded with all 5
  const displayPlans = plans.length >= 5 ? plans : DEFAULT_PLANS;
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [calcPlan, setCalcPlan] = useState<InvestmentPlan>(displayPlans[1] || displayPlans[0]);
  const [isInvesting, setIsInvesting] = useState<boolean>(false);
  const [investStatus, setInvestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active plan calculation
  const planCapital = calcPlan.simulatedCapital || calcPlan.minDeposit || 3000;
  const planProjected = calcPlan.projectedValue || 18000;
  const planDailyReward = calcPlan.dailyTaskReward || 600;
  const totalDays = calcPlan.durationDays || 30;

  const handleOpenInvestModal = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setInvestStatus(null);
  };

  const handleConfirmInvestment = async () => {
    if (!selectedPlan) return;
    const requiredCapital = selectedPlan.simulatedCapital || selectedPlan.minDeposit;

    if (user.balance < requiredCapital) {
      setInvestStatus({
        type: 'error',
        message: `Insufficient Main Balance. You need ${formatNaira(requiredCapital)} but have ${formatNaira(user.balance)} in your Main Balance. Fund your Main Balance first.`
      });
      return;
    }

    try {
      setIsInvesting(true);
      setInvestStatus(null);
      const res = await executeInvestment(user, selectedPlan, requiredCapital);
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
          onNavigateTab('tasks');
        }, 1800);
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
      {/* Educational Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#171225] border border-[#8B5CF6]/30 flex items-start gap-3 shadow-lg">
        <Info className="w-5 h-5 text-[#B66DFF] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white uppercase tracking-wider block mb-0.5">
            Fictional Educational Simulation Notice
          </span>
          All capital allocations, daily task earnings, and illustrative projected returns shown below are simulated for financial literacy training. No real monetary transactions or guaranteed returns are offered. Plans expire on the 30th of each month.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#B66DFF]" />
            FINVANTA Investment Packages
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose from five curated 30-day tiers with guaranteed daily task unlocks in Nigerian Naira (₦).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/30 text-xs">
            <Wallet className="w-4 h-4 text-[#B66DFF]" />
            <span className="text-slate-400">Main Balance (Plans Only):</span>
            <span className="font-bold text-white font-mono">{formatNaira(user.balance)}</span>
          </div>
          <button
            onClick={() => onNavigateTab('deposit')}
            className="px-3 py-1.5 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#C4B5FD] text-xs font-semibold"
          >
            + Add Capital
          </button>
        </div>
      </div>

      {/* 5 Distinct Investment Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {displayPlans.map((plan) => {
          const isPopular = plan.isPopular || plan.tierKey === 'popular';
          const isCurrentActive = user.activePlanTier === plan.tierKey;
          const capital = plan.simulatedCapital || plan.minDeposit;
          const projected = plan.projectedValue || (capital * 4);
          const taskReward = plan.dailyTaskReward || 400;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-5 flex flex-col justify-between transition-all relative ${
                isPopular
                  ? 'bg-gradient-to-b from-[#22163d] via-[#171225] to-[#120E1E] border-2 border-[#B66DFF] shadow-2xl glow-purple'
                  : 'bg-[#171225] border border-[#8B5CF6]/25 hover:border-[#8B5CF6]/60 shadow-lg'
              }`}
            >
              {/* Popular / Active Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#B66DFF] text-white text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  MOST POPULAR
                </div>
              )}

              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#C4B5FD] font-mono text-[10px] uppercase font-bold">
                    {plan.name}
                  </span>
                  {isCurrentActive && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-black text-white mt-1">{plan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {plan.description}
                </p>

                {/* Simulated Capital Box */}
                <div className="my-4 p-3.5 rounded-2xl bg-[#090711]/70 border border-[#8B5CF6]/20 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
                    Simulated Capital
                  </span>
                  <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
                    {formatNaira(capital, false)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    Deducted from Main Balance
                  </span>
                </div>

                {/* Plan Metrics */}
                <div className="space-y-2 text-xs border-b border-slate-800/80 pb-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-mono font-semibold text-white">30 Days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Illustrative Projected Value:</span>
                    <span className="font-mono font-extrabold text-[#B66DFF]">
                      {formatNaira(projected, false)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Daily Task Reward:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{formatNaira(taskReward, false)} / day
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Task Reset Interval:</span>
                    <span className="font-mono text-slate-300">24 Hours</span>
                  </div>
                </div>

                {/* Bullets */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlocks Tier {plan.name} Tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>30th-Day Monthly Cycle</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B66DFF] shrink-0" />
                    <span>Fictional Educational Sim</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleOpenInvestModal(plan)}
                disabled={isCurrentActive}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  isCurrentActive
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                    : isPopular
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#B66DFF] text-white shadow-lg shadow-[#8B5CF6]/30 hover:brightness-110'
                    : 'bg-[#171225] hover:bg-[#8B5CF6]/20 text-white border border-[#8B5CF6]/40'
                }`}
              >
                <span>{isCurrentActive ? 'Current Active Plan' : `Activate ${formatNaira(capital, false)}`}</span>
                {!isCurrentActive && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Yield & Returns Interactive Calculator */}
      <div className="rounded-3xl p-6 relative overflow-hidden bg-[#171225] border border-[#8B5CF6]/35 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF]">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Illustrative Returns & Task Yield Calculator (NGN / ₦)
            </h3>
            <p className="text-xs text-slate-400">
              Select any plan tier to visualize projected 30-day educational simulated outputs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-2 font-medium">Select Plan Tier</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {displayPlans.map((p) => {
                  const isSelected = calcPlan.tierKey === p.tierKey;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setCalcPlan(p)}
                      className={`p-3 rounded-xl text-left border transition-all text-xs ${
                        isSelected
                          ? 'bg-[#8B5CF6]/25 border-[#B66DFF] text-white shadow-md'
                          : 'bg-[#090711]/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold truncate">{p.name}</div>
                      <div className="text-[11px] text-[#B66DFF] font-mono mt-0.5">
                        {formatNaira(p.simulatedCapital || p.minDeposit, false)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                        +{formatNaira(p.dailyTaskReward || 400, false)}/d
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#090711]/60 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Selected Package:</span>
                <span className="font-bold text-white">{calcPlan.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Simulated Required Capital:</span>
                <span className="font-mono font-bold text-white">{formatNaira(planCapital)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Duration Cycle:</span>
                <span className="font-mono text-slate-200">30 Days (Expires on the 30th)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Daily Task Reward:</span>
                <span className="font-mono font-bold text-emerald-400">+{formatNaira(planDailyReward)} / day</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Task Reset Interval:</span>
                <span className="font-mono text-slate-200">24 Hours</span>
              </div>
            </div>
          </div>

          {/* Calculator Output */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1E1635] to-[#120E1E] border border-[#8B5CF6]/40 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#B66DFF] font-bold">
                Illustrative 30-Day Projection
              </span>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Simulated Capital:</span>
                <span className="font-mono font-semibold text-white">{formatNaira(planCapital)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Daily Task Earnings:</span>
                <span className="font-mono font-bold text-emerald-400">+{formatNaira(planDailyReward)}/day</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">30-Day Total Task Sum:</span>
                <span className="font-mono font-bold text-emerald-400">+{formatNaira(planDailyReward * 30)}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Projected Value:</span>
                  <span className="text-[10px] text-slate-500 font-mono">(Illustrative benchmark)</span>
                </div>
                <span className="text-base sm:text-lg font-black text-[#B66DFF] font-mono tabular-nums">
                  {formatNaira(planProjected)}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleOpenInvestModal(calcPlan)}
              className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Activate {calcPlan.name} Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subscribe Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Subscribe to {selectedPlan.name}</h3>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#090711]/80 border border-[#8B5CF6]/25 mb-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Selected Plan:</span>
                <span className="font-bold text-white">{selectedPlan.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Required Capital:</span>
                <span className="font-bold text-white font-mono text-sm">
                  {formatNaira(selectedPlan.simulatedCapital || selectedPlan.minDeposit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Daily Task Reward:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  +{formatNaira(selectedPlan.dailyTaskReward || 400)} / day
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Task Reset Interval:</span>
                <span className="font-bold text-slate-300 font-mono">24 Hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cycle Duration:</span>
                <span className="font-bold text-slate-300 font-mono">30 Days (Expires on 30th)</span>
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
              <div className="p-3.5 rounded-xl bg-[#090711]/50 border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Main Balance:</span>
                  <span className={`font-mono font-bold ${user.balance >= (selectedPlan.simulatedCapital || selectedPlan.minDeposit) ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatNaira(user.balance)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>After Purchase:</span>
                  <span className="font-mono text-slate-300">
                    {formatNaira(Math.max(0, user.balance - (selectedPlan.simulatedCapital || selectedPlan.minDeposit)))}
                  </span>
                </div>
                <p className="text-[10px] text-amber-300/80 pt-1 border-t border-slate-800 mt-2">
                  * Main Balance is used exclusively to purchase simulated investment plans. It is never withdrawable.
                </p>
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
                  disabled={isInvesting || user.balance < (selectedPlan.simulatedCapital || selectedPlan.minDeposit)}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-bold shadow-lg shadow-[#8B5CF6]/25 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isInvesting
                    ? 'Activating Plan...'
                    : user.balance < (selectedPlan.simulatedCapital || selectedPlan.minDeposit)
                    ? 'Insufficient Main Balance'
                    : `Confirm ${formatNaira(selectedPlan.simulatedCapital || selectedPlan.minDeposit, false)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

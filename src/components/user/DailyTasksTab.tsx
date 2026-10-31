import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  Lock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap
} from 'lucide-react';
import { Investment, UserProfile } from '../../types';
import { claimPlanSpecificDailyTask, DEFAULT_PLANS, PLAN_TIER_TASKS, renewInvestmentPlan } from '../../services/db';
import { formatNaira } from '../../utils/currency';
import { formatWatTime, getTaskWithdrawalStatus, getWatDate, isPlanEligibleForMonthlyExpiration } from '../../utils/watTime';
import confetti from 'canvas-confetti';

interface DailyTasksTabProps {
  user: UserProfile;
  investments?: Investment[];
  onNavigateTab: (tabId: string) => void;
  onRefresh: () => void;
}

export const DailyTasksTab: React.FC<DailyTasksTabProps> = ({
  user,
  investments = [],
  onNavigateTab,
  onRefresh
}) => {
  const [claimingTier, setClaimingTier] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const taskBalance = user.taskBalance || 0;
  const activeTierKey = user.activePlanTier;
  const activePlanMeta = DEFAULT_PLANS.find((p) => p.tierKey === activeTierKey);

  // Check if active investment is marked expired
  const activeInvestment = investments.find(
    (i) => i.id === user.activeInvestmentId || (i.tierKey === activeTierKey && i.status === 'active')
  );
  const isPlanExpired = activeInvestment?.status === 'expired' || (!activeInvestment && !activeTierKey && investments.some((i) => i.status === 'expired'));
  const expiredInvestment = investments.find((i) => i.status === 'expired') || (activeInvestment?.status === 'expired' ? activeInvestment : null);

  // 24-hour reset countdown based on lastTaskClaimTimestamp
  useEffect(() => {
    const updateCountdown = () => {
      if (!user.lastTaskClaimTimestamp) {
        setTimeRemaining('');
        return;
      }
      const lastClaim = new Date(user.lastTaskClaimTimestamp).getTime();
      const nextAvailable = lastClaim + 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = nextAvailable - now;

      if (diff <= 0) {
        setTimeRemaining('Available now');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [user.lastTaskClaimTimestamp]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleClaimTierTask = async (tierKey: string) => {
    try {
      setClaimingTier(tierKey);
      const res = await claimPlanSpecificDailyTask(user, tierKey);
      if (res.success) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.65 }
        });
        showToast(res.message);
        onRefresh();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to claim task reward.', 'error');
    } finally {
      setClaimingTier(null);
    }
  };

  const handleRenewPlan = async () => {
    if (!expiredInvestment) {
      onNavigateTab('investment_plans');
      return;
    }
    try {
      setIsRenewing(true);
      const res = await renewInvestmentPlan(user, expiredInvestment);
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        showToast(res.message);
        onRefresh();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to renew plan.', 'error');
    } finally {
      setIsRenewing(false);
    }
  };

  // Task withdrawal window info
  const taskStatus = getTaskWithdrawalStatus();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xl backdrop-blur-xl ${
            toastMessage.type === 'success'
              ? 'bg-[#171225]/95 border-[#8B5CF6]/50 text-white'
              : 'bg-rose-950/90 border-rose-600/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B66DFF]" />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Monthly Plan Expiration Notice (If Expired on 30th) */}
      {isPlanExpired && (
        <div className="p-5 rounded-3xl bg-amber-950/40 border-2 border-amber-500/60 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Plan Cycle Expired on 30th of the Month
              </h3>
              <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
                Your monthly plan completed its cycle on the 30th day. Daily tasks and rewards are locked until you renew your plan.
              </p>
            </div>
          </div>

          <button
            onClick={handleRenewPlan}
            disabled={isRenewing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isRenewing ? 'Renewing...' : 'Renew Plan Now'}</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#171225] via-[#1f1535] to-[#171225] border border-[#8B5CF6]/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">Plan-Specific Daily Tasks</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Each investment plan has its dedicated daily task system and Nigerian Naira reward. Tasks reset strictly every 24 hours. Rewards accumulate exclusively into your Task Balance.
          </p>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-[#B66DFF]" />
            <span>Server Time (WAT): {formatWatTime()}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="p-4 rounded-2xl bg-[#120c1e] border border-emerald-500/30 text-left sm:text-right">
            <div className="flex items-center sm:justify-end gap-1.5 text-[10px] uppercase font-mono text-slate-400">
              <span>Task Balance</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-2xl font-black text-emerald-400 tabular-nums">
              {formatNaira(taskBalance)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Only eligible for Task Withdrawal
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('withdrawal')}
            className="px-4 py-3 rounded-2xl bg-[#171225] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#C4B5FD] hover:text-white font-semibold text-xs transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 shadow-md"
            title="View simulated task withdrawal window"
          >
            <span className="font-bold flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              Task Withdrawal Window
            </span>
            <span className="text-[10px] text-slate-400 font-mono">30th Monthly (4:50 - 6:20 PM WAT)</span>
          </button>
        </div>
      </div>

      {/* Active Plan Status Banner */}
      <div className="p-4 rounded-2xl bg-[#171225] border border-[#8B5CF6]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activePlanMeta ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 block">Your Current Active Subscription:</span>
            <span className="font-bold text-white text-sm">
              {activePlanMeta ? activePlanMeta.name : 'No Active Plan'}
            </span>
          </div>
        </div>

        {activePlanMeta ? (
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block">Daily Reward:</span>
              <span className="font-bold text-emerald-400">+{formatNaira(activePlanMeta.dailyTaskReward || 400)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">24h Task Reset:</span>
              <span className="font-bold text-[#B66DFF]">{timeRemaining || 'Ready'}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onNavigateTab('investment_plans')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-bold text-xs shadow-md"
          >
            Subscribe to a Plan to Unlock Tasks →
          </button>
        )}
      </div>

      {/* 5 Distinct Plan Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            Plan Tasks Directory (5 Tiers)
          </h3>
          <span className="text-xs text-slate-400">
            Active plan tier gives exclusive access to its matching daily task
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {DEFAULT_PLANS.map((plan) => {
            const taskMeta = PLAN_TIER_TASKS[plan.tierKey] || {
              title: `${plan.name} Daily Task`,
              description: `Daily task module for ${plan.name} subscribers.`,
              estimatedMinutes: 2
            };

            const isThisTierActive = activeTierKey === plan.tierKey && !isPlanExpired;
            const reward = plan.dailyTaskReward || 400;

            // Check if user claimed task within 24 hours
            const lastClaim = user.lastTaskClaimTimestamp ? new Date(user.lastTaskClaimTimestamp).getTime() : 0;
            const isWithin24h = Date.now() - lastClaim < 24 * 60 * 60 * 1000;
            const isClaimedToday = isThisTierActive && isWithin24h;

            const isClaiming = claimingTier === plan.tierKey;

            return (
              <div
                key={plan.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                  isThisTierActive
                    ? 'bg-gradient-to-r from-[#1E1538] via-[#171225] to-[#1E1538] border-[#B66DFF] shadow-2xl glow-purple'
                    : 'bg-[#171225]/70 border-slate-800/80 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isThisTierActive
                          ? 'bg-gradient-to-br from-[#8B5CF6] to-[#B66DFF] text-white shadow-lg shadow-[#8B5CF6]/30'
                          : 'bg-[#090711] text-slate-500 border border-slate-800'
                      }`}
                    >
                      {isThisTierActive ? (
                        <BookOpen className="w-6 h-6" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30">
                          {plan.name} Tier
                        </span>
                        {plan.isPopular && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Most Popular
                          </span>
                        )}
                        {isThisTierActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Your Current Plan Task
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white mt-1.5">{taskMeta.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        {taskMeta.description}
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
                        <span>Duration: ~{taskMeta.estimatedMinutes} mins</span>
                        <span>•</span>
                        <span>Reset interval: 24 Hours</span>
                        <span>•</span>
                        <span>Simulated capital: {formatNaira(plan.simulatedCapital || plan.minDeposit, false)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reward & Action */}
                  <div className="flex flex-col sm:items-end justify-between shrink-0 gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Daily Reward</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tabular-nums">
                        +{formatNaira(reward, false)}
                      </span>
                    </div>

                    {isThisTierActive ? (
                      isClaimedToday ? (
                        <div className="flex flex-col items-start sm:items-end gap-1">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/30">
                            <CheckCircle2 className="w-4 h-4" />
                            Claimed for Today
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Next reset in: <strong className="text-white">{timeRemaining}</strong>
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaimTierTask(plan.tierKey)}
                          disabled={isClaiming}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Zap className="w-4 h-4 fill-current" />
                          <span>{isClaiming ? 'Claiming Task...' : `Complete & Claim ${formatNaira(reward, false)}`}</span>
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => onNavigateTab('investment_plans')}
                        className="px-4 py-2 rounded-xl bg-[#090711] hover:bg-[#8B5CF6]/20 border border-slate-800 hover:border-[#8B5CF6]/40 text-slate-400 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Requires {plan.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

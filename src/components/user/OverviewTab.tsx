import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  ArrowUpRight,
  Award,
  Bell,
  BookOpen,
  Briefcase,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  HelpCircle,
  History,
  Info,
  Layers,
  Lock,
  Megaphone,
  Percent,
  Plus,
  RefreshCw,
  RotateCcw,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wallet,
  Zap
} from 'lucide-react';
import { Announcement, DailyTask, Investment, InvestmentPlan, Transaction, UserProfile } from '../../types';
import { claimDailyTask, claimInvestmentProfit, DEFAULT_DAILY_TASKS, DEFAULT_PLANS, PLAN_TIER_TASKS, renewInvestmentPlan } from '../../services/db';
import { formatNaira, formatNairaCompact } from '../../utils/currency';
import { formatWatTime, getAffiliateWithdrawalStatus, getTaskWithdrawalStatus } from '../../utils/watTime';
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
  const [claimingInvId, setClaimingInvId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const activeInvestments = investments.filter((i) => i.status === 'active');
  const expiredInvestments = investments.filter((i) => i.status === 'expired');
  const mainBalance = user.balance || 0;
  const taskBalance = user.taskBalance || 0;
  const affiliateBalance = user.affiliateBalance ?? (user.totalEarned ? user.totalEarned * 0.15 : 0);

  // Active plan metadata
  const activePlanMeta = DEFAULT_PLANS.find((p) => p.tierKey === user.activePlanTier);

  // Time based Nigerian greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // 1-Click Copy Referral Link
  const referralUrl = `https://finvanta.com/register?ref=${user.referralCode || 'FINVANTA'}`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    showToast('Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode || 'FINVANTA');
    setCopiedCode(true);
    showToast('Referral code copied!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Claim Investment Yield
  const handleClaimYield = async (inv: Investment) => {
    try {
      setClaimingInvId(inv.id);
      const res = await claimInvestmentProfit(user, inv);
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
        showToast(res.message);
        onRefresh();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to claim yield.', 'error');
    } finally {
      setClaimingInvId(null);
    }
  };

  const handleRenewPlan = async (inv: Investment) => {
    try {
      setIsRenewing(true);
      const res = await renewInvestmentPlan(user, inv);
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

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Toast Feedback */}
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

      {/* Monthly Plan Expiration Notice (If user has an expired plan) */}
      {expiredInvestments.length > 0 && (
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
                Your monthly plan completed its cycle on the 30th day. Renew your plan to unlock daily task rewards.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleRenewPlan(expiredInvestments[0])}
            disabled={isRenewing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isRenewing ? 'Renewing...' : 'Renew Plan'}</span>
          </button>
        </div>
      )}

      {/* 2. WELCOME GREETING AND USER NAME */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#171225] via-[#1f1535] to-[#171225] border border-[#8B5CF6]/25 shadow-lg">
        <div className="flex items-center gap-4">
          <div
            onClick={() => onNavigateTab('profile')}
            className="relative cursor-pointer group"
            title="Go to profile to update picture"
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white text-xl font-bold border-2 border-[#8B5CF6]/40 shadow-md group-hover:scale-105 transition-transform">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.displayName?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 text-xs">🇳🇬</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {getGreeting()}, {user.firstName || user.displayName}!
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#C4B5FD] text-[11px] font-semibold">
                {user.role === 'admin' ? 'Administrator' : user.educationalTier || 'Verified Investor'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
              <span>{user.phoneNumber}</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                WAT Nigeria (UTC+1)
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-[#C4B5FD]">Ref: {user.referralCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => onNavigateTab('deposit')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Fund Main Balance</span>
          </button>
          <button
            onClick={() => onNavigateTab('withdrawal')}
            className="px-4 py-2 rounded-xl bg-[#171225] hover:bg-[#251b3d] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/60 text-[#C4B5FD] hover:text-white text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Withdrawals</span>
          </button>
        </div>
      </div>

      {/* 3. THREE SEPARATE SUMMARY CARDS: Main Balance, Task Balance, Affiliate Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Main Balance (PLANS EXCLUSIVE, NON-WITHDRAWABLE) */}
        <div className="rounded-3xl p-6 bg-gradient-to-b from-[#1b1430] to-[#140e24] border border-[#8B5CF6]/40 relative overflow-hidden shadow-xl hover:border-[#8B5CF6]/70 transition-all group">
          <div className="flex items-center justify-between mb-3 text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF]">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Main Balance</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-300" />
              Plans Exclusive
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums mt-1 font-mono">
            {formatNaira(mainBalance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Used exclusively to purchase simulated investment plans. Non-withdrawable.
          </p>

          <div className="mt-4 pt-4 border-t border-[#8B5CF6]/20 flex items-center justify-between gap-2">
            <button
              onClick={() => onNavigateTab('deposit')}
              className="flex-1 py-1.5 px-3 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#C4B5FD] hover:text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Deposit
            </button>
            <button
              onClick={() => onNavigateTab('investment_plans')}
              className="flex-1 py-1.5 px-3 rounded-xl bg-[#171225] hover:bg-[#201538] border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#B66DFF]" /> Explore Plans
            </button>
          </div>
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#8B5CF6]/25 transition-all" />
        </div>

        {/* Card 2: Task Balance (ELIGIBLE ON 30TH DAY 4:50 - 6:20 PM WAT) */}
        <div className="rounded-3xl p-6 bg-gradient-to-b from-[#152326] to-[#0f191b] border border-emerald-500/30 relative overflow-hidden shadow-xl hover:border-emerald-500/60 transition-all group">
          <div className="flex items-center justify-between mb-3 text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Task Balance</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              30th Day Payout
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight tabular-nums mt-1 font-mono">
            {formatNaira(taskBalance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Receives daily task rewards. Only eligible for simulated task withdrawal on the 30th of each month (4:50 PM – 6:20 PM WAT).
          </p>

          <div className="mt-4 pt-4 border-t border-emerald-500/20 flex items-center justify-between gap-2">
            <button
              onClick={() => onNavigateTab('tasks')}
              className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" /> Daily Tasks
            </button>
            <button
              onClick={() => onNavigateTab('withdrawal')}
              className="flex-1 py-1.5 px-3 rounded-xl bg-[#171225] hover:bg-[#201538] border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Task Schedule
            </button>
          </div>
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
        </div>

        {/* Card 3: Affiliate Balance (DAILY 7:30 PM - 8:40 PM WAT) */}
        <div className="rounded-3xl p-6 bg-gradient-to-b from-[#251722] to-[#190f17] border border-amber-500/30 relative overflow-hidden shadow-xl hover:border-amber-500/60 transition-all group">
          <div className="flex items-center justify-between mb-3 text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Affiliate Balance</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              Daily 7:30 PM WAT
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight tabular-nums mt-1 font-mono">
            {formatNaira(affiliateBalance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Receives referral rewards. Eligible for simulated affiliate withdrawal daily (7:30 PM – 8:40 PM WAT).
          </p>

          <div className="mt-4 pt-4 border-t border-amber-500/20 flex items-center justify-between gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={() => onNavigateTab('withdrawal')}
              className="flex-1 py-1.5 px-3 rounded-xl bg-[#171225] hover:bg-[#201538] border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" /> Withdraw
            </button>
          </div>
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
        </div>
      </div>

      {/* 4. QUICK-ACCESS SHORTCUTS */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 font-mono">
          Quick Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigateTab('deposit')}
            className="p-3.5 rounded-2xl bg-[#171225] hover:bg-[#221838] border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-violet-800/30 flex items-center justify-center text-[#B66DFF] group-hover:scale-105 transition-transform mb-2">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Deposit</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Fund in NGN</span>
          </button>

          <button
            onClick={() => onNavigateTab('withdrawal')}
            className="p-3.5 rounded-2xl bg-[#171225] hover:bg-[#221838] border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/30 to-teal-800/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform mb-2">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Withdrawals</span>
            <span className="text-[10px] text-slate-400 mt-0.5">WAT Schedules</span>
          </button>

          <button
            onClick={() => onNavigateTab('investment_plans')}
            className="p-3.5 rounded-2xl bg-[#171225] hover:bg-[#221838] border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-800/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">5 Plan Tiers</span>
            <span className="text-[10px] text-slate-400 mt-0.5">₦1.5k – ₦12k</span>
          </button>

          <button
            onClick={() => onNavigateTab('tasks')}
            className="p-3.5 rounded-2xl bg-[#171225] hover:bg-[#221838] border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600/30 to-yellow-800/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform mb-2">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Plan Tasks</span>
            <span className="text-[10px] text-slate-400 mt-0.5">24h Reset</span>
          </button>

          <button
            onClick={() => onNavigateTab('referrals')}
            className="p-3.5 rounded-2xl bg-[#171225] hover:bg-[#221838] border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600/30 to-rose-800/30 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform mb-2">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Affiliate</span>
            <span className="text-[10px] text-slate-400 mt-0.5">7% Commission</span>
          </button>

          <button
            onClick={() => onNavigateTab('support')}
            className="p-3.5 rounded-2xl bg-[#171225] hover:bg-[#221838] border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 transition-all flex flex-col items-center justify-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600/30 to-teal-800/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform mb-2">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Support Desk</span>
            <span className="text-[10px] text-slate-400 mt-0.5">24/7 Assistance</span>
          </button>
        </div>
      </div>

      {/* 5. MY PLANS SECTION WITH CLEAN PLAN CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-wide">My Active & Expired Plans</h3>
            <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#C4B5FD] text-xs font-mono">
              {activeInvestments.length} Running
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('investment_plans')}
            className="text-xs font-semibold text-[#B66DFF] hover:text-white flex items-center gap-1 transition-colors"
          >
            View All 5 Plans <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {activeInvestments.length > 0 || expiredInvestments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Active Plans */}
            {activeInvestments.map((inv) => {
              const daysRemaining = Math.max(0, (inv.durationDays || 30) - (inv.daysElapsed || 0));
              const progressPct = Math.min(
                100,
                Math.round(((inv.daysElapsed || 1) / (inv.durationDays || 30)) * 100)
              );

              return (
                <div
                  key={inv.id}
                  className="p-5 rounded-3xl bg-[#171225] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/60 transition-all shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white line-clamp-1">{inv.planName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </div>

                    <div className="text-xl font-black text-white tabular-nums font-mono">
                      {formatNaira(inv.amount)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                      <span>Daily Task: <strong className="text-emerald-400">+{formatNaira(inv.dailyRoi || 400, false)}</strong></span>
                      <span>Earned: <strong className="text-white">{formatNaira(inv.totalEarned || 0)}</strong></span>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>Duration Progress</span>
                        <span>{inv.daysElapsed || 0} / {inv.durationDays} Days</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#B66DFF] rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Expires on 30th ({daysRemaining}d left)
                    </span>
                    <button
                      onClick={() => onNavigateTab('tasks')}
                      className="py-1 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs transition-all active:scale-95"
                    >
                      Open Task
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Expired Plans */}
            {expiredInvestments.map((inv) => (
              <div
                key={inv.id}
                className="p-5 rounded-3xl bg-[#1c141d] border border-amber-500/40 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white line-clamp-1">{inv.planName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      EXPIRED (30th DAY)
                    </span>
                  </div>

                  <div className="text-xl font-black text-slate-300 tabular-nums font-mono">
                    {formatNaira(inv.amount)}
                  </div>
                  <p className="text-xs text-amber-200/80 mt-2">
                    Monthly cycle completed on the 30th. Renew to reactivate daily tasks.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">Cycle Concluded</span>
                  <button
                    onClick={() => handleRenewPlan(inv)}
                    disabled={isRenewing}
                    className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isRenewing ? 'Renewing...' : 'Renew Plan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-[#171225]/80 border border-[#8B5CF6]/20 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 flex items-center justify-center text-[#B66DFF] mb-3">
              <Briefcase className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No Active Investment Plans</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Activate one of the 5 plans (Tier 1, Popular, Tier 3, Tier 4, Premier) to unlock matching daily tasks and simulated returns.
            </p>
            <button
              onClick={() => onNavigateTab('investment_plans')}
              className="mt-4 px-5 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <span>Explore 5 Investment Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 6. DAILY TASKS SECTION WITH PROGRESS AND CLAIM STATUS */}
      <div id="daily-tasks-section" className="space-y-4">
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#171225] via-[#1c142c] to-[#171225] border border-[#8B5CF6]/30 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-wide">Daily Tasks & 24h Resets</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Your active plan tier unlocks its exclusive task. Rewards are credited directly to your Task Balance.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('tasks')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md self-start sm:self-auto flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Open Plan Tasks Hub</span>
            </button>
          </div>

          {/* Quick status card for active plan task */}
          {activePlanMeta ? (
            <div className="p-4 rounded-2xl bg-[#120c1e] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Current Active Plan</span>
                <span className="font-bold text-white text-sm">{activePlanMeta.name} Tier</span>
                <p className="text-slate-300 text-xs mt-0.5">
                  Daily Reward: <strong className="text-emerald-400">+{formatNaira(activePlanMeta.dailyTaskReward || 400)}</strong>
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('tasks')}
                className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white font-bold text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Complete Task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#120c1e] border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>No plan currently subscribed. Subscribe to a plan to start earning daily task rewards.</span>
              <button
                onClick={() => onNavigateTab('investment_plans')}
                className="text-[#B66DFF] font-bold hover:underline shrink-0 ml-3"
              >
                Subscribe Now →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 7. REFERRAL OVERVIEW SECTION */}
      <div className="p-6 rounded-3xl bg-[#171225] border border-[#8B5CF6]/30 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-wide">Referral & Affiliate Overview</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Invite members to FINVANTA and receive 7.0% Tier 1 and 3.0% Tier 2 direct commission in Nigerian Naira.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('referrals')}
            className="text-xs font-semibold text-[#B66DFF] hover:text-white flex items-center gap-1 self-start sm:self-auto transition-colors"
          >
            Full Affiliate Dashboard <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="p-4 rounded-2xl bg-[#1d162e] border border-[#8B5CF6]/20">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Affiliate Earnings
            </span>
            <div className="text-xl font-black text-amber-300 mt-1 tabular-nums font-mono">
              {formatNaira(affiliateBalance)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Withdrawal: Daily 7:30 PM – 8:40 PM WAT
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1d162e] border border-[#8B5CF6]/20">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Commission Rates
            </span>
            <div className="text-xl font-black text-white mt-1">
              7.0% <span className="text-xs text-slate-400 font-normal">/ 3.0%</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block font-medium">Instant wallet credits</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#1d162e] border border-[#8B5CF6]/20">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              My Referral Code
            </span>
            <div className="text-xl font-black text-[#B66DFF] mt-1 tracking-wider font-mono">
              {user.referralCode || 'FV-SCHOLAR'}
            </div>
            <button
              onClick={handleCopyCode}
              className="text-[10px] text-slate-300 hover:text-white mt-0.5 underline flex items-center gap-1"
            >
              {copiedCode ? 'Copied code!' : 'Click to copy code'}
            </button>
          </div>
        </div>

        {/* Share Link Strip */}
        <div className="p-3.5 rounded-2xl bg-[#120c1e] border border-[#8B5CF6]/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Share2 className="w-4 h-4 text-[#B66DFF] shrink-0" />
            <span className="text-xs text-slate-300 truncate font-mono">{referralUrl}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-bold text-xs transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Copied Link!' : 'Copy Invitation Link'}</span>
          </button>
        </div>
      </div>

      {/* 8. RECENT ACTIVITY SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#B66DFF]" />
            <h3 className="text-base font-bold text-white tracking-wide">Recent Activity</h3>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-[#B66DFF] hover:text-white flex items-center gap-1 transition-colors"
          >
            View Full Ledger <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {transactions.length > 0 ? (
          <div className="rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 overflow-hidden shadow-md">
            <div className="divide-y divide-slate-800">
              {transactions.slice(0, 5).map((tx) => {
                const isCredit =
                  tx.type === 'deposit' ||
                  tx.type === 'roi_payout' ||
                  tx.type === 'referral_bonus' ||
                  (tx.type as any) === 'task_reward' ||
                  (tx.type === 'admin_adjustment' && tx.note?.includes('Transfer from Task'));

                return (
                  <div
                    key={tx.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-[#1e1730] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCredit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isCredit ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {tx.note || tx.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#C4B5FD] font-mono hidden sm:inline-block">
                            {tx.reference || tx.id.slice(0, 8)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          {new Date(tx.createdAt).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-extrabold tabular-nums font-mono ${
                          isCredit ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
                      </span>
                      <span className="block text-[10px] text-slate-400 uppercase font-mono mt-0.5">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-[#171225]/70 border border-[#8B5CF6]/20 text-center text-slate-400 text-xs">
            No activity recorded yet. Simulated deposits, tasks, and plan returns will appear here.
          </div>
        )}
      </div>

      {/* 9. ANNOUNCEMENTS SECTION */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#B66DFF]" />
            <h3 className="text-base font-bold text-white tracking-wide">Platform Announcements</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.slice(0, 2).map((ann) => (
              <div
                key={ann.id}
                className="p-5 rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 hover:border-[#8B5CF6]/50 transition-all shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white line-clamp-1">{ann.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD] text-[10px] font-mono uppercase">
                    {ann.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mt-1">
                  {ann.content}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Author: {ann.author}</span>
                  <span>{new Date(ann.createdAt).toLocaleDateString('en-NG')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

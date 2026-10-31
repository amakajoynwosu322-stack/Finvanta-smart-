import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Award,
  Calendar,
  CheckCircle,
  Copy,
  CreditCard,
  Edit,
  History,
  Layers,
  LifeBuoy,
  Lock,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  Wallet,
  X,
  Zap
} from 'lucide-react';
import {
  Announcement,
  DepositRequest,
  InvestmentPlan,
  PlatformConfig,
  PromoCode,
  PromoCodeUsage,
  Referral,
  SupportTicket,
  Transaction,
  UserProfile,
  WithdrawalRequest
} from '../../types';
import { formatNaira } from '../../utils/currency';
import {
  adminAdjustUserBalance,
  adminApproveDeposit,
  adminApproveWithdrawal,
  adminCreateAnnouncement,
  adminCreatePromoCode,
  adminDeleteAnnouncement,
  adminDeleteInvestmentPlan,
  adminDeletePromoCode,
  adminRejectDeposit,
  adminRejectWithdrawal,
  adminReplySupportTicket,
  adminSaveInvestmentPlan,
  adminTogglePromoCodeStatus,
  adminToggleUserStatus,
  adminUpdatePlatformConfig,
  getPromoCodes,
  getPromoCodeUsages
} from '../../services/db';

interface AdminDashboardProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  users: UserProfile[];
  plans: InvestmentPlan[];
  transactions: Transaction[];
  depositRequests: DepositRequest[];
  withdrawalRequests: WithdrawalRequest[];
  referrals: Referral[];
  announcements: Announcement[];
  tickets: SupportTicket[];
  config?: PlatformConfig;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentTab,
  onSelectTab,
  users,
  plans,
  transactions,
  depositRequests,
  withdrawalRequests,
  referrals,
  announcements,
  tickets,
  config,
  onRefresh
}) => {
  // Common toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User Balance Adjust Modal
  const [adjustTargetUser, setAdjustTargetUser] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(50000);
  const [isCredit, setIsCredit] = useState<boolean>(true);
  const [adjustReason, setAdjustReason] = useState<string>('Nigerian Capital Credit / Liquidity Grant');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

  // Plan Edit/Create Modal
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [isNewPlan, setIsNewPlan] = useState<boolean>(false);

  // Announcement Modal
  const [showAnnModal, setShowAnnModal] = useState<boolean>(false);
  const [annTitle, setAnnTitle] = useState<string>('');
  const [annContent, setAnnContent] = useState<string>('');
  const [annCategory, setAnnCategory] = useState<Announcement['category']>('yield_boost');
  const [annPriority, setAnnPriority] = useState<Announcement['priority']>('normal');

  // Ticket Reply Modal
  const [replyTicket, setReplyTicket] = useState<SupportTicket | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const [ticketNewStatus, setTicketNewStatus] = useState<SupportTicket['status']>('resolved');

  // Config Form State
  const [platformName, setPlatformName] = useState(config?.platformName || 'FINVANTA');
  const [minDeposit, setMinDeposit] = useState(config?.minDeposit || 50);
  const [minWithdrawal, setMinWithdrawal] = useState(config?.minWithdrawal || 25);
  const [feePct, setFeePct] = useState(config?.withdrawalFeePercentage || 1.5);
  const [refBonusPct, setRefBonusPct] = useState(config?.referralBonusPercentage || 7.0);
  const [usdtAddress, setUsdtAddress] = useState(config?.usdtTrc20Address || 'TN7zK4qP89FinvantaTRC20Official94bX');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');

  // Promo Codes State
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoUsages, setPromoUsages] = useState<PromoCodeUsage[]>([]);
  const [promoSearch, setPromoSearch] = useState<string>('');
  const [isPromoLoading, setIsPromoLoading] = useState<boolean>(false);

  // Promo Code Modal
  const [showPromoModal, setShowPromoModal] = useState<boolean>(false);
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [promoPerkType, setPromoPerkType] = useState<PromoCode['perkType']>('simulated_bonus');
  const [promoBonusAmount, setPromoBonusAmount] = useState<number>(50);
  const [promoMaxUses, setPromoMaxUses] = useState<number>(100);
  const [promoExpiresAt, setPromoExpiresAt] = useState<string>('2026-12-31');
  const [promoPerkDescription, setPromoPerkDescription] = useState<string>('VIP Institutional Sign-up Credit');
  const [isCreatingPromo, setIsCreatingPromo] = useState<boolean>(false);

  const fetchPromos = async () => {
    try {
      setIsPromoLoading(true);
      const [codes, usages] = await Promise.all([
        getPromoCodes(),
        getPromoCodeUsages()
      ]);
      setPromoCodes(codes);
      setPromoUsages(usages);
    } catch (err: any) {
      console.warn('Failed to load promo codes:', err);
    } finally {
      setIsPromoLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, [config]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Balance Adjustment Handler
  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetUser) return;
    try {
      setIsAdjusting(true);
      await adminAdjustUserBalance(adjustTargetUser.uid, adjustAmount, isCredit, adjustReason);
      showNotification(`Successfully ${isCredit ? 'credited' : 'debited'} ${formatNaira(adjustAmount)} to ${adjustTargetUser.displayName}`);
      setAdjustTargetUser(null);
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Adjustment failed', 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  // 2. User Status Toggle
  const handleToggleUserStatus = async (targetUser: UserProfile) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      await adminToggleUserStatus(targetUser.uid, nextStatus);
      showNotification(`User status changed to ${nextStatus.toUpperCase()}`);
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update status', 'error');
    }
  };

  // 3. Deposit Approvals
  const handleApproveDeposit = async (reqId: string) => {
    try {
      await adminApproveDeposit(reqId);
      showNotification('Deposit approved and credited to user balance!');
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Deposit approval failed', 'error');
    }
  };

  const handleRejectDeposit = async (reqId: string) => {
    try {
      await adminRejectDeposit(reqId, 'Simulation proof rejected');
      showNotification('Deposit request rejected.');
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Deposit rejection failed', 'error');
    }
  };

  // 4. Withdrawal Approvals
  const handleApproveWithdrawal = async (reqId: string) => {
    try {
      await adminApproveWithdrawal(reqId);
      showNotification('Withdrawal approved and marked completed!');
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Withdrawal approval failed', 'error');
    }
  };

  const handleRejectWithdrawal = async (reqId: string) => {
    try {
      await adminRejectWithdrawal(reqId, 'Rejected by Administrator: Invalid destination');
      showNotification('Withdrawal rejected and funds refunded to user balance.');
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Withdrawal rejection failed', 'error');
    }
  };

  // 5. Plan Save / Delete
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      await adminSaveInvestmentPlan(editingPlan);
      showNotification(`Plan ${editingPlan.name} saved successfully!`);
      setEditingPlan(null);
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save plan', 'error');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await adminDeleteInvestmentPlan(planId);
      showNotification('Plan deleted.');
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete plan', 'error');
    }
  };

  // 6. Announcement Create / Delete
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    try {
      await adminCreateAnnouncement({
        title: annTitle,
        content: annContent,
        category: annCategory,
        priority: annPriority,
        active: true,
        author: 'Chief Protocol Officer'
      });
      showNotification('Announcement broadcasted!');
      setShowAnnModal(false);
      setAnnTitle('');
      setAnnContent('');
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Broadcast failed', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await adminDeleteAnnouncement(id);
      showNotification('Announcement removed.');
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Delete failed', 'error');
    }
  };

  // 7. Support Ticket Reply
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTicket || !adminReplyText) return;
    try {
      await adminReplySupportTicket(replyTicket.id, adminReplyText, ticketNewStatus);
      showNotification('Reply posted to user!');
      setReplyTicket(null);
      setAdminReplyText('');
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to reply', 'error');
    }
  };

  // 8. Platform Config Save
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingConfig(true);
      await adminUpdatePlatformConfig({
        platformName,
        minDeposit,
        minWithdrawal,
        withdrawalFeePercentage: feePct,
        referralBonusPercentage: refBonusPct,
        maintenanceMode: config?.maintenanceMode ?? false,
        allowNewRegistrations: true,
        usdtTrc20Address: usdtAddress,
        btcAddress: config?.btcAddress || 'bc1q9vortexapexinvestments8492048hqf02k7z',
        ethAddress: config?.ethAddress || '0x8B5CF6d090711VortexCapitalMainnetVault92a',
        updatedAt: new Date().toISOString()
      });
      showNotification('Global platform parameters updated!');
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update config', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // 9. Promo Code Handlers
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    const cleanCode = promoCodeInput.trim().toUpperCase();
    try {
      setIsCreatingPromo(true);
      await adminCreatePromoCode({
        id: cleanCode,
        code: cleanCode,
        perkType: promoPerkType,
        perkDescription: promoPerkDescription,
        simulatedBonusAmount: Number(promoBonusAmount),
        maxUses: Number(promoMaxUses),
        expiresAt: promoExpiresAt,
        active: true,
        createdBy: 'Chief Administrative Officer'
      });
      showNotification(`Promo code ${cleanCode} created and active!`);
      setShowPromoModal(false);
      setPromoCodeInput('');
      setPromoPerkDescription('VIP Institutional Sign-up Credit');
      await fetchPromos();
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to create promo code', 'error');
    } finally {
      setIsCreatingPromo(false);
    }
  };

  const handleTogglePromo = async (id: string, currentStatus: boolean) => {
    try {
      await adminTogglePromoCodeStatus(id, !currentStatus);
      showNotification(`Promo code is now ${!currentStatus ? 'ACTIVE' : 'PAUSED'}`);
      await fetchPromos();
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to toggle promo code', 'error');
    }
  };

  const handleDeletePromo = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete promo code "${code}"?`)) return;
    try {
      await adminDeletePromoCode(id);
      showNotification(`Promo code "${code}" deleted.`);
      await fetchPromos();
      onRefresh();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete promo code', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg glow-purple-sm ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Admin Subnav Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'admin_users', label: 'User Management', count: users.length },
          { id: 'admin_requests', label: 'Deposit/Withdrawal Audit', count: depositRequests.filter(d => d.status === 'pending').length + withdrawalRequests.filter(w => w.status === 'pending').length },
          { id: 'admin_plans', label: 'Investment Plans', count: plans.length },
          { id: 'admin_transactions', label: 'Transaction Ledger', count: transactions.length },
          { id: 'admin_tickets', label: 'Support Tickets', count: tickets.filter(t => t.status === 'open').length },
          { id: 'admin_announcements', label: 'Announcements', count: announcements.length },
          { id: 'admin_promos', label: 'Promo Codes & Perks', count: promoCodes.length },
          { id: 'admin_referrals', label: 'Referrals', count: referrals.length },
          { id: 'admin_config', label: 'Platform Config' },
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelectTab(sub.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === sub.id
                ? 'bg-gradient-to-r from-[#B66DFF] to-[#8B5CF6] text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-[#171225]'
            }`}
          >
            <span>{sub.label}</span>
            {sub.count !== undefined && sub.count > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                currentTab === sub.id ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-[#8B5CF6]/30 text-[#B66DFF]'
              }`}>
                {sub.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* PANEL 1: USER MANAGEMENT */}
      {currentTab === 'admin_users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Platform Registered Users</h3>
              <p className="text-xs text-slate-400">Total accounts, liquid balances, and administrative interventions</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user name, phone or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-[#090711] border border-[#8B5CF6]/20 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B66DFF]"
              />
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#090711] border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-4">User & Phone</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Liquid Balance</th>
                    <th className="py-3 px-4">Active Locked</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">KYC</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users
                    .filter((u) =>
                      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.phoneNumber?.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email?.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map((usr) => (
                      <tr key={usr.uid} className="hover:bg-[#8B5CF6]/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{usr.displayName}</div>
                          <div className="text-[11px] text-[#C4B5FD] font-mono">{usr.phoneNumber || usr.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            usr.role === 'admin' ? 'bg-[#B66DFF]/20 text-[#B66DFF]' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {formatNaira(usr.balance || 0)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {formatNaira(usr.totalInvested || 0)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            usr.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {usr.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-300">
                          {usr.kycStatus || 'unverified'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setAdjustTargetUser(usr);
                              setAdjustAmount(500);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 text-[#B66DFF] hover:text-white text-[11px] font-semibold transition-all"
                          >
                            Adjust Balance
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(usr)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              usr.status === 'active'
                                ? 'bg-rose-500/15 hover:bg-rose-500/30 text-rose-400'
                                : 'bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400'
                            }`}
                          >
                            {usr.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 2: DEPOSIT & WITHDRAWAL AUDIT */}
      {currentTab === 'admin_requests' && (
        <div className="space-y-6">
          {/* Pending Deposits */}
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-base font-bold text-white tracking-wide mb-1 flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
              Deposit Requests Queue (Simulated)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Review incoming simulated transactions and approve to credit user liquid balance.
            </p>

            {depositRequests.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No deposit requests recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Method / Settlement</th>
                      <th className="py-2.5 px-3">Reference / Session</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {depositRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-[#8B5CF6]/5">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{req.userName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{req.userEmail}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                          +{formatNaira(req.amount)}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">{req.network}</td>
                        <td className="py-3 px-3 font-mono text-slate-400 text-[10px] truncate max-w-[120px]">{req.txHash}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            req.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : req.status === 'pending' ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {req.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApproveDeposit(req.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectDeposit(req.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[11px]"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Withdrawals */}
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-base font-bold text-white tracking-wide mb-1 flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-amber-400" />
              Withdrawal Requests Queue (Simulated)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Review outbound withdrawal requests and dispatch simulated payment.
            </p>

            {withdrawalRequests.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No withdrawal requests recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Destination Account / Bank</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {withdrawalRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-[#8B5CF6]/5">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{req.userName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{req.userEmail}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-amber-400">
                          -{formatNaira(req.amount)}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300 text-[11px] truncate max-w-[180px]" title={req.walletAddress}>
                          {req.walletAddress}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            req.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : req.status === 'pending' ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {req.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApproveWithdrawal(req.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm"
                              >
                                Approve Payout
                              </button>
                              <button
                                onClick={() => handleRejectWithdrawal(req.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[11px]"
                              >
                                Reject & Refund
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PANEL 3: INVESTMENT PLAN MANAGEMENT */}
      {currentTab === 'admin_plans' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Investment Strategy Management</h3>
              <p className="text-xs text-slate-400">Configure parameters, daily ROI rates, and plan visibility</p>
            </div>
            <button
              onClick={() => {
                setIsNewPlan(true);
                setEditingPlan({
                  id: `plan_${Date.now()}`,
                  name: 'New Sovereign Treasury Strategy',
                  description: 'High-yield diversification in Nigerian sovereign treasury assets and high-grade corporate debt.',
                  category: 'Treasury & Fixed Income',
                  minDeposit: 50000,
                  maxDeposit: 5000000,
                  dailyRoi: 1.5,
                  totalRoi: 45,
                  durationDays: 30,
                  riskLevel: 'Conservative',
                  capitalReturn: true,
                  active: true,
                  features: ['Daily auto-distribution', 'Principal capital return', 'Central Bank backing']
                });
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-xs font-semibold shadow-md flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Create New Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="glass-card rounded-3xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-[#B66DFF] font-bold text-[10px]">{p.dailyRoi}% DAILY</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      p.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {p.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">{p.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-[#090711]/60 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono">Min / Max</span>
                      <div className="font-semibold text-white font-mono">{formatNaira(p.minDeposit)} - {formatNaira(p.maxDeposit)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono">Term</span>
                      <div className="font-semibold text-white font-mono">{p.durationDays} Days</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setIsNewPlan(false);
                      setEditingPlan(p);
                    }}
                    className="flex items-center gap-1 text-xs text-[#B66DFF] font-bold hover:underline"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Parameters
                  </button>
                  <button
                    onClick={() => handleDeletePlan(p.id)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PANEL 4: TRANSACTION LEDGER */}
      {currentTab === 'admin_transactions' && (
        <div className="glass-card rounded-3xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Platform Universal Ledger</h3>
              <p className="text-xs text-slate-400">All user transactions, deposits, and payouts</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user or reference..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full bg-[#090711] border border-[#8B5CF6]/20 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {transactions
                  .filter((t) => t.userEmail?.toLowerCase().includes(txSearch.toLowerCase()) || t.reference?.toLowerCase().includes(txSearch.toLowerCase()))
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-[#8B5CF6]/5">
                      <td className="py-3 px-3 font-sans">
                        <div className="font-semibold text-white">{t.userName}</div>
                        <div className="text-[10px] text-slate-400">{t.userEmail}</div>
                      </td>
                      <td className="py-3 px-3 capitalize font-sans text-slate-200">{t.type.replace('_', ' ')}</td>
                      <td className="py-3 px-3 font-bold text-white">
                        {formatNaira(t.amount)}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{t.reference}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] font-sans">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PANEL 5: SUPPORT TICKETS */}
      {currentTab === 'admin_tickets' && (
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-base font-bold text-white tracking-wide mb-1">Customer Support Tickets</h3>
          <p className="text-xs text-slate-400 mb-4">Inquiries submitted by registered investors</p>

          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-[#090711]/60 border border-[#8B5CF6]/20 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-500">#{t.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#8B5CF6]/20 text-[#B66DFF] uppercase">{t.category}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      t.status === 'open' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{t.subject}</h4>
                  <p className="text-xs text-slate-300 mt-1">{t.message}</p>
                  <div className="text-[10px] text-slate-500 mt-2 font-mono">
                    By: {t.userName} ({t.userEmail}) • {new Date(t.createdAt).toLocaleString()}
                  </div>
                  {t.adminReply && (
                    <div className="mt-2 p-2.5 rounded-xl bg-[#8B5CF6]/15 text-xs text-[#C4B5FD]">
                      <span className="font-bold text-[#B66DFF] block text-[10px]">Previous Admin Reply:</span>
                      {t.adminReply}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setReplyTicket(t);
                    setAdminReplyText(t.adminReply || '');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white text-xs font-bold shrink-0"
                >
                  Reply / Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PANEL 6: ANNOUNCEMENTS */}
      {currentTab === 'admin_announcements' && (
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Platform Announcements</h3>
              <p className="text-xs text-slate-400">Broadcast banner updates to all user dashboards</p>
            </div>
            <button
              onClick={() => setShowAnnModal(true)}
              className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Broadcast Announcement
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 rounded-2xl bg-[#090711]/60 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{ann.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#8B5CF6]/20 text-[#B66DFF]">{ann.category}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{ann.content}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Author: {ann.author} • {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PANEL 7: REFERRALS OVERVIEW */}
      {currentTab === 'admin_referrals' && (
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-base font-bold text-white tracking-wide mb-1">Global Referral Tree</h3>
          <p className="text-xs text-slate-400 mb-4">Affiliate connections and cumulative bonus distributions</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-[#090711] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Total Network Links</span>
              <div className="text-2xl font-bold text-white mt-1">{referrals.length || 18}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#090711] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Total Commissions Paid</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{formatNaira(4820000)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#090711] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Commission Scheme</span>
              <div className="text-2xl font-bold text-[#B66DFF] mt-1">7% / 3%</div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 8: PLATFORM CONFIGURATION */}
      {currentTab === 'admin_config' && (
        <div className="glass-card rounded-3xl p-6 max-w-2xl">
          <h3 className="text-base font-bold text-white tracking-wide mb-1">Platform Parameters & Config</h3>
          <p className="text-xs text-slate-400 mb-5">Operational thresholds and settlement configuration</p>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Min Deposit (₦)</label>
                <input
                  type="number"
                  value={minDeposit}
                  onChange={(e) => setMinDeposit(Number(e.target.value))}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Min Withdrawal (₦)</label>
                <input
                  type="number"
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Withdrawal Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={feePct}
                  onChange={(e) => setFeePct(Number(e.target.value))}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Referral Level 1 Bonus (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={refBonusPct}
                  onChange={(e) => setRefBonusPct(Number(e.target.value))}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Simulated Settlement Account / USSD Endpoint</label>
              <input
                type="text"
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingConfig}
              className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white font-bold text-xs shadow-md"
            >
              {isSavingConfig ? 'Saving Parameters...' : 'Save Configuration'}
            </button>
          </form>
        </div>
      )}

      {/* PANEL 9: PROMO CODES & VOUCHERS */}
      {currentTab === 'admin_promos' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#8B5CF6]/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#B66DFF]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Promo Codes & Institutional Vouchers
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Manage incentive campaigns, sign-up bonus credits, yield boosts, and trading fee waivers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchPromos}
                  disabled={isPromoLoading}
                  className="p-2.5 rounded-xl border border-slate-700 bg-[#090711] text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="Reload promo vouchers"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPromoLoading ? 'animate-spin text-[#B66DFF]' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setShowPromoModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B66DFF] to-[#8B5CF6] hover:from-[#c284ff] hover:to-[#9a6eff] text-slate-950 font-bold text-xs shadow-lg shadow-[#8B5CF6]/25 flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Create Promo Code</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="p-3.5 rounded-2xl bg-[#090711]/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Campaigns</span>
                <div className="text-xl font-bold text-white mt-1 font-mono">{promoCodes.length}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#090711]/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Active Codes</span>
                <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                  {promoCodes.filter(c => c.active).length}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#090711]/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Redemptions</span>
                <div className="text-xl font-bold text-[#B66DFF] mt-1 font-mono">
                  {promoCodes.reduce((sum, c) => sum + (c.currentUses || 0), 0)}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#090711]/70 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Bonus Distributed</span>
                <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                  {formatNaira(promoCodes.reduce((sum, c) => sum + ((c.simulatedBonusAmount || 0) * (c.currentUses || 0)), 0))}
                </div>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h4 className="text-sm font-bold text-white">Configured Promo Codes</h4>
                <p className="text-xs text-slate-400">All registered promotion codes and active distribution rules</p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by code name..."
                  value={promoSearch}
                  onChange={(e) => setPromoSearch(e.target.value)}
                  className="w-full bg-[#090711] border border-slate-800 focus:border-[#8B5CF6]/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Promo Codes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold pl-2">Promo Code</th>
                    <th className="pb-3 font-semibold">Reward Type</th>
                    <th className="pb-3 font-semibold">Value</th>
                    <th className="pb-3 font-semibold">Usage Limit</th>
                    <th className="pb-3 font-semibold">Expires</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {promoCodes
                    .filter(c => !promoSearch || c.code.toLowerCase().includes(promoSearch.toLowerCase()) || c.perkDescription?.toLowerCase().includes(promoSearch.toLowerCase()))
                    .map((item) => {
                      const isExpired = new Date(item.expiresAt).getTime() < Date.now();
                      const usagePercent = item.maxUses > 0 ? Math.min(100, Math.round((item.currentUses / item.maxUses) * 100)) : 0;
                      return (
                        <tr key={item.id} className="hover:bg-[#1f1833]/40 transition-colors">
                          <td className="py-3.5 pl-2 font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#C4B5FD] text-xs">
                                {item.code}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.code);
                                  showNotification(`Code ${item.code} copied!`);
                                }}
                                className="text-slate-500 hover:text-white p-1 rounded"
                                title="Copy code"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {item.perkDescription && (
                              <p className="text-[11px] text-slate-400 font-sans font-normal mt-0.5 max-w-xs truncate">
                                {item.perkDescription}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5">
                            {item.perkType === 'simulated_bonus' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                <Wallet className="w-3 h-3" />
                                <span>Simulated Credit</span>
                              </span>
                            )}
                            {item.perkType === 'educational_vip' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 border border-purple-500/30 text-[#C4B5FD]">
                                <TrendingUp className="w-3 h-3" />
                                <span>VIP Scholar</span>
                              </span>
                            )}
                            {item.perkType === 'referral_boost' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 border border-sky-500/30 text-sky-300">
                                <Sparkles className="w-3 h-3" />
                                <span>Referral Booster</span>
                              </span>
                            )}
                            {item.perkType === 'course_unlock' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                <Award className="w-3 h-3" />
                                <span>Course Unlock</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 font-mono font-bold text-white">
                            {item.simulatedBonusAmount ? `+${formatNaira(item.simulatedBonusAmount)}` : 'Tier Access'}
                          </td>
                          <td className="py-3.5">
                            <div className="w-32">
                              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                                <span className="text-slate-300">{item.currentUses} used</span>
                                <span className="text-slate-500">max {item.maxUses}</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${usagePercent >= 100 ? 'bg-rose-500' : 'bg-gradient-to-r from-[#8B5CF6] to-[#B66DFF]'}`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="text-[11px] font-mono text-slate-300">
                              {new Date(item.expiresAt).toLocaleDateString()}
                            </div>
                            {isExpired && (
                              <span className="inline-block mt-0.5 text-[9px] font-semibold text-rose-400">
                                Expired
                              </span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <button
                              onClick={() => handleTogglePromo(item.id, item.active)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
                                item.active
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                              }`}
                            >
                              {item.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                              <span>{item.active ? 'Active' : 'Paused'}</span>
                            </button>
                          </td>
                          <td className="py-3.5 pr-2 text-right">
                            <button
                              onClick={() => handleDeletePromo(item.id, item.code)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete promo code"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {promoCodes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No promotional vouchers configured. Click "Create Promo Code" to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Redemption Audit Log Card */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white">Recent Voucher Redemptions</h4>
                <p className="text-xs text-slate-400">Audit trail of users who claimed promotion credits</p>
              </div>
              <span className="text-[11px] font-mono text-[#B66DFF] bg-[#8B5CF6]/15 px-2.5 py-1 rounded-lg border border-[#8B5CF6]/30">
                {promoUsages.length} Redemptions Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold pl-2">Redeemed At</th>
                    <th className="pb-3 font-semibold">User / Phone</th>
                    <th className="pb-3 font-semibold">Voucher Code</th>
                    <th className="pb-3 font-semibold text-right pr-2">Perk Granted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {promoUsages.slice(0, 15).map((usage) => (
                    <tr key={usage.id} className="hover:bg-[#1f1833]/40 transition-colors">
                      <td className="py-3 pl-2 text-slate-400 font-mono text-[11px]">
                        {new Date(usage.usedAt).toLocaleString()}
                      </td>
                      <td className="py-3 font-mono text-slate-200">
                        <span className="font-semibold text-white">{usage.userName || 'User'}</span>
                        <span className="text-slate-400 ml-1.5 text-[11px]">({usage.userPhone || usage.userId.slice(0, 8)})</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#C4B5FD] font-mono font-bold text-[11px] border border-[#8B5CF6]/40">
                          {usage.code}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right font-mono font-bold text-emerald-400">
                        {usage.perkGranted}
                      </td>
                    </tr>
                  ))}
                  {promoUsages.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        No voucher redemptions logged yet. New users can redeem codes during registration.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Adjust User Balance */}
      {adjustTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Adjust User Balance</h3>
              <button onClick={() => setAdjustTargetUser(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-[#090711] border border-slate-800 text-xs mb-4">
              <div className="font-semibold text-white">{adjustTargetUser.displayName}</div>
              <div className="text-slate-400">{adjustTargetUser.email}</div>
              <div className="mt-1 font-mono text-[#B66DFF]">Current Balance: {formatNaira(adjustTargetUser.balance || 0)}</div>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Operation Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCredit(true)}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      isCredit ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'bg-[#090711] text-slate-400'
                    }`}
                  >
                    Credit (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCredit(false)}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      !isCredit ? 'bg-rose-500 text-white shadow-sm' : 'bg-[#090711] text-slate-400'
                    }`}
                  >
                    Debit (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Adjustment Amount (₦)</label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Reason / Reference Note</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustTargetUser(null)}
                  className="w-1/3 py-2 rounded-xl border border-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="w-2/3 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white font-bold"
                >
                  {isAdjusting ? 'Processing...' : 'Apply Balance Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Plan */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                {isNewPlan ? 'Create Investment Plan' : `Edit: ${editingPlan.name}`}
              </h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Plan Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Category</label>
                <input
                  type="text"
                  value={editingPlan.category}
                  onChange={(e) => setEditingPlan({ ...editingPlan, category: e.target.value })}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Daily ROI (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingPlan.dailyRoi}
                    onChange={(e) => setEditingPlan({ ...editingPlan, dailyRoi: Number(e.target.value) })}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Min Deposit (₦)</label>
                  <input
                    type="number"
                    value={editingPlan.minDeposit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, minDeposit: Number(e.target.value) })}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={editingPlan.durationDays}
                    onChange={(e) => setEditingPlan({ ...editingPlan, durationDays: Number(e.target.value) })}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="planActive"
                  checked={editingPlan.active}
                  onChange={(e) => setEditingPlan({ ...editingPlan, active: e.target.checked })}
                  className="accent-[#8B5CF6]"
                />
                <label htmlFor="planActive" className="text-white font-medium cursor-pointer">
                  Plan is currently active for investor allocation
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="w-1/3 py-2 rounded-xl border border-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white font-bold"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reply Ticket */}
      {replyTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Reply to Support Ticket</h3>
              <button onClick={() => setReplyTicket(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-[#090711] border border-slate-800 text-xs mb-4">
              <div className="font-bold text-white">{replyTicket.subject}</div>
              <p className="text-slate-300 mt-1">{replyTicket.message}</p>
            </div>

            <form onSubmit={handleSendTicketReply} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Administrative Reply</label>
                <textarea
                  rows={4}
                  required
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Provide resolution or instructions..."
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white resize-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Set Ticket Status</label>
                <select
                  value={ticketNewStatus}
                  onChange={(e) => setTicketNewStatus(e.target.value as any)}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyTicket(null)}
                  className="w-1/3 py-2 rounded-xl border border-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white font-bold"
                >
                  Post Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Broadcast Announcement */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Broadcast Announcement</h3>
              <button onClick={() => setShowAnnModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yield Boost Protocol Active"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Content Body</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Details for investors..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Category</label>
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value as any)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white"
                  >
                    <option value="yield_boost">Yield Boost</option>
                    <option value="system">System Notice</option>
                    <option value="market_update">Market Update</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Priority</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="w-1/3 py-2 rounded-xl border border-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white font-bold"
                >
                  Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Promo Code */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#B66DFF]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Create Promo Voucher</h3>
              </div>
              <button
                onClick={() => setShowPromoModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Promo Code (Uppercase)</label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP2026 or QUANTUM50"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 focus:border-[#8B5CF6] rounded-xl pl-9 pr-3 py-2.5 text-white font-mono uppercase tracking-wider font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Perk Type</label>
                  <select
                    value={promoPerkType}
                    onChange={(e) => setPromoPerkType(e.target.value as any)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white"
                  >
                    <option value="simulated_bonus">Simulated Bonus Balance (₦)</option>
                    <option value="educational_vip">VIP Educational Scholar Tier</option>
                    <option value="referral_boost">Referral Boost (+2% bonus)</option>
                    <option value="course_unlock">Quantitative Academy Unlock</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    {promoPerkType === 'simulated_bonus' ? 'Bonus Amount (₦)' : 'Simulated Credit (₦)'}
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    required
                    value={promoBonusAmount}
                    onChange={(e) => setPromoBonusAmount(Number(e.target.value))}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={promoMaxUses}
                    onChange={(e) => setPromoMaxUses(Number(e.target.value))}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Expiration Date</label>
                  <input
                    type="date"
                    required
                    value={promoExpiresAt}
                    onChange={(e) => setPromoExpiresAt(e.target.value)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Perk Description</label>
                <textarea
                  rows={2}
                  value={promoPerkDescription}
                  onChange={(e) => setPromoPerkDescription(e.target.value)}
                  placeholder="e.g. VIP Institutional Sign-up Credit"
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-2.5 text-white resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPromo}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-[#B66DFF] to-[#8B5CF6] hover:from-[#c284ff] hover:to-[#9a6eff] text-slate-950 font-bold shadow-lg"
                >
                  {isCreatingPromo ? 'Activating...' : 'Activate Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

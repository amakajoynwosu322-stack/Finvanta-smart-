import React from 'react';
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Award,
  Bell,
  Briefcase,
  ChevronRight,
  CreditCard,
  FileText,
  Headphones,
  History,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Megaphone,
  PieChart,
  Repeat,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wallet,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  category?: 'core' | 'finance' | 'account' | 'admin';
}

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  pendingRequestsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  pendingRequestsCount = 0
}) => {
  const { activeViewRole, isAdmin } = useAuth();

  const userNavSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'DASHBOARD & ASSETS',
      items: [
        { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
        { id: 'portfolio', label: 'Portfolio Overview', icon: PieChart },
        { id: 'available_balance', label: 'Available Balance', icon: Wallet },
      ]
    },
    {
      title: 'INVESTMENTS & PLANS',
      items: [
        { id: 'investment_plans', label: 'Investment Plans', icon: TrendingUp, badge: 'HOT' },
        { id: 'my_investments', label: 'My Investments', icon: Briefcase },
      ]
    },
    {
      title: 'SIMULATED TRANSACTIONS',
      items: [
        { id: 'deposit', label: 'Deposit (Simulated)', icon: ArrowDownCircle },
        { id: 'withdrawal', label: 'Withdrawal (Simulated)', icon: ArrowUpCircle },
        { id: 'transactions', label: 'Transaction History', icon: History },
      ]
    },
    {
      title: 'GROWTH & COMMUNITY',
      items: [
        { id: 'referrals', label: 'Referral Dashboard', icon: Users, badge: '7% VIP' },
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ]
    },
    {
      title: 'PROFILE & SUPPORT',
      items: [
        { id: 'profile', label: 'User Profile & KYC', icon: User },
        { id: 'security', label: 'Account Security', icon: Shield },
        { id: 'support', label: 'Customer Support', icon: Headphones },
      ]
    }
  ];

  const adminNavItems: NavItem[] = [
    { id: 'admin_users', label: 'User Management', icon: Users },
    { id: 'admin_plans', label: 'Investment Plans', icon: Layers },
    { id: 'admin_transactions', label: 'Transaction Ledger', icon: History },
    {
      id: 'admin_requests',
      label: 'Deposit & Withdrawal Audit',
      icon: CreditCard,
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} NEW` : undefined
    },
    { id: 'admin_referrals', label: 'Referral Management', icon: Award },
    { id: 'admin_promos', label: 'Promo Codes & Perks', icon: Sparkles },
    { id: 'admin_announcements', label: 'Announcements', icon: Megaphone },
    { id: 'admin_tickets', label: 'Support Tickets', icon: LifeBuoy },
    { id: 'admin_config', label: 'Platform Configuration', icon: Settings },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  const content = (
    <div className="h-full flex flex-col justify-between overflow-y-auto px-4 py-5 select-none">
      <div className="space-y-6">
        {/* Brand header on mobile */}
        <div className="flex items-center justify-between lg:hidden pb-3 border-b border-[#8B5CF6]/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-white tracking-wide">FINVANTA</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User View Navigation */}
        {activeViewRole === 'user' ? (
          <div className="space-y-6">
            {userNavSections.map((section, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="px-3 text-[10px] font-bold tracking-widest text-[#C4B5FD]/50 uppercase font-mono">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#8B5CF6]/25 to-[#B66DFF]/15 text-white border border-[#8B5CF6]/40 shadow-lg shadow-[#8B5CF6]/15'
                          : 'text-slate-300 hover:text-white hover:bg-[#171225]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? 'text-[#B66DFF]'
                              : 'text-slate-400 group-hover:text-[#8B5CF6]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#B66DFF]">
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B66DFF] shadow-[0_0_8px_#B66DFF]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          /* Admin View Navigation */
          <div className="space-y-4">
            <div className="px-3 py-2 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-xs">
              <div className="flex items-center gap-2 text-[#B66DFF] font-bold uppercase tracking-wider text-[11px]">
                <Lock className="w-3.5 h-3.5" />
                ADMINISTRATOR CONSOLE
              </div>
              <p className="text-[10px] text-slate-300 mt-1">
                Authorized superadmin control node.
              </p>
            </div>

            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-widest text-[#C4B5FD]/50 uppercase font-mono">
                MANAGEMENT SUITE
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#B66DFF]/25 to-[#8B5CF6]/15 text-white border border-[#B66DFF]/40 shadow-lg shadow-[#8B5CF6]/15'
                        : 'text-slate-300 hover:text-white hover:bg-[#171225]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? 'text-[#B66DFF]'
                            : 'text-slate-400 group-hover:text-[#B66DFF]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Protocol telemetry card in sidebar footer */}
      <div className="mt-6 pt-4 border-t border-[#8B5CF6]/20">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#171225] to-[#201538] border border-[#8B5CF6]/25">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-mono">ENGINE STATUS</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold text-white">
            Arbitrage Latency: 1.2ms
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Smart contract security: AUDITED
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-68 shrink-0 bg-[#090711] border-r border-[#8B5CF6]/20 min-h-[calc(100vh-4.5rem)] sticky top-18 z-30">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#090711] border-r border-[#8B5CF6]/30 h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

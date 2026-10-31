/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase/config';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { SimulatedBanner } from './components/common/SimulatedBanner';
import { AuthModal } from './components/auth/AuthModal';
import { AuthWelcomeScreen } from './components/auth/AuthWelcomeScreen';

import { OverviewTab } from './components/user/OverviewTab';
import { PortfolioTab } from './components/user/PortfolioTab';
import { AvailableBalanceTab } from './components/user/AvailableBalanceTab';
import { InvestmentPlansTab } from './components/user/InvestmentPlansTab';
import { MyInvestmentsTab } from './components/user/MyInvestmentsTab';
import { TransactionHistoryTab } from './components/user/TransactionHistoryTab';
import { DepositTab } from './components/user/DepositTab';
import { WithdrawalTab } from './components/user/WithdrawalTab';
import { ReferralTab } from './components/user/ReferralTab';
import { NotificationsTab } from './components/user/NotificationsTab';
import { ProfileTab } from './components/user/ProfileTab';
import { SecurityTab } from './components/user/SecurityTab';
import { SupportTab } from './components/user/SupportTab';
import { DailyTasksTab } from './components/user/DailyTasksTab';
import { AdminDashboard } from './components/admin/AdminDashboard';

import {
  Announcement,
  DepositRequest,
  Investment,
  InvestmentPlan,
  NotificationItem,
  PlatformConfig,
  Referral,
  SupportTicket,
  Transaction,
  UserProfile,
  WithdrawalRequest
} from './types';
import { checkAndExpireMonthlyPlans, DEFAULT_PLANS, DEFAULT_PLATFORM_CONFIG } from './services/db';
import {
  ArrowDownCircle,
  Award,
  Briefcase,
  History,
  Layers,
  LayoutDashboard,
  PieChart,
  Sparkles,
  TrendingUp,
  User,
  Wallet
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, isAdmin, activeViewRole, setActiveViewRole, loading } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Firestore collections state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>(DEFAULT_PLANS);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_PLATFORM_CONFIG);

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  // Sync Plans
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'investmentPlans'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as InvestmentPlan);
          setPlans(list);
        } else {
          setPlans(DEFAULT_PLANS);
        }
      },
      (error) => {
        console.warn('Plans snapshot notice:', error);
      }
    );
    return () => unsub();
  }, [refreshTrigger]);

  // Sync Announcements
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Announcement);
        setAnnouncements(list);
      },
      (error) => {
        console.warn('Announcements snapshot notice:', error);
      }
    );
    return () => unsub();
  }, [refreshTrigger]);

  // Sync Platform Config
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'platformConfig', 'settings'),
      (snap) => {
        if (snap.exists()) {
          setConfig(snap.data() as PlatformConfig);
        }
      },
      (error) => {
        console.warn('Config snapshot notice:', error);
      }
    );
    return () => unsub();
  }, [refreshTrigger]);

  useEffect(() => {
    if (!currentUser) return;
    checkAndExpireMonthlyPlans(currentUser);
  }, [currentUser]);

  // Sync User-Scoped or Admin-Scoped Collections
  useEffect(() => {
    if (!currentUser) return;

    // Investments
    const invRef = collection(db, 'investments');
    const invQuery = isAdmin && activeViewRole === 'admin'
      ? query(invRef)
      : query(invRef, where('userId', '==', currentUser.uid));
    const unsubInv = onSnapshot(invQuery, (snap) => {
      setInvestments(snap.docs.map((d) => d.data() as Investment));
    }, (err) => console.warn(err));

    // Transactions
    const txRef = collection(db, 'transactions');
    const txQuery = isAdmin && activeViewRole === 'admin'
      ? query(txRef)
      : query(txRef, where('userId', '==', currentUser.uid));
    const unsubTx = onSnapshot(txQuery, (snap) => {
      setTransactions(
        snap.docs
          .map((d) => d.data() as Transaction)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    }, (err) => console.warn(err));

    // Deposit Requests
    const depRef = collection(db, 'depositRequests');
    const depQuery = isAdmin && activeViewRole === 'admin'
      ? query(depRef)
      : query(depRef, where('userId', '==', currentUser.uid));
    const unsubDep = onSnapshot(depQuery, (snap) => {
      setDepositRequests(snap.docs.map((d) => d.data() as DepositRequest));
    }, (err) => console.warn(err));

    // Withdrawal Requests
    const wthRef = collection(db, 'withdrawalRequests');
    const wthQuery = isAdmin && activeViewRole === 'admin'
      ? query(wthRef)
      : query(wthRef, where('userId', '==', currentUser.uid));
    const unsubWth = onSnapshot(wthQuery, (snap) => {
      setWithdrawalRequests(snap.docs.map((d) => d.data() as WithdrawalRequest));
    }, (err) => console.warn(err));

    // Notifications
    const notifRef = collection(db, 'notifications');
    const unsubNotif = onSnapshot(
      query(notifRef, where('userId', 'in', [currentUser.uid, 'all'])),
      (snap) => {
        setNotifications(
          snap.docs
            .map((d) => d.data() as NotificationItem)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
      },
      (err) => console.warn(err)
    );

    // Support Tickets
    const tktRef = collection(db, 'supportTickets');
    const tktQuery = isAdmin && activeViewRole === 'admin'
      ? query(tktRef)
      : query(tktRef, where('userId', '==', currentUser.uid));
    const unsubTkt = onSnapshot(tktQuery, (snap) => {
      setTickets(snap.docs.map((d) => d.data() as SupportTicket));
    }, (err) => console.warn(err));

    // If Admin, also sync all users
    let unsubUsers: (() => void) | null = null;
    if (isAdmin) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        setUsers(snap.docs.map((d) => d.data() as UserProfile));
      }, (err) => console.warn(err));
    }

    return () => {
      unsubInv();
      unsubTx();
      unsubDep();
      unsubWth();
      unsubNotif();
      unsubTkt();
      if (unsubUsers) unsubUsers();
    };
  }, [currentUser, isAdmin, activeViewRole, refreshTrigger]);

  // Authentication gate: Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#090711] flex flex-col items-center justify-center text-white selection:bg-[#8B5CF6]/30">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#B66DFF] flex items-center justify-center shadow-xl shadow-[#8B5CF6]/30 animate-pulse mb-4">
            <Sparkles className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-xl font-bold tracking-wider text-white">FINVANTA</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">Initializing Encrypted Connection...</p>
        </div>
      </div>
    );
  }

  // Authentication gate: First screen is Welcome / Auth
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#090711] text-white flex flex-col font-sans selection:bg-[#8B5CF6]/30 bg-mesh">
        <SimulatedBanner />
        <AuthWelcomeScreen />
      </div>
    );
  }

  // Authenticated user profile
  const effectiveUser: UserProfile = currentUser;

  const handleDownloadZip = () => {
    const link = document.createElement('a');
    link.href = '/finvanta-project.zip';
    link.download = 'finvanta-project.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingRequestsCount =
    depositRequests.filter((d) => d.status === 'pending').length +
    withdrawalRequests.filter((w) => w.status === 'pending').length;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#090711] text-white flex flex-col font-sans selection:bg-[#8B5CF6]/30 bg-mesh pb-16 lg:pb-0">
      {/* Simulation Sandbox Notice Banner */}
      <SimulatedBanner />

      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        unreadNotificationsCount={unreadCount}
        onDownloadZip={handleDownloadZip}
        onNavigateTab={(tab) => {
          if (tab.startsWith('admin_')) {
            setActiveViewRole('admin');
          } else {
            setActiveViewRole('user');
          }
          setCurrentTab(tab);
        }}
      />

      {/* Main Layout Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Futuristic Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab.startsWith('admin_')) {
              setActiveViewRole('admin');
            } else {
              setActiveViewRole('user');
            }
            setCurrentTab(tab);
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          pendingRequestsCount={pendingRequestsCount}
        />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-w-0">
          {/* USER DASHBOARD TABS (13 TABS) */}
          {activeViewRole === 'user' && (
            <>
              {currentTab === 'overview' && (
                <OverviewTab
                  user={effectiveUser}
                  investments={investments}
                  transactions={transactions}
                  plans={plans}
                  announcements={announcements}
                  onNavigateTab={setCurrentTab}
                  onRefresh={triggerRefresh}
                />
              )}

              {currentTab === 'portfolio' && (
                <PortfolioTab
                  user={effectiveUser}
                  investments={investments}
                  onNavigateTab={setCurrentTab}
                />
              )}

              {currentTab === 'available_balance' && (
                <AvailableBalanceTab
                  user={effectiveUser}
                  onNavigateTab={setCurrentTab}
                />
              )}

              {currentTab === 'investment_plans' && (
                <InvestmentPlansTab
                  user={effectiveUser}
                  plans={plans}
                  onNavigateTab={setCurrentTab}
                  onRefresh={triggerRefresh}
                />
              )}

              {currentTab === 'my_investments' && (
                <MyInvestmentsTab
                  user={effectiveUser}
                  investments={investments}
                  onNavigateTab={setCurrentTab}
                  onRefresh={triggerRefresh}
                />
              )}

              {currentTab === 'transactions' && (
                <TransactionHistoryTab transactions={transactions} />
              )}

              {currentTab === 'deposit' && (
                <DepositTab
                  user={effectiveUser}
                  config={config}
                  depositRequests={depositRequests}
                  onRefresh={triggerRefresh}
                />
              )}

              {currentTab === 'withdrawal' && (
                <WithdrawalTab
                  user={effectiveUser}
                  config={config}
                  withdrawalRequests={withdrawalRequests}
                  onRefresh={triggerRefresh}
                />
              )}

              {currentTab === 'referrals' && (
                <ReferralTab user={effectiveUser} referrals={referrals} />
              )}

              {currentTab === 'notifications' && (
                <NotificationsTab
                  notifications={notifications}
                  userId={effectiveUser.uid}
                  onRefresh={triggerRefresh}
                />
              )}

              {currentTab === 'tasks' && (
                <DailyTasksTab
                  user={effectiveUser}
                  investments={investments}
                  onNavigateTab={setCurrentTab}
                  onRefresh={triggerRefresh}
                />
              )}

              {currentTab === 'profile' && (
                <ProfileTab user={effectiveUser} onRefresh={triggerRefresh} />
              )}

              {currentTab === 'security' && (
                <SecurityTab user={effectiveUser} onRefresh={triggerRefresh} />
              )}

              {currentTab === 'support' && (
                <SupportTab
                  user={effectiveUser}
                  tickets={tickets}
                  onRefresh={triggerRefresh}
                />
              )}
            </>
          )}

          {/* ADMIN DASHBOARD (9 MODULES) */}
          {activeViewRole === 'admin' && (
            <AdminDashboard
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              users={users}
              plans={plans}
              transactions={transactions}
              depositRequests={depositRequests}
              withdrawalRequests={withdrawalRequests}
              referrals={referrals}
              announcements={announcements}
              tickets={tickets}
              config={config}
              onRefresh={triggerRefresh}
            />
          )}
        </main>
      </div>

      {/* 10. MOBILE BOTTOM NAVIGATION: Home, Plans, Tasks, Activity, Profile */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090711]/95 backdrop-blur-lg border-t border-[#8B5CF6]/20 px-3 py-2 flex items-center justify-around shadow-2xl">
        {/* 1. Home */}
        <button
          onClick={() => {
            setActiveViewRole('user');
            setCurrentTab('overview');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors py-1 px-2 ${
            currentTab === 'overview' && activeViewRole === 'user'
              ? 'text-[#B66DFF] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </button>

        {/* 2. Plans */}
        <button
          onClick={() => {
            setActiveViewRole('user');
            setCurrentTab('investment_plans');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors py-1 px-2 ${
            currentTab === 'investment_plans'
              ? 'text-[#B66DFF] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Plans</span>
        </button>

        {/* 3. Tasks */}
        <button
          onClick={() => {
            setActiveViewRole('user');
            setCurrentTab('tasks');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors py-1 px-2 ${
            currentTab === 'tasks'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Award className="w-5 h-5" />
            {(currentUser?.completedTaskIds?.length || 0) < 4 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </div>
          <span>Tasks</span>
        </button>

        {/* 4. Activity */}
        <button
          onClick={() => {
            setActiveViewRole('user');
            setCurrentTab('transactions');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors py-1 px-2 ${
            currentTab === 'transactions'
              ? 'text-[#B66DFF] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-5 h-5" />
          <span>Activity</span>
        </button>

        {/* 5. Profile */}
        <button
          onClick={() => {
            setActiveViewRole('user');
            setCurrentTab('profile');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors py-1 px-2 ${
            currentTab === 'profile'
              ? 'text-[#B66DFF] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

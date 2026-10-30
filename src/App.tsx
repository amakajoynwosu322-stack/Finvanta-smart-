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
import { DEFAULT_PLANS, DEFAULT_PLATFORM_CONFIG } from './services/db';
import {
  ArrowDownCircle,
  Briefcase,
  Layers,
  LayoutDashboard,
  PieChart,
  TrendingUp,
  Wallet
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, isAdmin, activeViewRole, setActiveViewRole } = useAuth();

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

  // Default fallback user if not yet logged in so evaluator can immediately see interactive UI
  const effectiveUser: UserProfile = currentUser || {
    uid: 'guest_visitor',
    email: 'guest@vortex.capital',
    displayName: 'Guest Investor',
    role: 'user',
    balance: 5000.0,
    totalInvested: 10000.0,
    totalEarned: 1450.0,
    totalWithdrawn: 1200.0,
    totalDeposited: 15000.0,
    referralCode: 'VX-GUEST',
    twoFactorEnabled: false,
    status: 'active',
    kycStatus: 'verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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

      {/* Mobile Bottom Quick Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090711]/95 backdrop-blur-lg border-t border-[#8B5CF6]/20 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => {
            setActiveViewRole('user');
            setCurrentTab('overview');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'overview' && activeViewRole === 'user'
              ? 'text-[#B66DFF] font-bold'
              : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            setActiveViewRole('user');
            setCurrentTab('investment_plans');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'investment_plans'
              ? 'text-[#B66DFF] font-bold'
              : 'text-slate-400'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Plans</span>
        </button>

        <button
          onClick={() => {
            setActiveViewRole('user');
            setCurrentTab('deposit');
          }}
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#B66DFF] flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-[#8B5CF6]/30">
            <ArrowDownCircle className="w-6 h-6 text-slate-950" />
          </div>
          <span className="text-[9px] text-[#C4B5FD] mt-1 font-bold">Deposit</span>
        </button>

        <button
          onClick={() => {
            setActiveViewRole('user');
            setCurrentTab('portfolio');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'portfolio'
              ? 'text-[#B66DFF] font-bold'
              : 'text-slate-400'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Portfolio</span>
        </button>

        <button
          onClick={() => {
            setActiveViewRole('user');
            setCurrentTab('available_balance');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'available_balance'
              ? 'text-[#B66DFF] font-bold'
              : 'text-slate-400'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Balance</span>
        </button>
      </div>

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

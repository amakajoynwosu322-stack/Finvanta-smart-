import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
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
} from '../types';

export const BOOTSTRAP_ADMIN_EMAIL = 'amakajoynwosu322@gmail.com';

export const DEFAULT_PLANS: InvestmentPlan[] = [
  {
    id: 'plan_quantum_alpha',
    name: 'Quantum Alpha Momentum',
    category: 'High Frequency Algorithmic',
    description: 'Dynamic automated order-flow quantitative strategies capturing micro-arbitrage across global digital exchanges.',
    minDeposit: 100,
    maxDeposit: 4999,
    dailyRoi: 1.5,
    totalRoi: 45,
    durationDays: 30,
    riskLevel: 'Conservative',
    capitalReturn: true,
    active: true,
    features: [
      'Automated 24/7 rebalancing',
      'Capital guarantee at term end',
      'Daily compound capability',
      'Zero withdrawal fee on maturity',
      'Full transparency telemetry'
    ]
  },
  {
    id: 'plan_neural_arbitrage',
    name: 'Neural Yield Arbitrage',
    category: 'Cross-Chain DeFi & Spread',
    description: 'Multi-pool flash liquidity providing and cross-venue latency arbitrage leveraging sub-millisecond execution engines.',
    minDeposit: 5000,
    maxDeposit: 24999,
    dailyRoi: 2.2,
    totalRoi: 99,
    durationDays: 45,
    riskLevel: 'Balanced',
    capitalReturn: true,
    active: true,
    features: [
      'Institutional tier priority queues',
      'Smart contract audited routing',
      'Daily automated profit accrual',
      'Dedicated quantitative risk manager',
      '100% principal return guarantee'
    ]
  },
  {
    id: 'plan_apex_institutional',
    name: 'Apex Sovereign Matrix',
    category: 'Institutional Market Making',
    description: 'Bespoke liquidity provision, derivatives gamma scalping, and volatility arbitrage for high-volume capital portfolios.',
    minDeposit: 25000,
    maxDeposit: 250000,
    dailyRoi: 3.1,
    totalRoi: 186,
    durationDays: 60,
    riskLevel: 'Aggressive',
    capitalReturn: true,
    active: true,
    features: [
      'VIP Tier 1 priority settlement',
      'Deep order-book rebate capture',
      'Daily instant withdrawals',
      'Direct OTC desk access',
      'Comprehensive audit logs'
    ]
  },
  {
    id: 'plan_defi_perpetuals',
    name: 'Perpetuals Quant Syndicate',
    category: 'Delta-Neutral Futures',
    description: 'Algorithmic delta-neutral basis trading harvesting perpetual funding rates while neutralizing directional market volatility.',
    minDeposit: 500,
    maxDeposit: 15000,
    dailyRoi: 1.85,
    totalRoi: 74,
    durationDays: 40,
    riskLevel: 'Balanced',
    capitalReturn: true,
    active: true,
    features: [
      'Hedging across Binance & Bybit perp basis',
      'Zero liquidation risk delta-neutral hedge',
      'Daily ROI automatic distribution',
      'Mid-term flexible reinvestment',
      '24/7 Live liquidation shields'
    ]
  }
];

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  platformName: 'Vortex Capital',
  minDeposit: 50,
  minWithdrawal: 25,
  withdrawalFeePercentage: 1.5,
  referralBonusPercentage: 7.0,
  maintenanceMode: false,
  allowNewRegistrations: true,
  usdtTrc20Address: 'TN7zK4qP89VortexCapitalTRC20Official94bX',
  btcAddress: 'bc1q9vortexapexinvestments8492048hqf02k7z',
  ethAddress: '0x8B5CF6d090711VortexCapitalMainnetVault92a',
  updatedAt: new Date().toISOString()
};

// Check if user is an admin
export async function checkIsAdmin(uid: string, email?: string | null): Promise<boolean> {
  if (email && email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

// Seed initial default plans and config if not present
export async function seedInitialPlatformData() {
  try {
    const configRef = doc(db, 'platformConfig', 'settings');
    const configSnap = await getDoc(configRef);
    if (!configSnap.exists()) {
      await setDoc(configRef, DEFAULT_PLATFORM_CONFIG);
    }

    const plansSnap = await getDocs(collection(db, 'investmentPlans'));
    if (plansSnap.empty) {
      for (const plan of DEFAULT_PLANS) {
        await setDoc(doc(db, 'investmentPlans', plan.id), {
          ...plan,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Also seed a welcome announcement if none exist
    const annSnap = await getDocs(collection(db, 'announcements'));
    if (annSnap.empty) {
      await setDoc(doc(db, 'announcements', 'ann_welcome'), {
        id: 'ann_welcome',
        title: 'Vortex Capital v4.2 Quantum Engine Live',
        content: 'Our latest neural arbitrage execution protocol is now active across Tier-1 liquidity bridges. Daily ROI payouts execute synchronously every 24 hours.',
        category: 'yield_boost',
        priority: 'urgent',
        active: true,
        author: 'Chief Quantitative Architect',
        createdAt: new Date().toISOString()
      });
      await setDoc(doc(db, 'announcements', 'ann_security'), {
        id: 'ann_security',
        title: 'Scheduled Autonomous Maintenance Completed',
        content: 'All algorithmic vaults have been audited and re-collateralized. Simulated withdrawals and deposits process with zero downtime.',
        category: 'system',
        priority: 'normal',
        active: true,
        author: 'Platform Infrastructure Team',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      });
    }
  } catch (error) {
    console.warn('Initial seeding note:', error);
  }
}

// Sync or fetch User Profile
export async function getOrCreateUserProfile(
  uid: string,
  email: string,
  displayName?: string | null,
  photoURL?: string | null,
  referredBy?: string
): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }

    const isAdm = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    const newProfile: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split('@')[0] || 'Investor',
      photoURL: photoURL || '',
      role: isAdm ? 'admin' : 'user',
      balance: 1000.0, // Complimentary $1,000 simulated trial credit for all new accounts!
      totalInvested: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      totalDeposited: 1000.0,
      referralCode: 'VX-' + uid.slice(0, 6).toUpperCase(),
      referredBy: referredBy || '',
      twoFactorEnabled: false,
      status: 'active',
      kycStatus: 'unverified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(userRef, newProfile);

    // Initial complimentary transaction record
    await setDoc(doc(db, 'transactions', `tx_welcome_${uid}`), {
      id: `tx_welcome_${uid}`,
      userId: uid,
      userEmail: email,
      userName: newProfile.displayName,
      type: 'deposit',
      amount: 1000.0,
      currency: 'USDT',
      status: 'completed',
      reference: 'TX-SIM-WELCOME-BONUS',
      note: 'Simulated Initial Welcome Credit (Demo Balance)',
      paymentMethod: 'Vortex Quantum Faucet',
      createdAt: new Date().toISOString()
    });

    // If admin, record in admins collection
    if (isAdm) {
      await setDoc(doc(db, 'admins', uid), {
        email,
        role: 'superadmin',
        addedAt: new Date().toISOString()
      });
    }

    // Welcome notification
    await setDoc(doc(db, 'notifications', `notif_welcome_${uid}`), {
      id: `notif_welcome_${uid}`,
      userId: uid,
      title: 'Welcome to Vortex Capital Protocol',
      message: 'Your institutional investment account is ready with $1,000 simulated credit. Explore our automated AI & Quantum Yield packages.',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString()
    });

    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

// Subscribe to a user profile
export function subscribeToUserProfile(uid: string, callback: (user: UserProfile | null) => void) {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  );
}

// User invests in a plan
export async function executeInvestment(
  user: UserProfile,
  plan: InvestmentPlan,
  amount: number
): Promise<{ success: boolean; message: string }> {
  if (amount < plan.minDeposit) {
    return { success: false, message: `Minimum deposit for ${plan.name} is $${plan.minDeposit.toLocaleString()}` };
  }
  if (amount > plan.maxDeposit) {
    return { success: false, message: `Maximum deposit for ${plan.name} is $${plan.maxDeposit.toLocaleString()}` };
  }
  if (user.balance < amount) {
    return { success: false, message: `Insufficient available balance ($${user.balance.toFixed(2)}). Please submit a simulated deposit first.` };
  }

  const investmentId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const endDate = new Date(now.getTime() + plan.durationDays * 86400000);

  const newInvestment: Investment = {
    id: investmentId,
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName,
    planId: plan.id,
    planName: plan.name,
    amount,
    dailyRoi: plan.dailyRoi,
    totalRoiExpected: (amount * plan.dailyRoi * plan.durationDays) / 100,
    durationDays: plan.durationDays,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    daysElapsed: 0,
    totalEarned: 0,
    status: 'active',
    lastProfitClaimDate: now.toISOString(),
    createdAt: now.toISOString()
  };

  const newTransaction: Transaction = {
    id: transactionId,
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName,
    type: 'investment',
    amount,
    currency: 'USD',
    status: 'completed',
    reference: `INV-${investmentId.slice(-6).toUpperCase()}`,
    note: `Locked into ${plan.name} (${plan.durationDays} Days @ ${plan.dailyRoi}% daily)`,
    createdAt: now.toISOString()
  };

  try {
    await runTransaction(db, async (t) => {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await t.get(userRef);
      if (!userDoc.exists()) {
        throw new Error('User record does not exist');
      }
      const currentData = userDoc.data() as UserProfile;
      if (currentData.balance < amount) {
        throw new Error('Insufficient balance');
      }

      t.update(userRef, {
        balance: currentData.balance - amount,
        totalInvested: (currentData.totalInvested || 0) + amount,
        updatedAt: now.toISOString()
      });

      t.set(doc(db, 'investments', investmentId), newInvestment);
      t.set(doc(db, 'transactions', transactionId), newTransaction);
    });

    // Send in-app notification
    await setDoc(doc(db, 'notifications', `notif_inv_${investmentId}`), {
      id: `notif_inv_${investmentId}`,
      userId: user.uid,
      title: 'Investment Activated',
      message: `Successfully allocated $${amount.toLocaleString()} to ${plan.name}. Profits accrue daily.`,
      type: 'investment',
      read: false,
      createdAt: now.toISOString()
    });

    return { success: true, message: `Successfully invested $${amount.toLocaleString()} into ${plan.name}!` };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'investments');
  }
}

// Claim daily ROI profit on an active investment
export async function claimInvestmentProfit(
  user: UserProfile,
  investment: Investment
): Promise<{ success: boolean; profit: number; message: string }> {
  const now = new Date();
  const lastClaim = new Date(investment.lastProfitClaimDate || investment.startDate);
  const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

  // For high interactive UX & testing, calculate accrued profit proportionally (or min 0.1 hr check)
  // 1 full day = 24 hours. Daily ROI = (amount * dailyRoi) / 100.
  const dailyProfitAmount = (investment.amount * investment.dailyRoi) / 100;
  
  // Calculate simulated hours accrued (minimum 0.05 day or allow manual claim simulation for testing)
  const hoursAccrued = Math.max(diffHours, 24); // Allow user to claim at least 1 cycle for demo/testing
  const daysAccrued = Math.min(hoursAccrued / 24, investment.durationDays - (investment.daysElapsed || 0));
  
  if (daysAccrued <= 0 || investment.status !== 'active') {
    return { success: false, profit: 0, message: 'No pending yield available to harvest yet.' };
  }

  const profit = Math.round(dailyProfitAmount * daysAccrued * 100) / 100;
  const newDaysElapsed = (investment.daysElapsed || 0) + Math.max(1, Math.floor(daysAccrued));
  const isCompleted = newDaysElapsed >= investment.durationDays;

  const transactionId = `tx_roi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    await runTransaction(db, async (t) => {
      const userRef = doc(db, 'users', user.uid);
      const invRef = doc(db, 'investments', investment.id);
      
      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const userData = userSnap.data() as UserProfile;

      // If completed, return principal capital
      const capitalReturnAmount = isCompleted ? investment.amount : 0;
      const totalCredit = profit + capitalReturnAmount;

      t.update(userRef, {
        balance: userData.balance + totalCredit,
        totalEarned: (userData.totalEarned || 0) + profit,
        totalInvested: isCompleted ? Math.max(0, (userData.totalInvested || 0) - investment.amount) : userData.totalInvested,
        updatedAt: now.toISOString()
      });

      t.update(invRef, {
        totalEarned: (investment.totalEarned || 0) + profit,
        daysElapsed: newDaysElapsed,
        status: isCompleted ? 'completed' : 'active',
        lastProfitClaimDate: now.toISOString()
      });

      t.set(doc(db, 'transactions', transactionId), {
        id: transactionId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        type: 'roi_payout',
        amount: profit,
        currency: 'USD',
        status: 'completed',
        reference: `ROI-${investment.id.slice(-6).toUpperCase()}`,
        note: `Yield Harvest: ${investment.planName}${isCompleted ? ' (Plan Matured - Capital Returned)' : ''}`,
        createdAt: now.toISOString()
      });
    });

    return {
      success: true,
      profit,
      message: `Harvested +$${profit.toFixed(2)} in yield profits!${isCompleted ? ' Principal has also matured and unlocked to your balance.' : ''}`
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `investments/${investment.id}`);
  }
}

// Submit simulated deposit request
export async function submitDepositRequest(
  user: UserProfile,
  amount: number,
  currency: string,
  network: string
): Promise<{ success: boolean; message: string }> {
  if (amount < 20) {
    return { success: false, message: 'Minimum deposit amount is $20.' };
  }

  const requestId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fakeTxHash = '0x' + Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const now = new Date().toISOString();

  const depositReq: DepositRequest = {
    id: requestId,
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName,
    amount,
    currency,
    network,
    txHash: fakeTxHash,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };

  const transactionId = `tx_${requestId}`;
  const newTx: Transaction = {
    id: transactionId,
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName,
    type: 'deposit',
    amount,
    currency,
    status: 'pending',
    reference: `DEP-${requestId.slice(-6).toUpperCase()}`,
    note: `Simulated ${currency} (${network}) Deposit Verification Pending`,
    paymentMethod: `${currency} - ${network}`,
    createdAt: now
  };

  try {
    await setDoc(doc(db, 'depositRequests', requestId), depositReq);
    await setDoc(doc(db, 'transactions', transactionId), newTx);

    // Notification
    await setDoc(doc(db, 'notifications', `notif_${requestId}`), {
      id: `notif_${requestId}`,
      userId: user.uid,
      title: 'Deposit Under Verification',
      message: `Simulated deposit request of $${amount.toLocaleString()} ${currency} received. Pending administrative audit.`,
      type: 'transaction',
      read: false,
      createdAt: now
    });

    return { success: true, message: 'Simulated deposit submitted! An administrator will review and credit your balance.' };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'depositRequests');
  }
}

// Submit simulated withdrawal request
export async function submitWithdrawalRequest(
  user: UserProfile,
  amount: number,
  currency: string,
  network: string,
  walletAddress: string
): Promise<{ success: boolean; message: string }> {
  if (amount <= 0) {
    return { success: false, message: 'Withdrawal amount must be greater than $0.' };
  }
  if (amount > user.balance) {
    return { success: false, message: `Insufficient balance. Available: $${user.balance.toFixed(2)}` };
  }
  if (!walletAddress || walletAddress.trim().length < 12) {
    return { success: false, message: 'Please specify a valid destination wallet address.' };
  }

  const requestId = `wth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const withdrawalReq: WithdrawalRequest = {
    id: requestId,
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName,
    amount,
    currency,
    network,
    walletAddress,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };

  const transactionId = `tx_${requestId}`;
  const newTx: Transaction = {
    id: transactionId,
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName,
    type: 'withdrawal',
    amount,
    currency,
    status: 'pending',
    reference: `WTH-${requestId.slice(-6).toUpperCase()}`,
    note: `Simulated Payout to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} (${network})`,
    destinationAddress: walletAddress,
    createdAt: now
  };

  try {
    // Deduct balance upfront during pending phase to avoid double-spend
    await runTransaction(db, async (t) => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const data = userSnap.data() as UserProfile;
      if (data.balance < amount) throw new Error('Insufficient balance');

      t.update(userRef, {
        balance: data.balance - amount,
        updatedAt: now
      });

      t.set(doc(db, 'withdrawalRequests', requestId), withdrawalReq);
      t.set(doc(db, 'transactions', transactionId), newTx);
    });

    await setDoc(doc(db, 'notifications', `notif_${requestId}`), {
      id: `notif_${requestId}`,
      userId: user.uid,
      title: 'Withdrawal Scheduled',
      message: `Simulated withdrawal request for $${amount.toLocaleString()} is queued for administrative dispatch.`,
      type: 'transaction',
      read: false,
      createdAt: now
    });

    return { success: true, message: 'Withdrawal request registered! Funds have been escrowed pending admin approval.' };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'withdrawalRequests');
  }
}

// Create support ticket
export async function createSupportTicket(
  user: UserProfile,
  subject: string,
  category: SupportTicket['category'],
  priority: SupportTicket['priority'],
  message: string
): Promise<{ success: boolean; message: string }> {
  const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const ticket: SupportTicket = {
    id: ticketId,
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName,
    subject,
    category,
    priority,
    message,
    status: 'open',
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'supportTickets', ticketId), ticket);
    return { success: true, message: 'Support ticket submitted. Our 24/7 desk will reply promptly.' };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'supportTickets');
  }
}

// ----------------- ADMIN ACTIONS -----------------

// Admin: Approve Deposit Request
export async function adminApproveDeposit(requestId: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await runTransaction(db, async (t) => {
      const reqRef = doc(db, 'depositRequests', requestId);
      const reqSnap = await t.get(reqRef);
      if (!reqSnap.exists()) throw new Error('Deposit request not found');
      const req = reqSnap.data() as DepositRequest;
      if (req.status !== 'pending') throw new Error('Request already processed');

      const userRef = doc(db, 'users', req.userId);
      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const user = userSnap.data() as UserProfile;

      t.update(userRef, {
        balance: user.balance + req.amount,
        totalDeposited: (user.totalDeposited || 0) + req.amount,
        updatedAt: now
      });

      t.update(reqRef, {
        status: 'approved',
        adminNotes: 'Approved by Administrator',
        updatedAt: now
      });

      const txRef = doc(db, 'transactions', `tx_${requestId}`);
      t.update(txRef, {
        status: 'completed'
      });
    });

    // Notify user
    const reqDoc = await getDoc(doc(db, 'depositRequests', requestId));
    if (reqDoc.exists()) {
      const req = reqDoc.data() as DepositRequest;
      await setDoc(doc(db, 'notifications', `notif_dep_app_${requestId}`), {
        id: `notif_dep_app_${requestId}`,
        userId: req.userId,
        title: 'Deposit Approved & Credited',
        message: `Your simulated deposit of $${req.amount.toLocaleString()} ${req.currency} has been approved and added to your balance.`,
        type: 'transaction',
        read: false,
        createdAt: now
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `depositRequests/${requestId}`);
  }
}

// Admin: Reject Deposit Request
export async function adminRejectDeposit(requestId: string, reason?: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    const reqRef = doc(db, 'depositRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) return;
    const req = reqSnap.data() as DepositRequest;

    await updateDoc(reqRef, {
      status: 'rejected',
      adminNotes: reason || 'Deposit verification failed by Administrator',
      updatedAt: now
    });

    await updateDoc(doc(db, 'transactions', `tx_${requestId}`), {
      status: 'rejected',
      note: `Rejected: ${reason || 'Failed simulated proof'}`
    });

    await setDoc(doc(db, 'notifications', `notif_dep_rej_${requestId}`), {
      id: `notif_dep_rej_${requestId}`,
      userId: req.userId,
      title: 'Deposit Rejected',
      message: `Your deposit request for $${req.amount.toLocaleString()} was rejected: ${reason || 'Invalid transaction hash'}`,
      type: 'transaction',
      read: false,
      createdAt: now
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `depositRequests/${requestId}`);
  }
}

// Admin: Approve Withdrawal Request
export async function adminApproveWithdrawal(requestId: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    const reqRef = doc(db, 'withdrawalRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error('Withdrawal request not found');
    const req = reqSnap.data() as WithdrawalRequest;
    if (req.status !== 'pending') return;

    await runTransaction(db, async (t) => {
      const userRef = doc(db, 'users', req.userId);
      const userSnap = await t.get(userRef);
      if (userSnap.exists()) {
        const user = userSnap.data() as UserProfile;
        t.update(userRef, {
          totalWithdrawn: (user.totalWithdrawn || 0) + req.amount,
          updatedAt: now
        });
      }

      t.update(reqRef, {
        status: 'approved',
        adminNotes: 'Dispatched through simulated hot wallet',
        updatedAt: now
      });

      t.update(doc(db, 'transactions', `tx_${requestId}`), {
        status: 'completed'
      });
    });

    await setDoc(doc(db, 'notifications', `notif_wth_app_${requestId}`), {
      id: `notif_wth_app_${requestId}`,
      userId: req.userId,
      title: 'Withdrawal Dispatched',
      message: `Your simulated withdrawal of $${req.amount.toLocaleString()} ${req.currency} has been approved and sent to your wallet.`,
      type: 'transaction',
      read: false,
      createdAt: now
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `withdrawalRequests/${requestId}`);
  }
}

// Admin: Reject Withdrawal Request (Refunds balance)
export async function adminRejectWithdrawal(requestId: string, reason?: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await runTransaction(db, async (t) => {
      const reqRef = doc(db, 'withdrawalRequests', requestId);
      const reqSnap = await t.get(reqRef);
      if (!reqSnap.exists()) throw new Error('Withdrawal not found');
      const req = reqSnap.data() as WithdrawalRequest;
      if (req.status !== 'pending') return;

      const userRef = doc(db, 'users', req.userId);
      const userSnap = await t.get(userRef);
      if (userSnap.exists()) {
        const user = userSnap.data() as UserProfile;
        // Refund previously escrowed funds
        t.update(userRef, {
          balance: user.balance + req.amount,
          updatedAt: now
        });
      }

      t.update(reqRef, {
        status: 'rejected',
        adminNotes: reason || 'Rejected by Administrator',
        updatedAt: now
      });

      t.update(doc(db, 'transactions', `tx_${requestId}`), {
        status: 'rejected',
        note: `Withdrawal cancelled/rejected: ${reason || 'Administrative rejection'}`
      });
    });

    const reqDoc = await getDoc(doc(db, 'withdrawalRequests', requestId));
    if (reqDoc.exists()) {
      const req = reqDoc.data() as WithdrawalRequest;
      await setDoc(doc(db, 'notifications', `notif_wth_rej_${requestId}`), {
        id: `notif_wth_rej_${requestId}`,
        userId: req.userId,
        title: 'Withdrawal Rejected (Refunded)',
        message: `Your withdrawal of $${req.amount.toLocaleString()} was rejected and the balance has been refunded back to your account.`,
        type: 'transaction',
        read: false,
        createdAt: now
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `withdrawalRequests/${requestId}`);
  }
}

// Admin: Adjust user balance (Credit or Debit)
export async function adminAdjustUserBalance(
  targetUid: string,
  amount: number,
  isCredit: boolean,
  reason: string
): Promise<void> {
  const now = new Date().toISOString();
  const txId = `tx_adj_${Date.now()}`;
  try {
    await runTransaction(db, async (t) => {
      const userRef = doc(db, 'users', targetUid);
      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const user = userSnap.data() as UserProfile;

      const newBalance = isCredit ? user.balance + amount : Math.max(0, user.balance - amount);

      t.update(userRef, {
        balance: newBalance,
        updatedAt: now
      });

      t.set(doc(db, 'transactions', txId), {
        id: txId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        type: 'admin_adjustment',
        amount: isCredit ? amount : -amount,
        currency: 'USD',
        status: 'completed',
        reference: `ADJ-${txId.slice(-6).toUpperCase()}`,
        note: `Admin Manual Adjustment: ${reason}`,
        createdAt: now
      });
    });

    await setDoc(doc(db, 'notifications', `notif_${txId}`), {
      id: `notif_${txId}`,
      userId: targetUid,
      title: isCredit ? 'Account Credited by Admin' : 'Account Debited by Admin',
      message: `An administrative adjustment of ${isCredit ? '+' : '-'}$${amount.toLocaleString()} has been applied. Reason: ${reason}`,
      type: 'transaction',
      read: false,
      createdAt: now
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${targetUid}`);
  }
}

// Admin: Toggle user status (active / suspended)
export async function adminToggleUserStatus(uid: string, newStatus: 'active' | 'suspended'): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

// Admin: Save or update investment plan
export async function adminSaveInvestmentPlan(plan: InvestmentPlan): Promise<void> {
  const planRef = doc(db, 'investmentPlans', plan.id);
  try {
    await setDoc(
      planRef,
      {
        ...plan,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `investmentPlans/${plan.id}`);
  }
}

// Admin: Delete an investment plan
export async function adminDeleteInvestmentPlan(planId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'investmentPlans', planId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `investmentPlans/${planId}`);
  }
}

// Admin: Create announcement
export async function adminCreateAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<void> {
  const id = `ann_${Date.now()}`;
  try {
    await setDoc(doc(db, 'announcements', id), {
      ...announcement,
      id,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'announcements');
  }
}

// Admin: Delete announcement
export async function adminDeleteAnnouncement(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
  }
}

// Admin: Reply to Support Ticket
export async function adminReplySupportTicket(
  ticketId: string,
  reply: string,
  newStatus: SupportTicket['status']
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
      adminReply: reply,
      status: newStatus,
      updatedAt: now
    });

    const ticketDoc = await getDoc(doc(db, 'supportTickets', ticketId));
    if (ticketDoc.exists()) {
      const ticket = ticketDoc.data() as SupportTicket;
      await setDoc(doc(db, 'notifications', `notif_ticket_${ticketId}`), {
        id: `notif_ticket_${ticketId}`,
        userId: ticket.userId,
        title: 'Support Desk Response',
        message: `Your ticket "${ticket.subject}" has a response from our engineering desk. Status: ${newStatus.toUpperCase()}`,
        type: 'system',
        read: false,
        createdAt: now
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `supportTickets/${ticketId}`);
  }
}

// Admin: Update platform settings
export async function adminUpdatePlatformConfig(config: PlatformConfig): Promise<void> {
  try {
    await setDoc(doc(db, 'platformConfig', 'settings'), {
      ...config,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'platformConfig/settings');
  }
}

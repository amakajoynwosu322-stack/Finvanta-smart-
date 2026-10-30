export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  balance: number;
  totalInvested: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalDeposited: number;
  referralCode: string;
  referredBy?: string;
  twoFactorEnabled: boolean;
  status: 'active' | 'suspended';
  kycStatus: 'unverified' | 'pending' | 'verified';
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  category: string;
  minDeposit: number;
  maxDeposit: number;
  dailyRoi: number; // percentage, e.g. 1.8 = 1.8% daily
  totalRoi: number; // e.g. 54%
  durationDays: number;
  riskLevel: 'Conservative' | 'Balanced' | 'Aggressive' | 'Institutional';
  capitalReturn: boolean;
  active: boolean;
  features: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Investment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  planName: string;
  amount: number;
  dailyRoi: number;
  totalRoiExpected: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  daysElapsed: number;
  totalEarned: number;
  status: 'active' | 'completed' | 'cancelled';
  lastProfitClaimDate: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'roi_payout' | 'referral_bonus' | 'admin_adjustment';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'rejected';
  reference: string;
  note: string;
  paymentMethod?: string;
  destinationAddress?: string;
  createdAt: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  network: string;
  txHash: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  network: string;
  walletAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserEmail: string;
  referredUserName: string;
  commissionEarned: number;
  status: 'active' | 'pending';
  level: number;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'system' | 'market_update' | 'yield_boost' | 'maintenance';
  priority: 'low' | 'normal' | 'urgent';
  active: boolean;
  author: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  category: 'deposit' | 'withdrawal' | 'investment' | 'security' | 'general';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'transaction' | 'investment' | 'security' | 'promo';
  read: boolean;
  createdAt: string;
}

export interface PlatformConfig {
  platformName: string;
  minDeposit: number;
  minWithdrawal: number;
  withdrawalFeePercentage: number;
  referralBonusPercentage: number;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  usdtTrc20Address: string;
  btcAddress: string;
  ethAddress: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string;
  email?: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  balance: number; // Main Balance in NGN (₦) - used EXCLUSIVELY to purchase simulated investment plans (never withdrawable)
  taskBalance?: number; // Daily Task Earnings in NGN (₦) - eligible only for task withdrawal on 30th
  affiliateBalance?: number; // Referral & Affiliate Commissions in NGN (₦) - eligible for daily affiliate withdrawal
  activePlanTier?: 'tier_1' | 'popular' | 'tier_3' | 'tier_4' | 'premier' | null;
  activeInvestmentId?: string | null;
  lastTaskClaimTimestamp?: number;
  completedTaskIds?: string[]; // IDs of daily tasks completed today
  totalInvested: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalDeposited: number;
  referralCode: string;
  referredBy?: string;
  promoCode?: string;
  educationalTier?: string; // e.g. "Standard", "VIP Educational Scholar", "Elite Quantitative"
  twoFactorEnabled: boolean;
  status: 'active' | 'suspended';
  kycStatus: 'unverified' | 'pending' | 'verified';
  createdAt: string;
  updatedAt: string;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  rewardNaira: number;
  category: 'check_in' | 'financial_literacy' | 'market_review' | 'community';
  estimatedMinutes: number;
}

export interface PromoCode {
  id: string; // The uppercase code string e.g. "QUANTUM2026"
  code: string;
  perkDescription: string;
  perkType: 'educational_vip' | 'simulated_bonus' | 'referral_boost' | 'course_unlock';
  simulatedBonusAmount?: number; // Simulated educational balance credit, clearly labeled simulation
  maxUses: number;
  currentUses: number;
  expiresAt: string; // ISO date
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export interface PromoCodeUsage {
  id: string;
  code: string;
  userId: string;
  userPhone: string;
  userName: string;
  usedAt: string;
  perkGranted: string;
}

export interface PhoneRegistrationData {
  firstName: string;
  lastName: string;
  countryCode: string;
  phoneNumber: string;
  password: string;
  referralCode?: string;
  promoCode?: string;
}

export interface PhoneLoginData {
  countryCode?: string;
  phoneNumber: string;
  password: string;
}

export interface PhoneResetRequest {
  id: string;
  phoneNumber: string;
  otpCode: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  category: string;
  tierKey: 'tier_1' | 'popular' | 'tier_3' | 'tier_4' | 'premier';
  simulatedCapital: number; // e.g. 1500, 3000, 6000, 9000, 12000
  projectedValue: number; // e.g. 12000, 18000, 27000, 39000, 51000
  dailyTaskReward: number; // e.g. 400, 600, 900, 1300, 1700
  taskResetHours: number; // 24
  minDeposit: number;
  maxDeposit: number;
  dailyRoi: number; // calculated percentage for consistency
  totalRoi: number;
  durationDays: number; // 30
  riskLevel: 'Conservative' | 'Balanced' | 'Aggressive' | 'Institutional';
  capitalReturn: boolean;
  active: boolean;
  isPopular?: boolean;
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
  tierKey: 'tier_1' | 'popular' | 'tier_3' | 'tier_4' | 'premier';
  amount: number;
  dailyRoi: number;
  dailyTaskReward?: number;
  totalRoiExpected: number;
  projectedValue?: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  daysElapsed: number;
  totalEarned: number;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  expiredAt?: string;
  expirationReason?: string;
  renewedAt?: string;
  lastProfitClaimDate: string;
  lastTaskClaimTimestamp?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'roi_payout' | 'referral_bonus' | 'admin_adjustment' | 'task_reward' | 'plan_expired' | 'plan_renewed';
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
  balanceSource: 'task' | 'affiliate';
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

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
  WithdrawalRequest,
  PhoneRegistrationData,
  PhoneLoginData,
  PhoneResetRequest,
  PromoCode,
  PromoCodeUsage,
  DailyTask
} from '../types';
import {
  normalizePhoneNumber,
  sha256Hex,
  hashPassword,
  verifyPassword,
  generateSecureOtp,
  validatePasswordStrength
} from './crypto';
import {
  getWatTime,
  getAffiliateWithdrawalStatus,
  getTaskWithdrawalStatus,
  isPlanEligibleForMonthlyExpiration,
  getTrustedTimestamp
} from '../utils/watTime';

export const BOOTSTRAP_ADMIN_EMAIL = 'amakajoynwosu322@gmail.com';
export const BOOTSTRAP_ADMIN_PHONE = '+2348000000001';
export const BOOTSTRAP_ADMIN_UID = 'adm_finvanta_root_001';

export interface PlanTaskItem {
  tierKey: 'tier_1' | 'popular' | 'tier_3' | 'tier_4' | 'premier';
  tierName: string;
  taskId: string;
  title: string;
  description: string;
  dailyRewardNaira: number;
  taskResetHours: number;
  estimatedMinutes: number;
  badge: string;
}

export const PLAN_TIER_TASKS: Record<string, PlanTaskItem> = {
  tier_1: {
    tierKey: 'tier_1',
    tierName: 'Tier 1',
    taskId: 'task_tier_1',
    title: 'Tier 1 Daily Liquidity Verification',
    description: 'Perform daily simulated capital health check and verify starter treasury allocation.',
    dailyRewardNaira: 400,
    taskResetHours: 24,
    estimatedMinutes: 1,
    badge: 'Tier 1 Exclusive'
  },
  popular: {
    tierKey: 'popular',
    tierName: 'Popular',
    taskId: 'task_popular',
    title: 'Popular Growth Protocol & Treasury Check',
    description: 'Verify daily portfolio allocation metrics and review sovereign money-market indices.',
    dailyRewardNaira: 600,
    taskResetHours: 24,
    estimatedMinutes: 1,
    badge: 'Most Popular'
  },
  tier_3: {
    tierKey: 'tier_3',
    tierName: 'Tier 3',
    taskId: 'task_tier_3',
    title: 'Tier 3 Sovereign Notes & Yield Audit',
    description: 'Audit sovereign notes risk-adjusted yield survey and inspect asset diversification data.',
    dailyRewardNaira: 900,
    taskResetHours: 24,
    estimatedMinutes: 2,
    badge: 'Tier 3 Exclusive'
  },
  tier_4: {
    tierKey: 'tier_4',
    tierName: 'Tier 4',
    taskId: 'task_tier_4',
    title: 'Tier 4 Institutional Risk Validation',
    description: 'Perform institutional liquidity consensus review and inspect commercial paper yields.',
    dailyRewardNaira: 1300,
    taskResetHours: 24,
    estimatedMinutes: 2,
    badge: 'Tier 4 Exclusive'
  },
  premier: {
    tierKey: 'premier',
    tierName: 'Premier',
    taskId: 'task_premier',
    title: 'Premier Executive Sovereign Audit',
    description: 'Execute top-tier sovereign syndicate allocation audit and claim maximum daily task dividend.',
    dailyRewardNaira: 1700,
    taskResetHours: 24,
    estimatedMinutes: 2,
    badge: 'Premier Exclusive'
  }
};

export const DEFAULT_DAILY_TASKS: DailyTask[] = Object.values(PLAN_TIER_TASKS).map((pt) => ({
  id: pt.taskId,
  title: pt.title,
  description: pt.description,
  rewardNaira: pt.dailyRewardNaira,
  category: 'check_in',
  estimatedMinutes: pt.estimatedMinutes
}));

export const DEFAULT_PLANS: InvestmentPlan[] = [
  {
    id: 'plan_tier_1',
    name: 'Tier 1',
    tierKey: 'tier_1',
    category: 'Starter Treasury Protocol',
    description: 'Fundamental simulated liquidity allocation designed for foundational portfolio growth.',
    simulatedCapital: 1500,
    projectedValue: 12000,
    dailyTaskReward: 400,
    taskResetHours: 24,
    minDeposit: 1500,
    maxDeposit: 1500,
    dailyRoi: 1.15,
    totalRoi: 700,
    durationDays: 30,
    riskLevel: 'Conservative',
    capitalReturn: true,
    active: true,
    features: [
      'Simulated Capital: ₦1,500',
      'Illustrative Projected Value: ₦12,000',
      'Daily Simulated Task Reward: ₦400',
      'Task Reset Interval: Every 24 hours',
      'Term Duration: 30 days',
      'Fictional educational simulation'
    ]
  },
  {
    id: 'plan_popular',
    name: 'Popular',
    tierKey: 'popular',
    isPopular: true,
    category: 'Growth Wealth Builder',
    description: 'Our most popular simulated wealth package featuring accelerated daily task distributions.',
    simulatedCapital: 3000,
    projectedValue: 18000,
    dailyTaskReward: 600,
    taskResetHours: 24,
    minDeposit: 3000,
    maxDeposit: 3000,
    dailyRoi: 1.67,
    totalRoi: 500,
    durationDays: 30,
    riskLevel: 'Balanced',
    capitalReturn: true,
    active: true,
    features: [
      'Most Popular Choice',
      'Simulated Capital: ₦3,000',
      'Illustrative Projected Value: ₦18,000',
      'Daily Simulated Task Reward: ₦600',
      'Task Reset Interval: Every 24 hours',
      'Term Duration: 30 days',
      'Fictional educational simulation'
    ]
  },
  {
    id: 'plan_tier_3',
    name: 'Tier 3',
    tierKey: 'tier_3',
    category: 'Advanced Sovereign Allocation',
    description: 'Enhanced simulated sovereign growth strategy providing elevated daily task returns.',
    simulatedCapital: 6000,
    projectedValue: 27000,
    dailyTaskReward: 900,
    taskResetHours: 24,
    minDeposit: 6000,
    maxDeposit: 6000,
    dailyRoi: 1.5,
    totalRoi: 350,
    durationDays: 30,
    riskLevel: 'Balanced',
    capitalReturn: true,
    active: true,
    features: [
      'Simulated Capital: ₦6,000',
      'Illustrative Projected Value: ₦27,000',
      'Daily Simulated Task Reward: ₦900',
      'Task Reset Interval: Every 24 hours',
      'Term Duration: 30 days',
      'Fictional educational simulation'
    ]
  },
  {
    id: 'plan_tier_4',
    name: 'Tier 4',
    tierKey: 'tier_4',
    category: 'Institutional Syndicate Strategy',
    description: 'High-performance simulated institutional package for advanced portfolio expansion.',
    simulatedCapital: 9000,
    projectedValue: 39000,
    dailyTaskReward: 1300,
    taskResetHours: 24,
    minDeposit: 9000,
    maxDeposit: 9000,
    dailyRoi: 1.45,
    totalRoi: 333,
    durationDays: 30,
    riskLevel: 'Aggressive',
    capitalReturn: true,
    active: true,
    features: [
      'Simulated Capital: ₦9,000',
      'Illustrative Projected Value: ₦39,000',
      'Daily Simulated Task Reward: ₦1,300',
      'Task Reset Interval: Every 24 hours',
      'Term Duration: 30 days',
      'Fictional educational simulation'
    ]
  },
  {
    id: 'plan_premier',
    name: 'Premier',
    tierKey: 'premier',
    category: 'Executive Sovereign Syndicate',
    description: 'Top-tier simulated executive portfolio offering the maximum daily task reward dividend.',
    simulatedCapital: 12000,
    projectedValue: 51000,
    dailyTaskReward: 1700,
    taskResetHours: 24,
    minDeposit: 12000,
    maxDeposit: 12000,
    dailyRoi: 1.42,
    totalRoi: 325,
    durationDays: 30,
    riskLevel: 'Institutional',
    capitalReturn: true,
    active: true,
    features: [
      'Top-Tier Executive Status',
      'Simulated Capital: ₦12,000',
      'Illustrative Projected Value: ₦51,000',
      'Daily Simulated Task Reward: ₦1,700',
      'Task Reset Interval: Every 24 hours',
      'Term Duration: 30 days',
      'Fictional educational simulation'
    ]
  }
];

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  platformName: 'FINVANTA',
  minDeposit: 10000,
  minWithdrawal: 5000,
  withdrawalFeePercentage: 1.5,
  referralBonusPercentage: 7.0,
  maintenanceMode: false,
  allowNewRegistrations: true,
  usdtTrc20Address: 'FINVANTA Designated Settlement Account - Wema Bank: 0124896721',
  btcAddress: 'FINVANTA Corporate Vault - Providus Bank: 5401928371',
  ethAddress: 'FINVANTA Virtual NGN Treasury - Access Bank: 0782910482',
  updatedAt: new Date().toISOString()
};

// Sanitize profile to ensure no internal auth hashes or salts are ever exposed to the frontend
export function sanitizeUserProfile(raw: any): UserProfile {
  if (!raw) return raw;
  const { _auth, ...safeProfile } = raw;
  return safeProfile as UserProfile;
}

// Check if user is an admin
export async function checkIsAdmin(uid: string, identifier?: string | null): Promise<boolean> {
  if (uid === BOOTSTRAP_ADMIN_UID) return true;
  if (
    identifier &&
    (identifier.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
      identifier === BOOTSTRAP_ADMIN_PHONE)
  ) {
    return true;
  }
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

// Seed initial default plans, config and administrator account
export async function seedInitialPlatformData() {
  try {
    const configRef = doc(db, 'platformConfig', 'settings');
    const configSnap = await getDoc(configRef);
    if (!configSnap.exists()) {
      await setDoc(configRef, DEFAULT_PLATFORM_CONFIG);
    }

    // Always ensure the 5 official FINVANTA plans exist
    for (const plan of DEFAULT_PLANS) {
      await setDoc(
        doc(db, 'investmentPlans', plan.id),
        {
          ...plan,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }

    // Seed announcements
    const annSnap = await getDocs(collection(db, 'announcements'));
    if (annSnap.empty) {
      await setDoc(doc(db, 'announcements', 'ann_welcome'), {
        id: 'ann_welcome',
        title: 'FINVANTA v5.0 Quantum Engine Live',
        content: 'Our latest neural arbitrage execution protocol is active across Tier-1 liquidity bridges. Daily ROI payouts execute synchronously every 24 hours.',
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

    // Seed authoritative Administrator account if not registered
    const adminPhoneHash = await sha256Hex(BOOTSTRAP_ADMIN_PHONE);
    const adminRegSnap = await getDoc(doc(db, 'phoneRegistry', adminPhoneHash));
    if (!adminRegSnap.exists()) {
      const { hash, salt } = await hashPassword('AdminFINVANTA2026!');
      const adminProfile: UserProfile = {
        uid: BOOTSTRAP_ADMIN_UID,
        firstName: 'Amaka',
        lastName: 'Nwosu',
        phoneNumber: BOOTSTRAP_ADMIN_PHONE,
        countryCode: '+234',
        email: BOOTSTRAP_ADMIN_EMAIL,
        displayName: 'Amaka Nwosu (Platform Admin)',
        photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
        role: 'admin',
        balance: 0.0,
        totalInvested: 0.0,
        totalEarned: 0.0,
        totalWithdrawn: 0.0,
        totalDeposited: 0.0,
        referralCode: 'FV-ROOTADMIN',
        referredBy: '',
        twoFactorEnabled: true,
        status: 'active',
        kycStatus: 'verified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', BOOTSTRAP_ADMIN_UID), {
        ...adminProfile,
        _auth: {
          passwordHash: hash,
          passwordSalt: salt
        }
      });

      await setDoc(doc(db, 'phoneRegistry', adminPhoneHash), {
        phoneHash: adminPhoneHash,
        phoneNumber: BOOTSTRAP_ADMIN_PHONE,
        uid: BOOTSTRAP_ADMIN_UID,
        createdAt: new Date().toISOString()
      });

      await setDoc(doc(db, 'admins', BOOTSTRAP_ADMIN_UID), {
        email: BOOTSTRAP_ADMIN_EMAIL,
        phone: BOOTSTRAP_ADMIN_PHONE,
        role: 'superadmin',
        addedAt: new Date().toISOString()
      });
    }

    // Seed default educational promo codes
    const defaultPromos: PromoCode[] = [
      {
        id: 'QUANTUM2026',
        code: 'QUANTUM2026',
        perkDescription: 'VIP Educational Scholar Tier & Priority Quantitative Execution Simulation',
        perkType: 'educational_vip',
        simulatedBonusAmount: 250,
        maxUses: 1000,
        currentUses: 0,
        expiresAt: '2027-12-31T23:59:59Z',
        active: true,
        createdBy: 'Platform Governance Desk',
        createdAt: new Date().toISOString()
      },
      {
        id: 'VIPACCESS',
        code: 'VIPACCESS',
        perkDescription: 'Elite VIP Learning Module & Enhanced 10% Simulated Referral Multiplier',
        perkType: 'referral_boost',
        simulatedBonusAmount: 100,
        maxUses: 500,
        currentUses: 0,
        expiresAt: '2027-12-31T23:59:59Z',
        active: true,
        createdBy: 'Platform Governance Desk',
        createdAt: new Date().toISOString()
      },
      {
        id: 'LEARNCRYPTO',
        code: 'LEARNCRYPTO',
        perkDescription: '$500 Educational Sandbox Credit for Risk-Free Arbitrage Testing',
        perkType: 'simulated_bonus',
        simulatedBonusAmount: 500,
        maxUses: 2500,
        currentUses: 0,
        expiresAt: '2027-12-31T23:59:59Z',
        active: true,
        createdBy: 'Platform Governance Desk',
        createdAt: new Date().toISOString()
      }
    ];

    for (const promo of defaultPromos) {
      const pRef = doc(db, 'promoCodes', promo.id);
      const pSnap = await getDoc(pRef);
      if (!pSnap.exists()) {
        await setDoc(pRef, promo);
      }
    }
  } catch (error) {
    console.warn('Initial seeding note:', error);
  }
}

// Fetch user profile by UID
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return sanitizeUserProfile(snap.data());
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
}

// Register user with phone number and password
export async function registerUserWithPhone(data: PhoneRegistrationData): Promise<UserProfile> {
  const validation = validatePasswordStrength(data.password);
  if (!validation.isValid) {
    throw new Error(validation.errors[0] || 'Password does not satisfy security requirements.');
  }

  const cleanCountryCode = data.countryCode.trim() || '+234';
  const normalizedPhone = normalizePhoneNumber(cleanCountryCode, data.phoneNumber);
  if (normalizedPhone.length < 9) {
    throw new Error('Please enter a valid phone number with country code.');
  }

  const phoneHash = await sha256Hex(normalizedPhone);
  const regRef = doc(db, 'phoneRegistry', phoneHash);
  const existingReg = await getDoc(regRef);

  if (existingReg.exists()) {
    throw new Error('A user account with this phone number is already registered. Please log in.');
  }

  // Hash password using PBKDF2 Web Crypto API (100,000 iterations + 16-byte random salt)
  const { hash, salt } = await hashPassword(data.password);
  const uid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);

  const cleanFirstName = data.firstName.trim();
  const cleanLastName = data.lastName.trim();

  const newProfile: UserProfile = {
    uid,
    firstName: cleanFirstName,
    lastName: cleanLastName,
    phoneNumber: normalizedPhone,
    countryCode: cleanCountryCode,
    displayName: `${cleanFirstName} ${cleanLastName}`,
    email: `${normalizedPhone.replace('+', '')}@sim.finvanta.com`,
    photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${uid}`,
    role: 'user',
    balance: 0.0, // Strictly $0.00 initial balance in production
    totalInvested: 0.0,
    totalEarned: 0.0,
    totalWithdrawn: 0.0,
    totalDeposited: 0.0,
    referralCode: 'FV-' + uid.slice(-6).toUpperCase(),
    referredBy: data.referralCode?.trim() || '',
    twoFactorEnabled: false,
    status: 'active',
    kycStatus: 'unverified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Process optional promo code through backend validation
  let promoPerkGranted: string | null = null;
  if (data.promoCode?.trim()) {
    const promoCheck = await validatePromoCode(data.promoCode.trim());
    if (!promoCheck.valid || !promoCheck.promoCode) {
      throw new Error(promoCheck.message || 'The specified promo code is invalid or expired.');
    }

    const promo = promoCheck.promoCode;
    newProfile.promoCode = promo.code;
    newProfile.educationalTier =
      promo.perkType === 'educational_vip'
        ? 'VIP Educational Scholar'
        : promo.perkType === 'referral_boost'
        ? 'VIP Referral Partner'
        : 'Standard Scholar';

    // If educational sandbox credit is offered
    if (promo.simulatedBonusAmount && promo.simulatedBonusAmount > 0) {
      newProfile.balance = promo.simulatedBonusAmount;
      newProfile.totalDeposited = promo.simulatedBonusAmount;
    }

    promoPerkGranted = promo.perkDescription;

    // Record usage in audit log
    const usageId = `use_${Date.now()}_${uid.slice(-4)}`;
    const usageRecord: PromoCodeUsage = {
      id: usageId,
      code: promo.code,
      userId: uid,
      userPhone: normalizedPhone,
      userName: newProfile.displayName,
      usedAt: new Date().toISOString(),
      perkGranted: promo.perkDescription
    };

    try {
      await setDoc(doc(db, 'promoCodeUsages', usageId), usageRecord);
      await updateDoc(doc(db, 'promoCodes', promo.id), {
        currentUses: (promo.currentUses || 0) + 1
      });
    } catch (promoErr) {
      console.warn('Promo usage record note:', promoErr);
    }
  }

  // Save phone registry entry
  await setDoc(regRef, {
    phoneHash,
    phoneNumber: normalizedPhone,
    uid,
    createdAt: new Date().toISOString()
  });

  // Save user document with encrypted credentials
  await setDoc(doc(db, 'users', uid), {
    ...newProfile,
    _auth: {
      passwordHash: hash,
      passwordSalt: salt
    }
  });

  // Handle referral linking if provided
  if (data.referralCode?.trim()) {
    try {
      const refCode = data.referralCode.trim().toUpperCase();
      const q = query(collection(db, 'users'), where('referralCode', '==', refCode));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const referrerDoc = qSnap.docs[0];
        const referrer = referrerDoc.data() as UserProfile;
        const refId = `ref_${Date.now()}_${uid.slice(-4)}`;
        await setDoc(doc(db, 'referrals', refId), {
          id: refId,
          referrerId: referrer.uid,
          referredUserId: uid,
          referredUserEmail: newProfile.phoneNumber,
          referredUserName: newProfile.displayName,
          commissionEarned: 0.0,
          status: 'active',
          level: 1,
          createdAt: new Date().toISOString()
        } as Referral);
      }
    } catch (refErr) {
      console.warn('Referral linking note:', refErr);
    }
  }

  // Welcome notification
  await setDoc(doc(db, 'notifications', `notif_welcome_${uid}`), {
    id: `notif_welcome_${uid}`,
    userId: uid,
    title: 'Welcome to FINVANTA Protocol',
    message: 'Your account has been registered with phone authentication. To explore our quantum arbitrage strategies in simulation mode, head to the Deposit tab to initiate a simulated balance.',
    type: 'system',
    read: false,
    createdAt: new Date().toISOString()
  });

  // Promo code notification if applied
  if (promoPerkGranted && data.promoCode) {
    await setDoc(doc(db, 'notifications', `notif_promo_${uid}`), {
      id: `notif_promo_${uid}`,
      userId: uid,
      title: `Promo Perk Unlocked (${data.promoCode.trim().toUpperCase()})`,
      message: `Congratulations! ${promoPerkGranted} has been activated on your educational account.`,
      type: 'promo',
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  return newProfile;
}

// Log in user with phone number and password
export async function loginUserWithPhone(
  phoneNumber: string,
  password: string,
  countryCode = '+234'
): Promise<UserProfile> {
  const normalizedPhone = normalizePhoneNumber(countryCode, phoneNumber);
  const phoneHash = await sha256Hex(normalizedPhone);

  const regRef = doc(db, 'phoneRegistry', phoneHash);
  const regSnap = await getDoc(regRef);

  if (!regSnap.exists()) {
    throw new Error(`No FINVANTA account found with phone number ${normalizedPhone}. Please check your number or register.`);
  }

  const { uid } = regSnap.data();
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('Account record could not be found.');
  }

  const userData = userSnap.data();
  if (userData.status === 'suspended') {
    throw new Error('This account has been suspended. Please contact platform compliance support.');
  }

  const authData = userData._auth;
  if (!authData || !authData.passwordHash || !authData.passwordSalt) {
    throw new Error('This account does not have password credentials configured.');
  }

  const isPasswordValid = await verifyPassword(password, authData.passwordHash, authData.passwordSalt);
  if (!isPasswordValid) {
    throw new Error('Incorrect password. Please verify your credentials or reset your password.');
  }

  return sanitizeUserProfile(userData);
}

// Request password reset OTP via phone number
export async function requestPhoneResetOtp(
  phoneNumber: string,
  countryCode = '+234'
): Promise<{ resetId: string; otpCode: string; phoneNumber: string }> {
  const normalizedPhone = normalizePhoneNumber(countryCode, phoneNumber);
  const phoneHash = await sha256Hex(normalizedPhone);

  const regRef = doc(db, 'phoneRegistry', phoneHash);
  const regSnap = await getDoc(regRef);

  if (!regSnap.exists()) {
    throw new Error(`No FINVANTA account found with phone number ${normalizedPhone}`);
  }

  const otpCode = generateSecureOtp();
  const resetId = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const resetDoc: PhoneResetRequest = {
    id: resetId,
    phoneNumber: normalizedPhone,
    otpCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    used: false,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'passwordResets', resetId), resetDoc);

  return { resetId, otpCode, phoneNumber: normalizedPhone };
}

// Verify OTP and update password
export async function verifyPhoneResetOtpAndSetPassword(
  resetId: string,
  otpCode: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new Error(validation.errors[0] || 'Password does not meet complexity requirements.');
  }

  const resetRef = doc(db, 'passwordResets', resetId);
  const resetSnap = await getDoc(resetRef);

  if (!resetSnap.exists()) {
    throw new Error('Invalid or expired reset request. Please initiate a new password reset.');
  }

  const resetData = resetSnap.data() as PhoneResetRequest;

  if (resetData.used) {
    throw new Error('This reset code has already been used. Please request a new one.');
  }

  if (new Date(resetData.expiresAt).getTime() < Date.now()) {
    throw new Error('The reset code has expired. Please request a new code.');
  }

  if (resetData.otpCode.trim() !== otpCode.trim()) {
    throw new Error('Invalid OTP code. Please enter the 6-digit code received.');
  }

  const phoneHash = await sha256Hex(resetData.phoneNumber);
  const regSnap = await getDoc(doc(db, 'phoneRegistry', phoneHash));
  if (!regSnap.exists()) {
    throw new Error('Associated account could not be located.');
  }

  const { uid } = regSnap.data();
  const { hash, salt } = await hashPassword(newPassword);

  // Update password in user doc
  await updateDoc(doc(db, 'users', uid), {
    _auth: {
      passwordHash: hash,
      passwordSalt: salt
    },
    updatedAt: new Date().toISOString()
  });

  // Mark reset code as used
  await updateDoc(resetRef, {
    used: true
  });

  // Create notification
  await setDoc(doc(db, 'notifications', `notif_pwd_${Date.now()}`), {
    id: `notif_pwd_${Date.now()}`,
    userId: uid,
    title: 'Security Alert: Password Updated',
    message: 'Your FINVANTA account password was successfully reset via verified phone OTP.',
    type: 'security',
    read: false,
    createdAt: new Date().toISOString()
  });

  return { success: true, message: 'Password has been successfully updated. You can now log in.' };
}

// Subscribe to a user profile
export function subscribeToUserProfile(uid: string, callback: (user: UserProfile | null) => void) {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        callback(sanitizeUserProfile(snap.data()));
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  );
}

// User invests in a plan using Main Balance exclusively
export async function executeInvestment(
  user: UserProfile,
  plan: InvestmentPlan,
  amount: number
): Promise<{ success: boolean; message: string }> {
  const capital = plan.simulatedCapital || plan.minDeposit;
  if (amount < capital) {
    return { success: false, message: `Required simulated capital for ${plan.name} is ₦${capital.toLocaleString('en-NG')}` };
  }
  if (user.balance < amount) {
    return {
      success: false,
      message: `Insufficient Main Balance (Available: ₦${user.balance.toLocaleString('en-NG')}). Please fund your wallet via simulated deposit first.`
    };
  }

  const investmentId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const endDate = new Date(now.getTime() + (plan.durationDays || 30) * 86400000);

  const newInvestment: Investment = {
    id: investmentId,
    userId: user.uid,
    userEmail: user.email || user.phoneNumber || '',
    userName: user.displayName,
    planId: plan.id,
    planName: plan.name,
    tierKey: plan.tierKey || 'tier_1',
    amount,
    dailyRoi: plan.dailyRoi,
    dailyTaskReward: plan.dailyTaskReward || 400,
    totalRoiExpected: (amount * plan.dailyRoi * (plan.durationDays || 30)) / 100,
    projectedValue: plan.projectedValue || 12000,
    durationDays: plan.durationDays || 30,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    daysElapsed: 0,
    totalEarned: 0,
    status: 'active',
    lastProfitClaimDate: now.toISOString(),
    lastTaskClaimTimestamp: 0,
    createdAt: now.toISOString()
  };

  const newTransaction: Transaction = {
    id: transactionId,
    userId: user.uid,
    userEmail: user.email || user.phoneNumber || '',
    userName: user.displayName,
    type: 'investment',
    amount,
    currency: 'NGN',
    status: 'completed',
    reference: `INV-${investmentId.slice(-6).toUpperCase()}`,
    note: `Purchased ${plan.name} plan (Capital: ₦${amount.toLocaleString('en-NG')}, Daily Task: ₦${(plan.dailyTaskReward || 400).toLocaleString('en-NG')})`,
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
        throw new Error('Insufficient Main Balance');
      }

      t.update(userRef, {
        balance: currentData.balance - amount,
        totalInvested: (currentData.totalInvested || 0) + amount,
        activePlanTier: plan.tierKey || 'tier_1',
        activeInvestmentId: investmentId,
        updatedAt: now.toISOString()
      });

      t.set(doc(db, 'investments', investmentId), newInvestment);
      t.set(doc(db, 'transactions', transactionId), newTransaction);
    });

    // Send in-app notification
    await setDoc(doc(db, 'notifications', `notif_inv_${investmentId}`), {
      id: `notif_inv_${investmentId}`,
      userId: user.uid,
      title: 'Plan Activated Successfully',
      message: `Your ${plan.name} plan is now active. You have unlocked your tier's daily tasks (₦${(plan.dailyTaskReward || 400).toLocaleString('en-NG')}/day)!`,
      type: 'investment',
      read: false,
      createdAt: now.toISOString()
    });

    return { success: true, message: `Successfully activated ${plan.name}! Your dedicated tasks are now unlocked.` };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'investments');
    return { success: false, message: 'Investment transaction failed.' };
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
    userEmail: user.email || user.phoneNumber || '',
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
    userEmail: user.email || user.phoneNumber || '',
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

// Submit simulated withdrawal request with strict Nigeria Time (WAT) schedule validation
// Enforces separate balances: Main Balance is NEVER withdrawable.
// Task Balance is withdrawable ONLY on 30th of month (4:50 PM - 6:20 PM WAT).
// Affiliate Balance is withdrawable ONLY daily (7:30 PM - 8:40 PM WAT).
export async function submitWithdrawalRequest(
  user: UserProfile,
  amount: number,
  currency: string,
  network: string,
  walletAddress: string,
  balanceSource: 'task' | 'affiliate' = 'task'
): Promise<{ success: boolean; message: string }> {
  if (amount <= 0) {
    return { success: false, message: 'Withdrawal amount must be greater than ₦0.' };
  }

  // 1. Verify schedule using trusted WAT server time
  if (balanceSource === 'task') {
    const taskStatus = getTaskWithdrawalStatus();
    if (!taskStatus.isOpen) {
      return {
        success: false,
        message: `Task Balance withdrawal is CLOSED. Available only on the 30th day of each month (4:50 PM – 6:20 PM WAT). ${taskStatus.nextWindowText}.`
      };
    }
    const currentTaskBal = user.taskBalance || 0;
    if (amount > currentTaskBal) {
      return {
        success: false,
        message: `Insufficient Task Balance (Available: ₦${currentTaskBal.toLocaleString('en-NG')}).`
      };
    }
  } else if (balanceSource === 'affiliate') {
    const affStatus = getAffiliateWithdrawalStatus();
    if (!affStatus.isOpen) {
      return {
        success: false,
        message: `Affiliate Balance withdrawal is CLOSED. Available daily between 7:30 PM and 8:40 PM WAT. ${affStatus.nextWindowText}.`
      };
    }
    const currentAffBal = user.affiliateBalance || 0;
    if (amount > currentAffBal) {
      return {
        success: false,
        message: `Insufficient Affiliate Balance (Available: ₦${currentAffBal.toLocaleString('en-NG')}).`
      };
    }
  } else {
    return {
      success: false,
      message: 'Invalid balance source. Main Balance is reserved exclusively for purchasing investment plans and cannot be withdrawn.'
    };
  }

  if (!walletAddress || walletAddress.trim().length < 8) {
    return { success: false, message: 'Please specify a valid Nigerian bank account number and bank name.' };
  }

  const requestId = `wth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const withdrawalReq: WithdrawalRequest = {
    id: requestId,
    userId: user.uid,
    userEmail: user.email || user.phoneNumber || '',
    userName: user.displayName,
    amount,
    currency,
    network,
    walletAddress,
    balanceSource,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };

  const transactionId = `tx_${requestId}`;
  const newTx: Transaction = {
    id: transactionId,
    userId: user.uid,
    userEmail: user.email || user.phoneNumber || '',
    userName: user.displayName,
    type: 'withdrawal',
    amount,
    currency,
    status: 'pending',
    reference: `WTH-${requestId.slice(-6).toUpperCase()}`,
    note: `Simulated ${balanceSource === 'task' ? 'Task' : 'Affiliate'} Payout to ${walletAddress}`,
    destinationAddress: walletAddress,
    createdAt: now
  };

  try {
    await runTransaction(db, async (t) => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error('User record not found');
      const data = userSnap.data() as UserProfile;

      if (balanceSource === 'task') {
        const available = data.taskBalance || 0;
        if (available < amount) throw new Error('Insufficient Task Balance');
        t.update(userRef, {
          taskBalance: available - amount,
          totalWithdrawn: (data.totalWithdrawn || 0) + amount,
          updatedAt: now
        });
      } else {
        const available = data.affiliateBalance || 0;
        if (available < amount) throw new Error('Insufficient Affiliate Balance');
        t.update(userRef, {
          affiliateBalance: available - amount,
          totalWithdrawn: (data.totalWithdrawn || 0) + amount,
          updatedAt: now
        });
      }

      t.set(doc(db, 'withdrawalRequests', requestId), withdrawalReq);
      t.set(doc(db, 'transactions', transactionId), newTx);
    });

    await setDoc(doc(db, 'notifications', `notif_${requestId}`), {
      id: `notif_${requestId}`,
      userId: user.uid,
      title: 'Withdrawal Scheduled',
      message: `Simulated ${balanceSource === 'task' ? 'Task' : 'Affiliate'} withdrawal request for ₦${amount.toLocaleString('en-NG')} is queued for administrative dispatch.`,
      type: 'transaction',
      read: false,
      createdAt: now
    });

    return {
      success: true,
      message: `Simulated withdrawal request for ₦${amount.toLocaleString('en-NG')} registered successfully from your ${balanceSource === 'task' ? 'Task' : 'Affiliate'} Balance!`
    };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, 'withdrawalRequests');
    return { success: false, message: error?.message || 'Withdrawal processing failed.' };
  }
}

// ----------------- MONTHLY PLAN EXPIRATION & RENEWAL -----------------

/**
 * Checks all active investments for monthly 30th-day cycle expiration based on Nigeria Time (WAT).
 * When 30th day arrives, eligible plans are marked as 'expired', tasks are locked,
 * and a notification is dispatched.
 */
export async function checkAndExpireMonthlyPlans(
  user: UserProfile,
  investments: Investment[]
): Promise<Investment[]> {
  const updatedInvestments = [...investments];
  let hasExpiredAny = false;
  const now = new Date().toISOString();

  for (let i = 0; i < updatedInvestments.length; i++) {
    const inv = updatedInvestments[i];
    if (inv.status === 'active' && isPlanEligibleForMonthlyExpiration(inv.startDate)) {
      hasExpiredAny = true;
      const expiredInv: Investment = {
        ...inv,
        status: 'expired',
        expiredAt: now,
        expirationReason: 'Monthly 30th-day cycle completed'
      };
      updatedInvestments[i] = expiredInv;

      try {
        await updateDoc(doc(db, 'investments', inv.id), {
          status: 'expired',
          expiredAt: now,
          expirationReason: 'Monthly 30th-day cycle completed'
        });

        // Record expiration in transaction ledger
        const txId = `tx_exp_${inv.id}_${Date.now()}`;
        await setDoc(doc(db, 'transactions', txId), {
          id: txId,
          userId: user.uid,
          userEmail: user.email || user.phoneNumber || '',
          userName: user.displayName,
          type: 'plan_expired',
          amount: inv.amount,
          currency: 'NGN',
          status: 'completed',
          reference: `EXP-${inv.id.slice(-6).toUpperCase()}`,
          note: `Plan Expired on 30th-day monthly cycle: ${inv.planName}. Tasks locked pending renewal.`,
          createdAt: now
        });

        // Notify user
        await setDoc(doc(db, 'notifications', `notif_exp_${inv.id}`), {
          id: `notif_exp_${inv.id}`,
          userId: user.uid,
          title: 'Plan Expired — Renewal Available',
          message: `Your ${inv.planName} has reached its monthly 30th-day expiration. Daily tasks are locked. Click "Renew Plan" to reactivate.`,
          type: 'investment',
          read: false,
          createdAt: now
        });
      } catch (err) {
        console.warn('Failed to update expired investment doc:', err);
      }
    }
  }

  if (hasExpiredAny) {
    const hasActiveRemaining = updatedInvestments.some((inv) => inv.status === 'active');
    if (!hasActiveRemaining) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          activePlanTier: null,
          updatedAt: now
        });
      } catch (err) {
        console.warn('Failed to reset user activePlanTier:', err);
      }
    }
  }

  return updatedInvestments;
}

/**
 * Renew an expired plan:
 * Checks Main Balance for required capital, creates a new active investment,
 * marks the expired one as 'renewed', and unlocks daily tasks for the user.
 */
export async function renewInvestmentPlan(
  user: UserProfile,
  expiredInvestment: Investment,
  plan: InvestmentPlan
): Promise<{ success: boolean; message: string }> {
  const capital = plan.simulatedCapital || expiredInvestment.amount;
  if ((user.balance || 0) < capital) {
    return {
      success: false,
      message: `Insufficient Main Balance to renew ${plan.name} (Required: ₦${capital.toLocaleString('en-NG')}, Available: ₦${(user.balance || 0).toLocaleString('en-NG')}). Please fund your wallet first.`
    };
  }

  const newInvId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const endDate = new Date(now.getTime() + (plan.durationDays || 30) * 86400000);

  const newInvestment: Investment = {
    id: newInvId,
    userId: user.uid,
    userEmail: user.email || user.phoneNumber || '',
    userName: user.displayName,
    planId: plan.id,
    planName: plan.name,
    tierKey: plan.tierKey || 'tier_1',
    amount: capital,
    dailyRoi: plan.dailyRoi,
    dailyTaskReward: plan.dailyTaskReward || 400,
    totalRoiExpected: (capital * plan.dailyRoi * (plan.durationDays || 30)) / 100,
    projectedValue: plan.projectedValue || 12000,
    durationDays: plan.durationDays || 30,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    daysElapsed: 0,
    totalEarned: 0,
    status: 'active',
    lastProfitClaimDate: now.toISOString(),
    lastTaskClaimTimestamp: 0,
    createdAt: now.toISOString()
  };

  const txId = `tx_ren_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const renewTx: Transaction = {
    id: txId,
    userId: user.uid,
    userEmail: user.email || user.phoneNumber || '',
    userName: user.displayName,
    type: 'plan_renewed',
    amount: capital,
    currency: 'NGN',
    status: 'completed',
    reference: `REN-${newInvId.slice(-6).toUpperCase()}`,
    note: `Renewed ${plan.name} Plan (Capital: ₦${capital.toLocaleString('en-NG')}, Tasks Unlocked)`,
    createdAt: now.toISOString()
  };

  try {
    await runTransaction(db, async (t) => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const uData = userSnap.data() as UserProfile;
      if (uData.balance < capital) throw new Error('Insufficient Main Balance');

      t.update(userRef, {
        balance: uData.balance - capital,
        totalInvested: (uData.totalInvested || 0) + capital,
        activePlanTier: plan.tierKey,
        activeInvestmentId: newInvId,
        updatedAt: now.toISOString()
      });

      // Mark expired plan as renewed
      t.update(doc(db, 'investments', expiredInvestment.id), {
        status: 'completed',
        renewedAt: now.toISOString()
      });

      t.set(doc(db, 'investments', newInvId), newInvestment);
      t.set(doc(db, 'transactions', txId), renewTx);
    });

    // Notify user
    await setDoc(doc(db, 'notifications', `notif_ren_${newInvId}`), {
      id: `notif_ren_${newInvId}`,
      userId: user.uid,
      title: 'Plan Renewed Successfully',
      message: `Your ${plan.name} has been renewed! Daily tasks have been unlocked for the new 30-day monthly cycle.`,
      type: 'investment',
      read: false,
      createdAt: now.toISOString()
    });

    return {
      success: true,
      message: `Successfully renewed ${plan.name}! Your tier's daily tasks are unlocked.`
    };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, 'investments');
    return { success: false, message: err?.message || 'Plan renewal failed.' };
  }
}

// ----------------- PLAN-SPECIFIC TASKS & REWARDS -----------------

/**
 * Claim daily reward for a specific plan tier.
 * Strictly verifies that:
 * 1. User has an ACTIVE (not expired) investment in that specific tier.
 * 2. 24 hours have elapsed since the last claim.
 * 3. Prevents claiming across other plan tiers or duplicate claims within the same 24h window.
 */
export async function claimPlanSpecificDailyTask(
  user: UserProfile,
  planTierKey: string,
  activeInvestment: Investment
): Promise<{ success: boolean; message: string }> {
  const planTask = PLAN_TIER_TASKS[planTierKey];
  if (!planTask) {
    return { success: false, message: 'Invalid plan task tier.' };
  }

  // 1. Check investment tier match
  if (activeInvestment.tierKey !== planTierKey) {
    return {
      success: false,
      message: `Access denied. You can only perform tasks belonging to your active ${activeInvestment.planName} plan.`
    };
  }

  // 2. Check if plan is expired
  if (activeInvestment.status !== 'active') {
    return {
      success: false,
      message: 'This plan is expired or inactive. Please renew your plan to unlock daily tasks.'
    };
  }

  // 3. Check 24-hour reset interval using trusted server timestamp
  const nowMs = getTrustedTimestamp();
  const lastClaimMs = activeInvestment.lastTaskClaimTimestamp || 0;
  const timeSinceLastClaimMs = nowMs - lastClaimMs;
  const resetIntervalMs = 24 * 60 * 60 * 1000;

  if (lastClaimMs > 0 && timeSinceLastClaimMs < resetIntervalMs) {
    const remainingMs = resetIntervalMs - timeSinceLastClaimMs;
    const remainingHours = Math.floor(remainingMs / (3600 * 1000));
    const remainingMins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
    return {
      success: false,
      message: `Task reward already claimed for this 24-hour cycle. Resets in ${remainingHours}h ${remainingMins}m.`
    };
  }

  const reward = planTask.dailyRewardNaira;
  const txId = `tx_task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  const taskTx: Transaction = {
    id: txId,
    userId: user.uid,
    userEmail: user.email || user.phoneNumber || '',
    userName: user.displayName,
    type: 'task_reward',
    amount: reward,
    currency: 'NGN',
    status: 'completed',
    reference: `TASK-${planTierKey.toUpperCase()}-${Date.now().toString().slice(-4)}`,
    note: `Daily Task Reward for ${planTask.tierName} (${planTask.title})`,
    createdAt: nowIso
  };

  try {
    await runTransaction(db, async (t) => {
      const userRef = doc(db, 'users', user.uid);
      const invRef = doc(db, 'investments', activeInvestment.id);

      const userSnap = await t.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found');
      const uData = userSnap.data() as UserProfile;

      const invSnap = await t.get(invRef);
      if (!invSnap.exists()) throw new Error('Investment not found');
      const invData = invSnap.data() as Investment;

      if (invData.status !== 'active') {
        throw new Error('Plan is no longer active');
      }

      // Update Task Balance exclusively (never Main Balance)
      t.update(userRef, {
        taskBalance: (uData.taskBalance || 0) + reward,
        lastTaskClaimTimestamp: nowMs,
        updatedAt: nowIso
      });

      t.update(invRef, {
        lastTaskClaimTimestamp: nowMs,
        totalEarned: (invData.totalEarned || 0) + reward
      });

      t.set(doc(db, 'transactions', txId), taskTx);
    });

    return {
      success: true,
      message: `₦${reward.toLocaleString('en-NG')} successfully claimed and credited to your Task Balance! (24-hour reset timer started)`
    };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, 'users');
    return { success: false, message: err?.message || 'Failed to claim task reward.' };
  }
}

// ----------------- PROFILE PICTURE ONLINE STORAGE -----------------

/**
 * Save user profile picture securely in Firestore online profile.
 * Restricts each user to editing only their own profile.
 */
export async function updateUserProfilePicture(
  uid: string,
  photoURL: string
): Promise<{ success: boolean; message: string }> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      photoURL,
      updatedAt: new Date().toISOString()
    });
    return { success: true, message: 'Profile picture updated successfully!' };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    return { success: false, message: 'Failed to update profile picture.' };
  }
}

/**
 * Remove user profile picture from online profile.
 */
export async function removeUserProfilePicture(
  uid: string
): Promise<{ success: boolean; message: string }> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      photoURL: '',
      updatedAt: new Date().toISOString()
    });
    return { success: true, message: 'Profile picture removed.' };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    return { success: false, message: 'Failed to remove profile picture.' };
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
    userEmail: user.email || user.phoneNumber || '',
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

// ----------------- PROMO CODE SYSTEM -----------------

// Validate a promo code through the backend
export async function validatePromoCode(rawCode: string): Promise<{
  valid: boolean;
  promoCode?: PromoCode;
  message: string;
}> {
  if (!rawCode || !rawCode.trim()) {
    return { valid: false, message: 'Please enter a promo code.' };
  }

  const code = rawCode.trim().toUpperCase();

  try {
    const promoRef = doc(db, 'promoCodes', code);
    const snap = await getDoc(promoRef);

    if (!snap.exists()) {
      return {
        valid: false,
        message: `Promo code "${code}" is invalid. Please verify spelling or leave the field blank.`
      };
    }

    const promo = snap.data() as PromoCode;

    if (!promo.active) {
      return {
        valid: false,
        message: `Promo code "${code}" is currently disabled.`
      };
    }

    if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
      return {
        valid: false,
        message: `Promo code "${code}" expired on ${new Date(promo.expiresAt).toLocaleDateString()}.`
      };
    }

    if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
      return {
        valid: false,
        message: `Promo code "${code}" has reached its maximum allowable uses (${promo.maxUses}).`
      };
    }

    return {
      valid: true,
      promoCode: promo,
      message: `Verified! Grants: ${promo.perkDescription}`
    };
  } catch (err: any) {
    return {
      valid: false,
      message: err?.message || 'Error communicating with central validation service.'
    };
  }
}

// Admin: Get all promo codes
export async function getPromoCodes(): Promise<PromoCode[]> {
  try {
    const snap = await getDocs(collection(db, 'promoCodes'));
    return snap.docs.map((d) => d.data() as PromoCode);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'promoCodes');
    return [];
  }
}

// Admin: Create or update promo code
export async function adminCreatePromoCode(
  data: Omit<PromoCode, 'currentUses' | 'createdAt'>
): Promise<void> {
  const code = data.code.trim().toUpperCase();
  const promoRef = doc(db, 'promoCodes', code);
  const now = new Date().toISOString();

  const newPromo: PromoCode = {
    ...data,
    id: code,
    code,
    currentUses: 0,
    createdAt: now
  };

  try {
    await setDoc(promoRef, newPromo, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `promoCodes/${code}`);
  }
}

// Admin: Toggle promo code active status
export async function adminTogglePromoCodeStatus(code: string, active: boolean): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  try {
    await updateDoc(doc(db, 'promoCodes', cleanCode), {
      active
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `promoCodes/${cleanCode}`);
  }
}

// Admin: Delete promo code
export async function adminDeletePromoCode(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  try {
    await deleteDoc(doc(db, 'promoCodes', cleanCode));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `promoCodes/${cleanCode}`);
  }
}

// Admin: Get promo code usage history
export async function getPromoCodeUsages(): Promise<PromoCodeUsage[]> {
  try {
    const snap = await getDocs(collection(db, 'promoCodeUsages'));
    return snap.docs
      .map((d) => d.data() as PromoCodeUsage)
      .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'promoCodeUsages');
    return [];
  }
}

// ----------------- DAILY TASKS & REWARDS -----------------

export async function claimDailyTask(
  user: UserProfile,
  task: DailyTask
): Promise<{ success: boolean; message: string }> {
  const currentCompleted = user.completedTaskIds || [];
  if (currentCompleted.includes(task.id)) {
    return { success: false, message: `You have already claimed today's reward for "${task.title}".` };
  }

  const now = new Date().toISOString();
  const reward = task.rewardNaira;
  const currentTaskBalance = user.taskBalance || 0;
  const newTaskBalance = currentTaskBalance + reward;
  const updatedCompleted = [...currentCompleted, task.id];

  const txId = `tx_task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const tx: Transaction = {
    id: txId,
    userId: user.uid,
    userEmail: user.email || '',
    userName: user.displayName,
    type: 'task_reward' as any,
    amount: reward,
    currency: 'NGN',
    status: 'completed',
    reference: `TASK-${task.id.toUpperCase()}-${Date.now().toString().slice(-4)}`,
    note: `Daily Task Reward: ${task.title}`,
    createdAt: now
  };

  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      taskBalance: newTaskBalance,
      completedTaskIds: updatedCompleted,
      updatedAt: now
    });

    await setDoc(doc(db, 'transactions', txId), tx);

    return {
      success: true,
      message: `₦${reward.toLocaleString('en-NG')} successfully credited to your Task Balance!`
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    return { success: false, message: 'Failed to record task reward.' };
  }
}

export async function transferTaskBalanceToMain(
  user: UserProfile,
  amount: number
): Promise<{ success: boolean; message: string }> {
  const currentTaskBal = user.taskBalance || 0;
  if (amount <= 0) {
    return { success: false, message: 'Transfer amount must be greater than zero.' };
  }
  if (amount > currentTaskBal) {
    return {
      success: false,
      message: `Insufficient Task Balance (Available: ₦${currentTaskBal.toLocaleString('en-NG')}).`
    };
  }

  const now = new Date().toISOString();
  const newMainBal = (user.balance || 0) + amount;
  const newTaskBal = currentTaskBal - amount;

  const txId = `tx_transfer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const tx: Transaction = {
    id: txId,
    userId: user.uid,
    userEmail: user.email || '',
    userName: user.displayName,
    type: 'admin_adjustment',
    amount: amount,
    currency: 'NGN',
    status: 'completed',
    reference: `TRF-${Date.now().toString().slice(-6)}`,
    note: `Transfer from Task Balance into Main Liquid Wallet`,
    createdAt: now
  };

  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      balance: newMainBal,
      taskBalance: newTaskBal,
      updatedAt: now
    });

    await setDoc(doc(db, 'transactions', txId), tx);

    return {
      success: true,
      message: `Successfully transferred ₦${amount.toLocaleString('en-NG')} to your Main Balance!`
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    return { success: false, message: 'Failed to transfer balance.' };
  }
}


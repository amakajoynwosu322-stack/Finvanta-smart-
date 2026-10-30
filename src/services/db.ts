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
  PromoCodeUsage
} from '../types';
import {
  normalizePhoneNumber,
  sha256Hex,
  hashPassword,
  verifyPassword,
  generateSecureOtp,
  validatePasswordStrength
} from './crypto';

export const BOOTSTRAP_ADMIN_EMAIL = 'amakajoynwosu322@gmail.com';
export const BOOTSTRAP_ADMIN_PHONE = '+2348000000001';
export const BOOTSTRAP_ADMIN_UID = 'adm_finvanta_root_001';

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
  platformName: 'FINVANTA',
  minDeposit: 50,
  minWithdrawal: 25,
  withdrawalFeePercentage: 1.5,
  referralBonusPercentage: 7.0,
  maintenanceMode: false,
  allowNewRegistrations: true,
  usdtTrc20Address: 'TN7zK4qP89FinvantaTRC20Official94bX',
  btcAddress: 'bc1q9finvantaapexinvestments8492048hqf02k7z',
  ethAddress: '0x8B5CF6d090711FinvantaMainnetVault92a',
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
    userEmail: user.email || user.phoneNumber || '',
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
    userEmail: user.email || user.phoneNumber || '',
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
    userEmail: user.email || user.phoneNumber || '',
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
    userEmail: user.email || user.phoneNumber || '',
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

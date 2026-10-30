import { getSupabaseClient, isSupabaseConfigured } from './client';
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

export const supabaseServices = {
  // Check readiness
  isConfigured: () => isSupabaseConfigured,

  // User Profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return {
      uid: data.id,
      firstName: data.first_name || data.display_name?.split(' ')[0] || '',
      lastName: data.last_name || data.display_name?.split(' ').slice(1).join(' ') || '',
      phoneNumber: data.phone_number || data.phone || '',
      countryCode: data.country_code || '+234',
      email: data.email,
      displayName: data.display_name,
      photoURL: data.photo_url,
      role: data.role,
      balance: Number(data.balance),
      totalInvested: Number(data.total_invested),
      totalEarned: Number(data.total_earned),
      totalWithdrawn: Number(data.total_withdrawn),
      totalDeposited: Number(data.total_deposited),
      referralCode: data.referral_code,
      referredBy: data.referred_by,
      twoFactorEnabled: data.two_factor_enabled,
      status: data.status,
      kycStatus: data.kyc_status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  // Investment Plans
  async getInvestmentPlans(): Promise<InvestmentPlan[]> {
    if (!isSupabaseConfigured) return [];
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('investment_plans')
      .select('*')
      .eq('active', true)
      .order('min_deposit', { ascending: true });

    if (error || !data) return [];
    return data.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      minDeposit: Number(p.min_deposit),
      maxDeposit: Number(p.max_deposit),
      dailyRoi: Number(p.daily_roi),
      totalRoi: Number(p.total_roi),
      durationDays: p.duration_days,
      riskLevel: p.risk_level,
      capitalReturn: p.capital_return,
      active: p.active,
      features: Array.isArray(p.features) ? p.features : [],
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));
  },

  // Execute Plan Investment via Atomic RPC
  async executePlanInvestment(planId: string, amount: number): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, message: 'Supabase is not configured yet.' };
    }
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('execute_plan_investment', {
      p_plan_id: planId,
      p_amount: amount
    });

    if (error) {
      return { success: false, message: error.message };
    }
    return data;
  },

  // Admin Approve Deposit via Atomic RPC
  async adminApproveDeposit(requestId: string): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, message: 'Supabase is not configured yet.' };
    }
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('admin_approve_deposit_request', {
      p_request_id: requestId
    });

    if (error) {
      return { success: false, message: error.message };
    }
    return data;
  }
};

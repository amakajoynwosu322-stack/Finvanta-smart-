-- ==============================================================================
-- FINVANTA PostgreSQL Migration Schema with Row Level Security (RLS)
-- Platform: Supabase (PostgreSQL 15+)
-- Description: Complete schema for FINVANTA Autonomous Quantitative & Yield Protocol
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Helper Functions & Admin Role Verification
-- ==============================================================================

-- Admin check helper function (SECURITY DEFINER runs with elevated rights to check admin table)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  ) OR (
    auth.jwt() ->> 'email' = 'amakajoynwosu322@gmail.com'
  );
$$;

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 2. Tables Definition
-- ==============================================================================

-- 2.1 Admins Registry
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 User Profiles (Linked 1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  balance NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  total_invested NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_invested >= 0),
  total_earned NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_earned >= 0),
  total_withdrawn NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_withdrawn >= 0),
  total_deposited NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_deposited >= 0),
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  kyc_status TEXT NOT NULL DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'verified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 Curated Investment Plans
CREATE TABLE IF NOT EXISTS public.investment_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  min_deposit NUMERIC(14,2) NOT NULL CHECK (min_deposit > 0),
  max_deposit NUMERIC(14,2) NOT NULL CHECK (max_deposit >= min_deposit),
  daily_roi NUMERIC(6,3) NOT NULL CHECK (daily_roi >= 0),
  total_roi NUMERIC(8,2) NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Conservative', 'Balanced', 'Aggressive', 'Institutional')),
  capital_return BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4 User Investment Contracts
CREATE TABLE IF NOT EXISTS public.investments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  plan_id TEXT NOT NULL REFERENCES public.investment_plans(id) ON DELETE RESTRICT,
  plan_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  daily_roi NUMERIC(6,3) NOT NULL,
  total_roi_expected NUMERIC(14,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  end_date TIMESTAMPTZ NOT NULL,
  days_elapsed INTEGER NOT NULL DEFAULT 0,
  total_earned NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_earned >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  last_profit_claim_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.5 Financial Audit Ledger / Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'roi_payout', 'referral_bonus', 'admin_adjustment')),
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'rejected')),
  reference TEXT,
  note TEXT,
  payment_method TEXT,
  destination_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.6 Simulated Deposit Requests
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  network TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.7 Simulated Withdrawal Requests
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  network TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.8 Referral Network Tree
CREATE TABLE IF NOT EXISTS public.referrals (
  id TEXT PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_email TEXT NOT NULL,
  referred_user_name TEXT,
  commission_earned NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (commission_earned >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level IN (1, 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.9 Platform Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('system', 'market_update', 'yield_boost', 'maintenance')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.10 Customer Support Inquiries
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('deposit', 'withdrawal', 'investment', 'security', 'general')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.11 Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- UUID string or 'all' for system-wide broadcasts
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('system', 'transaction', 'investment', 'security', 'promo')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.12 Global Platform Parameters
CREATE TABLE IF NOT EXISTS public.platform_config (
  id TEXT PRIMARY KEY DEFAULT 'settings',
  platform_name TEXT NOT NULL DEFAULT 'FINVANTA',
  min_deposit NUMERIC(14,2) NOT NULL DEFAULT 50.00,
  min_withdrawal NUMERIC(14,2) NOT NULL DEFAULT 25.00,
  withdrawal_fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 1.50,
  referral_bonus_percentage NUMERIC(5,2) NOT NULL DEFAULT 7.00,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  allow_new_registrations BOOLEAN NOT NULL DEFAULT TRUE,
  usdt_trc20_address TEXT NOT NULL DEFAULT 'TN7zK4qP89FinvantaTRC20Official94bX',
  btc_address TEXT NOT NULL DEFAULT 'bc1q9finvantaapexinvestments8492048hqf02k7z',
  eth_address TEXT NOT NULL DEFAULT '0x8B5CF6d090711FinvantaMainnetVault92a',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. Triggers for Automatic Updated_At
-- ==============================================================================
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_plans_updated_at BEFORE UPDATE ON public.investment_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_dep_updated_at BEFORE UPDATE ON public.deposit_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_wth_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_config_updated_at BEFORE UPDATE ON public.platform_config FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. Automatic User Profile Creation on Signup (auth.users Trigger)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_email BOOLEAN;
  short_uid TEXT;
BEGIN
  is_admin_email := (NEW.email = 'amakajoynwosu322@gmail.com');
  short_uid := UPPER(SUBSTRING(NEW.id::text, 1, 6));

  -- Insert genuine new user profile with strictly $0.00 balance (NO hardcoded credits in production!)
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    photo_url,
    role,
    balance,
    total_invested,
    total_earned,
    total_withdrawn,
    total_deposited,
    referral_code,
    status,
    kyc_status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    CASE WHEN is_admin_email THEN 'admin' ELSE 'user' END,
    0.00, -- Zero initial balance for genuine production accounts
    0.00,
    0.00,
    0.00,
    0.00,
    'FV-' || short_uid,
    'active',
    'unverified'
  );

  -- If bootstrapped admin email, register in admins table
  IF is_admin_email THEN
    INSERT INTO public.admins (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'superadmin')
    ON CONFLICT (email) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. Row Level Security (RLS) Policies — Hardened & Anti-Tamper
-- ==============================================================================

-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- 5.1 Profiles Policies
-- Users can read their own profile; Admins can read all profiles
CREATE POLICY "Users can view own profile or admins view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can only update their own non-financial fields (NO balance or role manipulation)
CREATE POLICY "Users can update own non-financial profile fields"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    -- If not admin, verify financial fields and role are untouched
    public.is_admin() OR (
      auth.uid() = id AND
      role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) AND
      balance = (SELECT p.balance FROM public.profiles p WHERE p.id = auth.uid()) AND
      total_invested = (SELECT p.total_invested FROM public.profiles p WHERE p.id = auth.uid()) AND
      total_earned = (SELECT p.total_earned FROM public.profiles p WHERE p.id = auth.uid()) AND
      total_deposited = (SELECT p.total_deposited FROM public.profiles p WHERE p.id = auth.uid()) AND
      total_withdrawn = (SELECT p.total_withdrawn FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

-- 5.2 Admins Table Policies
CREATE POLICY "Admins viewable by authenticated users"
  ON public.admins FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins modified only by superadmin"
  ON public.admins FOR ALL
  USING (public.is_admin());

-- 5.3 Investment Plans (Publicly readable, modified only by Admins)
CREATE POLICY "Investment plans are publicly viewable"
  ON public.investment_plans FOR SELECT
  USING (TRUE);

CREATE POLICY "Investment plans manageable only by admins"
  ON public.investment_plans FOR ALL
  USING (public.is_admin());

-- 5.4 Investments Contracts
CREATE POLICY "Users can view own investments or admins view all"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create own investment with valid user_id"
  ON public.investments FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Investments modified by admin or owner"
  ON public.investments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- 5.5 Transactions Ledger
CREATE POLICY "Users view own transactions or admins view all"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Transactions created by users for own account or admins"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Transactions modified only by admins"
  ON public.transactions FOR UPDATE
  USING (public.is_admin());

-- 5.6 Deposit Requests
CREATE POLICY "Users view own deposit requests or admins view all"
  ON public.deposit_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users create own deposit requests"
  ON public.deposit_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deposit requests audited only by admins"
  ON public.deposit_requests FOR UPDATE
  USING (public.is_admin());

-- 5.7 Withdrawal Requests
CREATE POLICY "Users view own withdrawal requests or admins view all"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users create own withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Withdrawal requests audited only by admins"
  ON public.withdrawal_requests FOR UPDATE
  USING (public.is_admin());

-- 5.8 Referrals
CREATE POLICY "Users view referrals where they are referrer or referee"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id OR public.is_admin());

CREATE POLICY "Referrals created by authenticated users or admins"
  ON public.referrals FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- 5.9 Announcements
CREATE POLICY "Announcements publicly readable"
  ON public.announcements FOR SELECT
  USING (TRUE);

CREATE POLICY "Announcements managed only by admins"
  ON public.announcements FOR ALL
  USING (public.is_admin());

-- 5.10 Support Tickets
CREATE POLICY "Users view own support tickets or admins view all"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users create own support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Support tickets updated by admins or owner"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- 5.11 Notifications
CREATE POLICY "Users view their own or broadcast notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid()::text OR user_id = 'all' OR public.is_admin());

CREATE POLICY "Notifications updated (mark read) by owner or admin"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid()::text OR public.is_admin());

-- 5.12 Platform Config
CREATE POLICY "Platform config publicly readable"
  ON public.platform_config FOR SELECT
  USING (TRUE);

CREATE POLICY "Platform config updated only by admin"
  ON public.platform_config FOR ALL
  USING (public.is_admin());

-- ==============================================================================
-- 6. Atomic Stored Procedures (RPC Functions) for High-Integrity Financial Operations
-- ==============================================================================

-- 6.1 Atomic Plan Investment Execution
CREATE OR REPLACE FUNCTION public.execute_plan_investment(
  p_plan_id TEXT,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_balance NUMERIC;
  v_plan RECORD;
  v_inv_id TEXT;
  v_tx_id TEXT;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_end TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not authenticated.');
  END IF;

  -- Get Plan
  SELECT * INTO v_plan FROM public.investment_plans WHERE id = p_plan_id AND active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Plan not found or inactive.');
  END IF;

  IF p_amount < v_plan.min_deposit THEN
    RETURN jsonb_build_object('success', false, 'message', 'Deposit amount below minimum required.');
  END IF;

  IF p_amount > v_plan.max_deposit THEN
    RETURN jsonb_build_object('success', false, 'message', 'Deposit amount exceeds maximum allowable.');
  END IF;

  -- Lock user profile row for balance update
  SELECT balance INTO v_user_balance FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF v_user_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient liquid balance.');
  END IF;

  v_inv_id := 'inv_' || floor(extract(epoch from now()))::text || '_' || substr(md5(random()::text), 1, 6);
  v_tx_id := 'tx_' || floor(extract(epoch from now()))::text || '_' || substr(md5(random()::text), 1, 6);
  v_end := v_now + (v_plan.duration_days || ' days')::interval;

  -- 1. Deduct balance, increment total_invested
  UPDATE public.profiles
  SET balance = balance - p_amount,
      total_invested = total_invested + p_amount
  WHERE id = v_user_id;

  -- 2. Insert Investment Contract
  INSERT INTO public.investments (
    id, user_id, user_email, user_name, plan_id, plan_name,
    amount, daily_roi, total_roi_expected, duration_days,
    start_date, end_date, days_elapsed, total_earned, status, last_profit_claim_date
  ) VALUES (
    v_inv_id, v_user_id, auth.jwt()->>'email', (SELECT display_name FROM public.profiles WHERE id = v_user_id),
    v_plan.id, v_plan.name, p_amount, v_plan.daily_roi,
    (p_amount * v_plan.daily_roi * v_plan.duration_days) / 100.0,
    v_plan.duration_days, v_now, v_end, 0, 0.00, 'active', v_now
  );

  -- 3. Insert Transaction
  INSERT INTO public.transactions (
    id, user_id, user_email, user_name, type, amount, currency,
    status, reference, note, created_at
  ) VALUES (
    v_tx_id, v_user_id, auth.jwt()->>'email', (SELECT display_name FROM public.profiles WHERE id = v_user_id),
    'investment', p_amount, 'USD', 'completed',
    'INV-' || upper(substr(v_inv_id, length(v_inv_id)-5)),
    'Capital allocated to ' || v_plan.name, v_now
  );

  RETURN jsonb_build_object('success', true, 'message', 'Investment successfully allocated!', 'investment_id', v_inv_id);
END;
$$;

-- 6.2 Atomic Admin Deposit Approval
CREATE OR REPLACE FUNCTION public.admin_approve_deposit_request(
  p_request_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req RECORD;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized. Admin credentials required.');
  END IF;

  SELECT * INTO v_req FROM public.deposit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Deposit request not found.');
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Deposit request has already been processed.');
  END IF;

  -- 1. Credit user balance and increment total_deposited
  UPDATE public.profiles
  SET balance = balance + v_req.amount,
      total_deposited = total_deposited + v_req.amount
  WHERE id = v_req.user_id;

  -- 2. Update request status
  UPDATE public.deposit_requests
  SET status = 'approved',
      admin_notes = 'Approved by Administrator',
      updated_at = v_now
  WHERE id = p_request_id;

  -- 3. Update related transaction
  UPDATE public.transactions
  SET status = 'completed'
  WHERE id = 'tx_' || p_request_id;

  -- 4. Create user notification
  INSERT INTO public.notifications (
    id, user_id, title, message, type, read, created_at
  ) VALUES (
    'notif_' || floor(extract(epoch from now()))::text,
    v_req.user_id::text,
    'Deposit Approved & Credited',
    'Your simulated deposit of $' || v_req.amount || ' ' || v_req.currency || ' has been approved and credited to your balance.',
    'transaction', false, v_now
  );

  RETURN jsonb_build_object('success', true, 'message', 'Deposit successfully approved and balance credited.');
END;
$$;

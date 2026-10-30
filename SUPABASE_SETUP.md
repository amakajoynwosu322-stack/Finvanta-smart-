# Supabase PostgreSQL Migration & Setup Guide — FINVANTA

This guide documents the complete database migration for **FINVANTA** to a self-hosted or cloud **Supabase PostgreSQL** instance with Row Level Security (RLS).

---

## 1. Quick Setup via Supabase Web Dashboard

1. **Create or Open a Supabase Project**:
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard).
   - Create a new project named `FINVANTA` and copy your database password.

2. **Execute Schema Migration**:
   - Navigate to the **SQL Editor** in your Supabase dashboard.
   - Click **"New Query"**.
   - Copy and paste the entire contents of `supabase/migrations/20261030000001_finvanta_schema.sql`.
   - Click **Run**. This will create all 12 tables, indexes, automatic triggers, RLS policies, and stored procedures.

3. **Execute Seed Data**:
   - In a new query in the **SQL Editor**, paste the contents of `supabase/seed.sql`.
   - Click **Run** to populate initial investment plans, announcements, and platform parameters.

4. **Retrieve API Credentials**:
   - Navigate to **Project Settings > API**.
   - Copy:
     - **Project URL** (e.g., `https://abcdefghijklm.supabase.co`)
     - **anon / public key** (safe for client-side frontend code)
   - *CRITICAL:* Never expose your `service_role` key in frontend code!

5. **Configure Environment Variables in Netlify or `.env`**:
   Add the following to your environment:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-public-key"
   ```

---

## 2. Setup via Supabase CLI

If you use the Supabase CLI for automated CI/CD deployments:

1. **Link to your remote project**:
   ```bash
   npx supabase login
   npx supabase link --project-ref your-project-ref
   ```

2. **Apply migration**:
   ```bash
   npx supabase db push
   ```

3. **Apply seed data**:
   ```bash
   npx supabase db reset --linked
   # or run seed script directly:
   psql -h db.your-project-ref.supabase.co -U postgres -d postgres -f supabase/seed.sql
   ```

---

## 3. Row Level Security (RLS) Matrix

Every single table in FINVANTA is protected with RLS:

| Table | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy |
|-------|---------------|---------------|---------------|---------------|
| `profiles` | Owner or Admin | Auth Trigger only | Owner (safe non-financial fields only) or Admin | Admin |
| `admins` | Authenticated users | Admin only | Admin only | Admin only |
| `investment_plans` | Public | Admin only | Admin only | Admin only |
| `investments` | Owner or Admin | Owner with valid user_id | Owner or Admin | Admin |
| `transactions` | Owner or Admin | Owner or Admin | Admin only | Admin only |
| `deposit_requests` | Owner or Admin | Owner (`auth.uid() = user_id`) | Admin only | Admin |
| `withdrawal_requests` | Owner or Admin | Owner (`auth.uid() = user_id`) | Admin only | Admin |
| `referrals` | Referrer / Referee / Admin | Authenticated | Admin only | Admin |
| `announcements` | Public | Admin only | Admin only | Admin only |
| `support_tickets` | Owner or Admin | Owner (`auth.uid() = user_id`) | Owner or Admin | Admin |
| `notifications` | Owner or Admin | Admin or System | Owner (mark read only) | Owner or Admin |
| `platform_config` | Public | Admin only | Admin only | Admin only |

---

## 4. Bootstrapped Administrator Account

The database migration automatically assigns Superadmin privileges to `amakajoynwosu322@gmail.com` when the user authenticates with Supabase Auth or Google OAuth.

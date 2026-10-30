# FINVANTA — Autonomous Quantitative & Yield Investment Protocol

FINVANTA is an institutional-grade, futuristic investment web application featuring autonomous algorithmic trading vaults, multi-tier yield strategies, real-time analytics, and dual-backend support (Firebase Cloud Firestore + Supabase PostgreSQL).

---

## Key Highlights & Architecture

- **TradUp-Inspired Dark Purple Aesthetic**:
  - Background: `#090711`
  - Elevated Cards: `#171225`
  - Primary Purple: `#8B5CF6`
  - Neon Accent Purple: `#B66DFF`
  - Glassmorphic panels, glowing borders (`glow-purple`), subtle gradients, and mobile-first responsive layout.

- **Dual-Backend Ready**:
  1. **Firebase Authentication & Cloud Firestore**: Fully wired with hardened security rules (`firestore.rules`), sub-collection relational checks, role-based administration, and error handlers.
  2. **Supabase PostgreSQL & Row Level Security (RLS)**: Complete migration scripts in `supabase/migrations/` and seed data in `supabase/seed.sql` with zero-trust RLS on all 12 tables.

- **Netlify Production Deployment**:
  - `netlify.toml` pre-configured with SPA client-side fallback redirects and HTTP security headers.
  - `public/_redirects` for standard Netlify routing.
  - Step-by-step documentation in `NETLIFY_DEPLOYMENT.md`.

- **Strict Sandbox / Simulation Model**:
  - All financial activity (deposits, investments, yield payouts, withdrawals) operates strictly in **Simulation Mode**.
  - No real-money transactions or real banking rails are connected.
  - Genuine accounts initialize strictly with **$0.00** balance (no arbitrary hardcoded credits in production).

---

## Project Structure

```
├── .env.example                               # Environment variable templates
├── DEPLOYMENT.md                              # Deployment checklist
├── NETLIFY_DEPLOYMENT.md                      # Netlify deployment walkthrough
├── SUPABASE_SETUP.md                          # Supabase PostgreSQL & RLS setup
├── netlify.toml                               # Netlify build and routing configuration
├── firestore.rules                            # Hardened Firebase security rules
├── firebase-blueprint.json                    # Intermediate schema representation
├── security_spec.md                           # Security specifications and tests
├── public/
│   ├── _redirects                             # Netlify SPA redirect rule
│   └── finvanta-project.zip                   # Pre-compiled project download archive
├── scripts/
│   └── build-zip.js                           # Node JSZip archive generator
├── supabase/
│   ├── migrations/
│   │   └── 20261030000001_finvanta_schema.sql # Complete PostgreSQL DDL + RLS
│   └── seed.sql                               # Seed plans, config, and announcements
└── src/
    ├── components/
    │   ├── admin/
    │   │   └── AdminDashboard.tsx             # 8-module administrative suite
    │   ├── auth/
    │   │   └── AuthModal.tsx                  # Google Sign-in & Sandbox personas
    │   ├── common/
    │   │   └── SimulatedBanner.tsx            # Clear simulation notice
    │   ├── layout/
    │   │   ├── Navbar.tsx                     # Top ticker, role switcher & ZIP export
    │   │   └── Sidebar.tsx                    # 13 user tabs & admin navigation
    │   └── user/
    │       ├── OverviewTab.tsx                # Metric cards & SVG trajectory curve
    │       ├── PortfolioTab.tsx               # Asset allocation & compound simulator
    │       ├── AvailableBalanceTab.tsx        # Liquid vs. locked capital structure
    │       ├── InvestmentPlansTab.tsx         # ROI calculator & strategy allocation
    │       ├── MyInvestmentsTab.tsx           # Contract countdown & harvest trigger
    │       ├── TransactionHistoryTab.tsx      # Cryptographic ledger & receipt viewer
    │       ├── DepositTab.tsx                 # Simulated crypto gateway (QR/network)
    │       ├── WithdrawalTab.tsx              # Simulated payout desk & gas calculation
    │       ├── ReferralTab.tsx                # 2-tier affiliate network & link generator
    │       ├── NotificationsTab.tsx           # Alert dispatch & mark-read controls
    │       ├── ProfileTab.tsx                 # KYC identity clearance simulator
    │       ├── SecurityTab.tsx                # TOTP 2FA key & active terminal sessions
    │       └── SupportTab.tsx                 # Inquiry tickets & FAQ knowledge base
    ├── context/
    │   └── AuthContext.tsx                    # Authentication & dual-engine state
    ├── firebase/
    │   └── config.ts                          # Firebase SDK initialization
    ├── supabase/
    │   ├── client.ts                          # Supabase client with detection
    │   └── services.ts                        # Typed Supabase queries and RPCs
    ├── services/
    │   └── db.ts                              # Firestore data services
    └── types/
        └── index.ts                           # Unified TypeScript interfaces
```

---

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

4. **Generate Project ZIP Archive**:
   ```bash
   node scripts/build-zip.js
   ```

---

## Authentication & Personas

- **Google Sign-In**: Uses Firebase Auth popup flow.
- **Evaluation Personas**:
  - **Demo Investor**: Alex Chen (`alex.chen@finvanta.internal`) with sample portfolio allocations for immediate evaluation.
  - **Superadmin**: Amaka Joy Nwosu (`amakajoynwosu322@gmail.com`) with full administrative rights to user management, deposit/withdrawal queues, and platform settings.

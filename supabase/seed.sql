-- ==============================================================================
-- FINVANTA Supabase Seed Data
-- ==============================================================================

-- 1. Seed Investment Plans
INSERT INTO public.investment_plans (
  id, name, description, category, min_deposit, max_deposit,
  daily_roi, total_roi, duration_days, risk_level, capital_return, active, features
) VALUES 
(
  'plan_quantum_alpha',
  'Quantum Alpha Momentum',
  'Dynamic automated order-flow quantitative strategies capturing micro-arbitrage across global digital exchanges.',
  'High Frequency Algorithmic',
  100.00,
  4999.00,
  1.500,
  45.00,
  30,
  'Conservative',
  TRUE,
  TRUE,
  '["Automated 24/7 rebalancing", "Capital guarantee at term end", "Daily compound capability", "Zero withdrawal fee on maturity", "Full transparency telemetry"]'::jsonb
),
(
  'plan_neural_arbitrage',
  'Neural Yield Arbitrage',
  'Multi-pool flash liquidity providing and cross-venue latency arbitrage leveraging sub-millisecond execution engines.',
  'Cross-Chain DeFi & Spread',
  5000.00,
  24999.00,
  2.200,
  99.00,
  45,
  'Balanced',
  TRUE,
  TRUE,
  '["Institutional tier priority queues", "Smart contract audited routing", "Daily automated profit accrual", "Dedicated quantitative risk manager", "100% principal return guarantee"]'::jsonb
),
(
  'plan_apex_institutional',
  'Apex Sovereign Matrix',
  'Bespoke liquidity provision, derivatives gamma scalping, and volatility arbitrage for high-volume capital portfolios.',
  'Institutional Market Making',
  25000.00,
  250000.00,
  3.100,
  186.00,
  60,
  'Aggressive',
  TRUE,
  TRUE,
  '["VIP Tier 1 priority settlement", "Deep order-book rebate capture", "Daily instant withdrawals", "Direct OTC desk access", "Comprehensive audit logs"]'::jsonb
),
(
  'plan_defi_perpetuals',
  'Perpetuals Quant Syndicate',
  'Algorithmic delta-neutral basis trading harvesting perpetual funding rates while neutralizing directional market volatility.',
  'Delta-Neutral Futures',
  500.00,
  15000.00,
  1.850,
  74.00,
  40,
  'Balanced',
  TRUE,
  TRUE,
  '["Hedging across Binance & Bybit perp basis", "Zero liquidation risk delta-neutral hedge", "Daily ROI automatic distribution", "Mid-term flexible reinvestment", "24/7 Live liquidation shields"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  daily_roi = EXCLUDED.daily_roi,
  total_roi = EXCLUDED.total_roi,
  updated_at = timezone('utc'::text, now());

-- 2. Seed Default Platform Configuration
INSERT INTO public.platform_config (
  id, platform_name, min_deposit, min_withdrawal,
  withdrawal_fee_percentage, referral_bonus_percentage,
  maintenance_mode, allow_new_registrations,
  usdt_trc20_address, btc_address, eth_address
) VALUES (
  'settings',
  'FINVANTA',
  50.00,
  25.00,
  1.50,
  7.00,
  FALSE,
  TRUE,
  'TN7zK4qP89FinvantaTRC20Official94bX',
  'bc1q9finvantaapexinvestments8492048hqf02k7z',
  '0x8B5CF6d090711FinvantaMainnetVault92a'
)
ON CONFLICT (id) DO UPDATE SET
  platform_name = EXCLUDED.platform_name,
  updated_at = timezone('utc'::text, now());

-- 3. Seed Default Announcements
INSERT INTO public.announcements (
  id, title, content, category, priority, active, author
) VALUES 
(
  'ann_finvanta_v5',
  'FINVANTA v5.0 Quantum Engine Live',
  'Our latest neural arbitrage execution protocol is active across Tier-1 liquidity bridges. Daily ROI payouts execute synchronously every 24 hours.',
  'yield_boost',
  'urgent',
  TRUE,
  'Chief Quantitative Architect'
),
(
  'ann_security_audit',
  'Autonomous Security & Smart Contract Audits Completed',
  'All algorithmic vaults have been audited and re-collateralized. Simulated withdrawals and deposits process with zero downtime.',
  'system',
  'normal',
  TRUE,
  'Platform Infrastructure Team'
)
ON CONFLICT (id) DO NOTHING;

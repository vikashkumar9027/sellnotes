-- =========================================================================
-- MIGRATION: 20260913_wallet_and_superadmin.sql
-- NoteMart Seller Wallet Ledger, Razorpay Route & Super Admin Migration
-- Run this in Supabase SQL Editor to provision immutable financial ledger tables
-- =========================================================================

-- 1. UPDATE SYSTEM SETTINGS TABLE WITH ROUTE & COMMISSION DEFAULTS
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS route_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS settlement_delay_days INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withdrawal_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS seller_registration_enabled BOOLEAN DEFAULT true;

-- Set default platform commission to 25% (75% Seller Net)
UPDATE public.system_settings
SET platform_commission = 25.00
WHERE id = 1;

-- 2. SELLER ACCOUNTS TABLE (RAZORPAY ROUTE LINKED ACCOUNTS)
CREATE TABLE IF NOT EXISTS public.seller_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  razorpay_account_id TEXT,
  legal_business_name TEXT NOT NULL,
  business_type TEXT DEFAULT 'individual',
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  bank_account_number_last4 TEXT,
  bank_ifsc TEXT,
  account_holder_name TEXT,
  upi_vpa TEXT,
  onboarding_status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (onboarding_status IN ('NOT_STARTED', 'PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
  kyc_status TEXT DEFAULT 'NOT_SUBMITTED',
  bank_status TEXT DEFAULT 'NOT_LINKED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WALLETS TABLE (INTEGER PAISE PRECISION)
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  currency TEXT DEFAULT 'INR',
  available_balance_paise BIGINT DEFAULT 0 NOT NULL,
  pending_balance_paise BIGINT DEFAULT 0 NOT NULL,
  total_earned_paise BIGINT DEFAULT 0 NOT NULL,
  total_withdrawn_paise BIGINT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WALLET TRANSACTIONS TABLE (IMMUTABLE FINANCIAL LEDGER)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'SALE_CREDIT',
    'WITHDRAWAL_DEBIT',
    'WITHDRAWAL_REVERSAL',
    'REFUND_DEBIT',
    'ADJUSTMENT',
    'TRANSFER_HOLD',
    'TRANSFER_SETTLED'
  )),
  amount_paise BIGINT NOT NULL,
  balance_before_paise BIGINT NOT NULL,
  balance_after_paise BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'AVAILABLE', 'COMPLETED', 'FAILED', 'REVERSED', 'CANCELLED')),
  reference_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_transfer_id TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYMENT TRANSFERS TABLE (RAZORPAY ROUTE SPLITS)
CREATE TABLE IF NOT EXISTS public.payment_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id TEXT NOT NULL,
  transfer_id TEXT UNIQUE,
  seller_account_id TEXT NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount_paise BIGINT NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'REVERSED')),
  error_code TEXT,
  error_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id TEXT PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  fee_paise BIGINT DEFAULT 0,
  payout_method TEXT NOT NULL CHECK (payout_method IN ('razorpay_route', 'bank_transfer', 'upi')),
  payout_details TEXT NOT NULL,
  razorpay_payout_id TEXT,
  razorpay_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED', 'CANCELLED')),
  failure_reason TEXT,
  admin_note TEXT,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WEBHOOK EVENTS TABLE (STRICT IDEMPOTENCY)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  ip_address TEXT,
  user_agent TEXT,
  result TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR SCALE & SPEED
CREATE INDEX IF NOT EXISTS idx_wallets_seller ON public.wallets(seller_id);
CREATE INDEX IF NOT EXISTS idx_wtx_seller ON public.wallet_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_wtx_type ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wtx_reference ON public.wallet_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_seller_accounts_seller ON public.seller_accounts(seller_id);
CREATE INDEX IF NOT EXISTS idx_transfers_payment ON public.payment_transfers(payment_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.seller_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Sellers view own seller account" ON public.seller_accounts FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers update own seller account" ON public.seller_accounts FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers view own wallet transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers view own withdrawal requests" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers submit own withdrawal requests" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- NoteMart PostgreSQL Database Schema
-- Run this in Supabase SQL Editor to set up tables, RLS policies, indexes, and initial triggers.

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  college TEXT,
  university TEXT,
  course TEXT,
  semester TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'seller', 'admin')),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  subject TEXT NOT NULL,
  university TEXT NOT NULL,
  college TEXT,
  course TEXT NOT NULL,
  semester TEXT NOT NULL,
  year TEXT,
  language TEXT DEFAULT 'English',
  tags TEXT[] DEFAULT '{}',
  pdf_path TEXT NOT NULL,
  preview_path TEXT,
  thumbnail_url TEXT,
  file_size BIGINT DEFAULT 0,
  page_count INT DEFAULT 1,
  price NUMERIC(10, 2) DEFAULT 0.00,
  is_free BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  downloads INT DEFAULT 0,
  views INT DEFAULT 0,
  average_rating NUMERIC(3, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PURCHASES TABLE
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) NOT NULL,
  seller_amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_buyer_note UNIQUE (buyer_id, note_id)
);

-- 6. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_note_review UNIQUE (user_id, note_id)
);

-- 7. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_wishlist UNIQUE (user_id, note_id)
);

-- 8. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'bank_transfer')),
  payment_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  platform_commission NUMERIC(5, 2) DEFAULT 25.00,
  min_note_price NUMERIC(10, 2) DEFAULT 0.00,
  max_note_price NUMERIC(10, 2) DEFAULT 2000.00,
  min_withdrawal_amount NUMERIC(10, 2) DEFAULT 100.00,
  max_pdf_size_mb INT DEFAULT 5120,
  auto_approval BOOLEAN DEFAULT false,
  maintenance_mode BOOLEAN DEFAULT false,
  route_enabled BOOLEAN DEFAULT false,
  settlement_delay_days INT DEFAULT 0,
  withdrawal_enabled BOOLEAN DEFAULT true,
  seller_registration_enabled BOOLEAN DEFAULT true,
  website_name TEXT DEFAULT 'NoteMart',
  website_logo TEXT DEFAULT '/logo.svg',
  support_email TEXT DEFAULT 'support@notemart.edu',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Insert default system settings
INSERT INTO public.system_settings (id, platform_commission, min_note_price, max_note_price, min_withdrawal_amount, max_pdf_size_mb, route_enabled, withdrawal_enabled)
VALUES (1, 25.00, 0.00, 2000.00, 100.00, 5120, false, true)
ON CONFLICT (id) DO UPDATE SET platform_commission = 25.00, max_pdf_size_mb = 5120;


-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_notes_seller ON public.notes(seller_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON public.notes(category_id);
CREATE INDEX IF NOT EXISTS idx_notes_status ON public.notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_subject ON public.notes(subject);
CREATE INDEX IF NOT EXISTS idx_notes_university ON public.notes(university);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON public.purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_seller ON public.purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchases_note ON public.purchases(note_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON public.transactions(razorpay_order_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS: PROFILES
CREATE POLICY "Public profiles read access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS: CATEGORIES
CREATE POLICY "Public category read access" ON public.categories FOR SELECT USING (true);

-- RLS: NOTES
CREATE POLICY "Public note read access for approved notes" ON public.notes FOR SELECT USING (status = 'approved' OR seller_id = auth.uid());
CREATE POLICY "Sellers can insert own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own notes" ON public.notes FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own notes" ON public.notes FOR DELETE USING (auth.uid() = seller_id);

-- RLS: PURCHASES
CREATE POLICY "Users view own purchases or sales" ON public.purchases FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS: WISHLIST
CREATE POLICY "Users view own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- RLS: REVIEWS
CREATE POLICY "Public reviews read access" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users create own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS: REPORTS
CREATE POLICY "Users create own report" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users view own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- RLS: WITHDRAWALS
CREATE POLICY "Sellers view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers request own withdrawal" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- RLS: NOTIFICATIONS
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 12. SELLER ACCOUNTS TABLE (RAZORPAY ROUTE LINKED ACCOUNTS)
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

-- 13. WALLETS TABLE (INTEGER PAISE PRECISION)
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

-- 14. WALLET TRANSACTIONS TABLE (IMMUTABLE FINANCIAL LEDGER)
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

-- 15. PAYMENT TRANSFERS TABLE
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

-- 16. WITHDRAWAL REQUESTS TABLE
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

-- 17. WEBHOOK EVENTS TABLE (IDEMPOTENCY)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. AUDIT LOGS TABLE
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

-- RLS
ALTER TABLE public.seller_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers view own seller account" ON public.seller_accounts FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers update own seller account" ON public.seller_accounts FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers view own wallet transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers view own withdrawal requests" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers submit own withdrawal requests" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = seller_id);

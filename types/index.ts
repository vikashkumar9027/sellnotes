export type UserRole = 'student' | 'seller' | 'admin';

export type NoteStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type TransactionStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export type RefundStatus = 'none' | 'full' | 'partial';

export type ReportReason =
  | 'copyright_violation'
  | 'fake_notes'
  | 'wrong_description'
  | 'poor_quality'
  | 'spam'
  | 'inappropriate_content'
  | 'other';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  college?: string;
  university?: string;
  course?: string;
  semester?: string;
  role: UserRole;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  note_count?: number;
}

export interface Note {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  subject: string;
  university: string;
  college?: string;
  course: string;
  semester: string;
  year?: string;
  language: string;
  tags: string[];
  pdf_path: string;
  preview_path?: string;
  thumbnail_url?: string;
  file_size: number;
  page_count: number;
  price: number;
  is_free: boolean;
  status: NoteStatus;
  rejection_reason?: string;
  downloads: number;
  views: number;
  average_rating: number;
  rating_count?: number;
  created_at: string;
  updated_at: string;

  seller?: Profile;
  category?: Category;
}

export interface FinancialBreakdown {
  base_amount: number;         // e.g. 100
  gst_rate: number;            // e.g. 18%
  gst_amount: number;          // e.g. 18
  buyer_total_amount: number;  // e.g. 118
  platform_fee_rate: number;   // e.g. 10%
  platform_fee_amount: number; // e.g. 10
  seller_gross_amount: number; // e.g. 100
  seller_net_amount: number;   // e.g. 90
}

export interface Purchase extends FinancialBreakdown {
  id: string;
  buyer_id: string;
  seller_id: string;
  note_id: string;
  transaction_id: string;
  
  // Legacy aliases for backward compatibility
  amount: number;            // maps to base_amount
  platform_fee: number;      // maps to platform_fee_amount
  seller_amount: number;     // maps to seller_net_amount
  
  status: TransactionStatus;
  payout_status?: PayoutStatus;
  refund_status?: RefundStatus;
  created_at: string;
  updated_at?: string;

  note?: Note;
  seller?: Profile;
  buyer?: Profile;
}

export interface Transaction extends FinancialBreakdown {
  id: string;
  order_id: string;            // Razorpay order_id
  payment_id?: string;         // Razorpay payment_id
  buyer_id: string;
  seller_id: string;
  product_id: string;          // note_id
  currency: string;
  payment_status: TransactionStatus;
  payout_status: PayoutStatus;
  refund_status: RefundStatus;
  created_at: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  user_id: string;
  note_id: string;
  purchase_id?: string;
  rating: number;
  review: string;
  created_at: string;
  user?: Profile;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  note_id: string;
  created_at: string;
  note?: Note;
}

export interface Report {
  id: string;
  reporter_id: string;
  note_id: string;
  reason: ReportReason;
  description: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  admin_response?: string;
  created_at: string;
  reporter?: Profile;
  note?: Note;
}

export interface Withdrawal {
  id: string;
  seller_id: string;
  amount: number;
  payment_method: 'upi' | 'bank_transfer';
  payment_details: string;
  status: WithdrawalStatus;
  admin_note?: string;
  created_at: string;
  processed_at?: string;
  seller?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'note_approved' | 'note_rejected' | 'purchase' | 'review' | 'withdrawal' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface SystemSettings {
  platform_commission: number; // percentage, e.g. 25
  gst_rate: number;            // percentage, e.g. 18
  min_note_price: number;
  max_note_price: number;
  min_withdrawal_amount: number;
  max_pdf_size_mb: number;
  auto_approval: boolean;
  maintenance_mode: boolean;
  route_enabled?: boolean;
  settlement_delay_days?: number;
  withdrawal_enabled?: boolean;
  seller_registration_enabled?: boolean;
  website_name: string;
  website_logo: string;
  support_email: string;
}

export type WalletTransactionType =
  | 'SALE_CREDIT'
  | 'WITHDRAWAL_DEBIT'
  | 'WITHDRAWAL_REVERSAL'
  | 'REFUND_DEBIT'
  | 'ADJUSTMENT'
  | 'TRANSFER_HOLD'
  | 'TRANSFER_SETTLED';

export type WalletTransactionStatus =
  | 'PENDING'
  | 'AVAILABLE'
  | 'COMPLETED'
  | 'FAILED'
  | 'REVERSED'
  | 'CANCELLED';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  seller_id: string;
  type: WalletTransactionType;
  amount_paise: number; // integer paise
  balance_before_paise: number;
  balance_after_paise: number;
  status: WalletTransactionStatus;
  reference_id: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_transfer_id?: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  seller_id: string;
  available_balance_paise: number;
  pending_balance_paise: number;
  total_earned_paise: number;
  total_withdrawn_paise: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export type SellerOnboardingStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface SellerAccount {
  id: string;
  seller_id: string;
  razorpay_account_id?: string;
  legal_business_name: string;
  business_type: string;
  contact_email: string;
  contact_phone?: string;
  bank_account_number_last4?: string;
  bank_ifsc?: string;
  account_holder_name?: string;
  upi_vpa?: string;
  onboarding_status: SellerOnboardingStatus;
  kyc_status: string;
  bank_status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransfer {
  id: string;
  payment_id: string;
  transfer_id?: string;
  seller_account_id: string;
  seller_id: string;
  amount_paise: number;
  currency: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'REVERSED';
  error_code?: string;
  error_description?: string;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRequest {
  id: string;
  seller_id: string;
  amount_paise: number;
  fee_paise: number;
  payout_method: 'razorpay_route' | 'bank_transfer' | 'upi';
  payout_details: string;
  razorpay_payout_id?: string;
  razorpay_transfer_id?: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REVERSED' | 'CANCELLED';
  failure_reason?: string;
  admin_note?: string;
  idempotency_key: string;
  created_at: string;
  processed_at?: string;
  updated_at: string;
  seller?: Profile;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target?: string;
  ip_address?: string;
  user_agent?: string;
  result: 'SUCCESS' | 'FAILURE';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WebhookEventRecord {
  id: string;
  event_type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  processed_at: string;
}

export interface SearchFilterState {
  searchQuery: string;
  category: string;
  subject: string;
  university: string;
  course: string;
  semester: string;
  language: string;
  type: 'all' | 'free' | 'paid';
  priceRange: [number, number];
  minRating: number;
  sortBy: 'newest' | 'popular' | 'downloads' | 'price_low' | 'price_high' | 'rating';
  page: number;
}


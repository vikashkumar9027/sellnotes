'use server';

import { store } from '@/lib/store';
import { WalletLedgerService, rupeesToPaise } from '@/lib/wallet';
import { WithdrawalSchema } from '@/lib/validators';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function requestWithdrawalAction(
  sellerId: string,
  amount: number,
  payment_method: 'upi' | 'bank_transfer',
  payment_details: string
) {
  try {
    // 1. Session verification
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('notemart_user_id')?.value;
    const effectiveSellerId = sellerId || sessionUserId;

    if (!effectiveSellerId) {
      return { error: 'Authentication required. Please log in as a seller.' };
    }

    // 2. Validate withdrawal inputs
    const validated = WithdrawalSchema.parse({ amount, payment_method, payment_details });
    const settings = store.getSettings();

    if (settings.withdrawal_enabled === false) {
      return { error: 'Withdrawals are temporarily disabled by the platform administrator.' };
    }

    const minAmount = settings.min_withdrawal_amount ?? 100;
    if (validated.amount < minAmount) {
      return { error: `Minimum withdrawal amount is ₹${minAmount}` };
    }

    // 3. KYC / Linked Account verification check
    const sellerAccount = store.getSellerAccount(effectiveSellerId);
    if (sellerAccount && sellerAccount.onboarding_status === 'REJECTED') {
      return { error: 'Your payout account has been rejected. Please update your payout account details.' };
    }
    if (sellerAccount && sellerAccount.onboarding_status === 'SUSPENDED') {
      return { error: 'Your payout account is currently suspended. Please contact platform support.' };
    }

    const amountPaise = rupeesToPaise(validated.amount);
    const withdrawalId = `wth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = `idemp_${effectiveSellerId}_${amountPaise}_${Date.now()}`;

    // 4. Atomic balance deduction from immutable ledger (Integer Paise)
    const debitResult = WalletLedgerService.debitWithdrawal({
      sellerId: effectiveSellerId,
      amountPaise,
      withdrawalId,
      payoutMethod: validated.payment_method,
    });

    if (!debitResult.success) {
      return { error: debitResult.error || 'Insufficient available balance' };
    }

    // 5. Create structured withdrawal request record
    const withdrawalRecord = store.createWithdrawalRequest({
      id: withdrawalId,
      seller_id: effectiveSellerId,
      amount_paise: amountPaise,
      fee_paise: 0,
      payout_method: validated.payment_method,
      payout_details: validated.payment_details,
      status: 'PENDING',
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Also mirror to legacy store for backward compatibility
    store.requestWithdrawal(
      effectiveSellerId,
      validated.amount,
      validated.payment_method,
      validated.payment_details
    );

    revalidatePath('/dashboard/seller');
    revalidatePath('/dashboard/seller/wallet');
    revalidatePath('/dashboard/seller/withdrawals');
    revalidatePath('/dashboard/seller/transactions');
    revalidatePath('/super-admin/withdrawals');
    revalidatePath('/super-admin/ledger');
    revalidatePath('/super-admin/dashboard');

    return {
      success: true,
      withdrawal: withdrawalRecord,
      transactionId: debitResult.transaction?.id,
      message: `Withdrawal request for ₹${validated.amount} submitted successfully! Status: PENDING.`,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to process withdrawal request';
    return { error: errorMessage };
  }
}

'use server';

import { store } from '@/lib/store';
import { WithdrawalSchema } from '@/lib/validators';
import { revalidatePath } from 'next/cache';

export async function requestWithdrawalAction(
  sellerId: string,
  amount: number,
  payment_method: 'upi' | 'bank_transfer',
  payment_details: string
) {
  try {
    const validated = WithdrawalSchema.parse({ amount, payment_method, payment_details });
    const settings = store.getSettings();

    if (validated.amount < settings.min_withdrawal_amount) {
      return { error: `Minimum withdrawal amount is ₹${settings.min_withdrawal_amount}` };
    }

    // Calculate available balance
    const sales = store.getPurchasesBySeller(sellerId);
    const totalEarnings = sales.reduce((sum, s) => sum + s.seller_amount, 0);

    const withdrawals = store.getWithdrawalsBySeller(sellerId);
    const existingWithdrawn = withdrawals
      .filter((w) => w.status === 'completed' || w.status === 'pending' || w.status === 'processing')
      .reduce((sum, w) => sum + w.amount, 0);

    const availableBalance = totalEarnings - existingWithdrawn;

    if (validated.amount > availableBalance) {
      return { error: `Insufficient available balance. Your balance is ₹${availableBalance.toFixed(2)}` };
    }

    const withdrawal = store.requestWithdrawal(
      sellerId,
      validated.amount,
      validated.payment_method,
      validated.payment_details
    );

    revalidatePath('/dashboard/seller/withdrawals');
    revalidatePath('/admin/withdrawals');

    return { success: true, withdrawal };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to process withdrawal request';
    return { error: errorMessage };
  }
}

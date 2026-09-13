import { Wallet, WalletTransaction, WalletTransactionType, WalletTransactionStatus } from '@/types';
import { store } from '@/lib/store';

// Helper utilities for precision integer paise calculations
export function rupeesToPaise(rupees: number): number {
  return Math.round((Number(rupees) || 0) * 100);
}

export function paiseToRupees(paise: number): number {
  return Number(((Number(paise) || 0) / 100).toFixed(2));
}

export function formatPaise(paise: number): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Perform server-side financial calculations in exact integer paise
 * Default platform commission = 25%
 */
export function calculateOrderPaise(
  basePriceInRupees: number,
  platformCommissionPercent: number = 25,
  gstRatePercent: number = 18
) {
  const basePaise = Math.max(0, rupeesToPaise(basePriceInRupees));
  const commissionRate = Math.max(0, Number(platformCommissionPercent) || 0);
  const gstRate = Math.max(0, Number(gstRatePercent) || 0);

  const platformFeePaise = Math.round((basePaise * commissionRate) / 100);
  const sellerNetPaise = Math.max(0, basePaise - platformFeePaise);

  const gstPaise = Math.round((basePaise * gstRate) / 100);
  const buyerTotalPaise = basePaise + gstPaise;

  return {
    basePaise,
    platformFeePaise,
    sellerNetPaise,
    gstPaise,
    buyerTotalPaise,
    commissionRate,
    gstRate,
    // Rupees equivalents for UI presentation
    baseRupees: paiseToRupees(basePaise),
    platformFeeRupees: paiseToRupees(platformFeePaise),
    sellerNetRupees: paiseToRupees(sellerNetPaise),
    gstRupees: paiseToRupees(gstPaise),
    buyerTotalRupees: paiseToRupees(buyerTotalPaise),
  };
}

/**
 * Immutable Wallet Ledger Management
 */
export class WalletLedgerService {
  /**
   * Reconcile wallet balances directly from the immutable transaction ledger
   */
  static reconcile(sellerId: string): Wallet {
    const transactions = store.getWalletTransactions(sellerId);

    let available = 0;
    let pending = 0;
    let totalEarned = 0;
    let totalWithdrawn = 0;

    for (const tx of transactions) {
      if (tx.type === 'SALE_CREDIT') {
        if (tx.status === 'AVAILABLE' || tx.status === 'COMPLETED') {
          available += tx.amount_paise;
          totalEarned += tx.amount_paise;
        } else if (tx.status === 'PENDING') {
          pending += tx.amount_paise;
          totalEarned += tx.amount_paise;
        }
      } else if (tx.type === 'WITHDRAWAL_DEBIT') {
        if (tx.status === 'COMPLETED') {
          available -= tx.amount_paise;
          totalWithdrawn += tx.amount_paise;
        } else if (tx.status === 'PENDING') {
          available -= tx.amount_paise;
        }
      } else if (tx.type === 'WITHDRAWAL_REVERSAL') {
        // Reversal restores the available funds
        available += tx.amount_paise;
      } else if (tx.type === 'REFUND_DEBIT') {
        available -= tx.amount_paise;
        totalEarned -= tx.amount_paise;
      } else if (tx.type === 'ADJUSTMENT') {
        if (tx.amount_paise >= 0) {
          available += tx.amount_paise;
        } else {
          available += tx.amount_paise; // negative
        }
      }
    }

    const currentWallet = store.getWallet(sellerId);
    const updatedWallet: Wallet = {
      ...currentWallet,
      available_balance_paise: Math.max(0, available),
      pending_balance_paise: Math.max(0, pending),
      total_earned_paise: Math.max(0, totalEarned),
      total_withdrawn_paise: Math.max(0, totalWithdrawn),
      updated_at: new Date().toISOString(),
    };

    store.saveWallet(updatedWallet);
    return updatedWallet;
  }

  /**
   * Credit seller wallet from a verified sale (Idempotent)
   */
  static creditSale({
    sellerId,
    sellerNetPaise,
    referenceId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpayTransferId,
    noteTitle,
    isInstantAvailable = true,
  }: {
    sellerId: string;
    sellerNetPaise: number;
    referenceId: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpayTransferId?: string;
    noteTitle?: string;
    isInstantAvailable?: boolean;
  }): WalletTransaction {
    // Idempotency check: Don't double credit same order/reference
    const existing = store.getWalletTransactions(sellerId).find(
      (tx) => tx.reference_id === referenceId && tx.type === 'SALE_CREDIT'
    );
    if (existing) {
      return existing;
    }

    const currentWallet = store.getWallet(sellerId);
    const balanceBefore = currentWallet.available_balance_paise;
    const status: WalletTransactionStatus = isInstantAvailable ? 'AVAILABLE' : 'PENDING';
    const balanceAfter = isInstantAvailable ? balanceBefore + sellerNetPaise : balanceBefore;

    const tx: WalletTransaction = {
      id: `wtx_sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      wallet_id: currentWallet.id,
      seller_id: sellerId,
      type: 'SALE_CREDIT',
      amount_paise: sellerNetPaise,
      balance_before_paise: balanceBefore,
      balance_after_paise: balanceAfter,
      status,
      reference_id: referenceId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_transfer_id: razorpayTransferId,
      description: `Earnings from sale: ${noteTitle || 'Study Note'} (Net: ${formatPaise(sellerNetPaise)})`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.recordWalletTransaction(tx);
    this.reconcile(sellerId);
    return tx;
  }

  /**
   * Initiate a withdrawal debit from seller wallet (Atomic & Idempotent)
   */
  static debitWithdrawal({
    sellerId,
    amountPaise,
    withdrawalId,
    payoutMethod,
  }: {
    sellerId: string;
    amountPaise: number;
    withdrawalId: string;
    payoutMethod: string;
  }): { success: boolean; error?: string; transaction?: WalletTransaction } {
    const currentWallet = store.getWallet(sellerId);

    if (currentWallet.available_balance_paise < amountPaise) {
      return {
        success: false,
        error: `Insufficient balance. Available: ${formatPaise(currentWallet.available_balance_paise)}, requested: ${formatPaise(amountPaise)}`,
      };
    }

    const balanceBefore = currentWallet.available_balance_paise;
    const balanceAfter = balanceBefore - amountPaise;

    const tx: WalletTransaction = {
      id: `wtx_wth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      wallet_id: currentWallet.id,
      seller_id: sellerId,
      type: 'WITHDRAWAL_DEBIT',
      amount_paise: amountPaise,
      balance_before_paise: balanceBefore,
      balance_after_paise: balanceAfter,
      status: 'PENDING',
      reference_id: withdrawalId,
      description: `Withdrawal payout request via ${payoutMethod.toUpperCase()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.recordWalletTransaction(tx);
    this.reconcile(sellerId);
    return { success: true, transaction: tx };
  }

  /**
   * Reverse a failed or rejected withdrawal request (Restores balance through ledger entry)
   */
  static reverseWithdrawal({
    sellerId,
    withdrawalId,
    reason,
  }: {
    sellerId: string;
    withdrawalId: string;
    reason?: string;
  }): WalletTransaction {
    // Check if reversal already exists
    const existingReversal = store.getWalletTransactions(sellerId).find(
      (tx) => tx.reference_id === withdrawalId && tx.type === 'WITHDRAWAL_REVERSAL'
    );
    if (existingReversal) {
      return existingReversal;
    }

    const originalDebit = store.getWalletTransactions(sellerId).find(
      (tx) => tx.reference_id === withdrawalId && tx.type === 'WITHDRAWAL_DEBIT'
    );

    if (!originalDebit) {
      throw new Error(`Original withdrawal transaction not found for ID: ${withdrawalId}`);
    }

    // Mark original debit as REVERSED
    originalDebit.status = 'REVERSED';
    originalDebit.updated_at = new Date().toISOString();

    const currentWallet = store.getWallet(sellerId);
    const balanceBefore = currentWallet.available_balance_paise;
    const amountToRestore = originalDebit.amount_paise;
    const balanceAfter = balanceBefore + amountToRestore;

    const reversalTx: WalletTransaction = {
      id: `wtx_rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      wallet_id: currentWallet.id,
      seller_id: sellerId,
      type: 'WITHDRAWAL_REVERSAL',
      amount_paise: amountToRestore,
      balance_before_paise: balanceBefore,
      balance_after_paise: balanceAfter,
      status: 'AVAILABLE',
      reference_id: withdrawalId,
      description: `Withdrawal Reversal: ${reason || 'Payout declined or failed'}. Funds returned to available balance.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.recordWalletTransaction(reversalTx);
    this.reconcile(sellerId);
    return reversalTx;
  }

  /**
   * Debit seller wallet for a customer refund
   */
  static debitRefund({
    sellerId,
    amountPaise,
    orderId,
    reason,
  }: {
    sellerId: string;
    amountPaise: number;
    orderId: string;
    reason?: string;
  }): WalletTransaction {
    const currentWallet = store.getWallet(sellerId);
    const balanceBefore = currentWallet.available_balance_paise;
    const balanceAfter = Math.max(0, balanceBefore - amountPaise);

    const tx: WalletTransaction = {
      id: `wtx_ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      wallet_id: currentWallet.id,
      seller_id: sellerId,
      type: 'REFUND_DEBIT',
      amount_paise: amountPaise,
      balance_before_paise: balanceBefore,
      balance_after_paise: balanceAfter,
      status: 'COMPLETED',
      reference_id: orderId,
      description: `Refund deduction for order #${orderId}: ${reason || 'Customer refund processed'}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.recordWalletTransaction(tx);
    this.reconcile(sellerId);
    return tx;
  }
}

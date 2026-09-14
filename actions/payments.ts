'use server';

import { getRazorpayInstance, verifyRazorpaySignature, createRazorpayRouteTransfer } from '@/lib/razorpay';
import { store, calculateOrderAmounts } from '@/lib/store';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { recordPurchaseInSupabase } from '@/lib/supabase-db';

export async function createRazorpayOrderAction({
  noteId,
  buyerId,
}: {
  noteId: string;
  buyerId?: string;
}) {
  try {
    let effectiveBuyerId = buyerId;
    if (!effectiveBuyerId) {
      const cookieStore = await cookies();
      effectiveBuyerId = cookieStore.get('notemart_user_id')?.value || '';
    }

    if (!effectiveBuyerId) {
      return { error: 'Please log in or register before purchasing this note.' };
    }

    // 1. Fetch current product price & details strictly from server-side store
    const note = store.getNotes().find((n) => n.id === noteId);
    if (!note) {
      return { error: 'Note not found' };
    }

    if (note.seller_id === effectiveBuyerId) {
      return { error: 'You are the author of this note. You already have full access.' };
    }

    if (store.hasUserPurchased(effectiveBuyerId, noteId)) {
      return { error: 'You already own this note. You can read or download it directly.' };
    }

    // 2. Perform all financial calculations strictly server-side (25% default platform fee, 75% seller net)
    const settings = store.getSettings();
    const platformCommissionPercent = settings.platform_commission ?? 25;
    const gstRatePercent = settings.gst_rate ?? 18;

    const financial = calculateOrderAmounts(
      note.price,
      gstRatePercent,
      platformCommissionPercent
    );

    // 3. Smallest currency unit for Razorpay API (integer paise = total rupees * 100)
    const amountInPaise = financial.buyerTotalPaise;

    const razorpay = getRazorpayInstance();
    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${noteId.substring(0, 6)}`,
      notes: {
        note_id: noteId,
        buyer_id: effectiveBuyerId,
        seller_id: note.seller_id,
        base_amount_rupees: String(financial.baseAmount),
        platform_fee_rupees: String(financial.platformFeeAmount),
        seller_net_rupees: String(financial.sellerNetAmount),
        platform_commission_percent: String(platformCommissionPercent),
        gross_paise: String(financial.grossPaise),
        commission_paise: String(financial.platformFeePaise),
        seller_paise: String(financial.sellerNetPaise),
      },
    };

    let order;
    try {
      order = await razorpay.orders.create(orderOptions);
    } catch (orderErr: unknown) {
      const msg = orderErr instanceof Error ? orderErr.message : 'Unknown Razorpay error';
      console.error('[RAZORPAY ORDER ERROR]', msg);
      return {
        error: `Razorpay order creation failed: ${msg}. Please ensure RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET are configured in environment variables.`,
      };
    }

    const keyId =
      (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_live_Tb9qeGZfBaMqlH').trim();

    return {
      success: true,
      orderId: order.id,
      amountInPaise,
      baseAmount: financial.baseAmount,
      gstRate: financial.gstRate,
      gstAmount: financial.gstAmount,
      buyerTotalAmount: financial.buyerTotalAmount,
      platformFeeRate: financial.platformFeeRate,
      platformFeeAmount: financial.platformFeeAmount,
      sellerNetAmount: financial.sellerNetAmount,
      grossPaise: financial.grossPaise,
      commissionPaise: financial.platformFeePaise,
      sellerNetPaise: financial.sellerNetPaise,
      currency: 'INR',
      keyId,
      noteTitle: note.title,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create payment order';
    return { error: errorMessage };
  }
}

export async function verifyPaymentAction({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  noteId,
  buyerId,
}: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  noteId: string;
  buyerId?: string;
}) {
  try {
    let effectiveBuyerId = buyerId;
    if (!effectiveBuyerId) {
      const cookieStore = await cookies();
      effectiveBuyerId = cookieStore.get('notemart_user_id')?.value;
    }

    if (!effectiveBuyerId) {
      return { error: 'Buyer session not found. Please log in.' };
    }

    // 1. Verify Razorpay HMAC signature server-side
    const isValid = verifyRazorpaySignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return { error: 'Payment signature verification failed. Unauthorized transaction.' };
    }

    // 2. Record purchase with server-calculated 25% commission and integer paise (idempotent)
    const purchase = store.recordPurchase({
      buyerId: effectiveBuyerId,
      noteId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    // Sync purchase to Supabase PostgreSQL table if configured
    await recordPurchaseInSupabase(purchase);

    // 3. Razorpay Route marketplace transfer check
    const settings = store.getSettings();
    const sellerAccount = store.getSellerAccount(purchase.seller_id);
    let routeTransferResult = null;

    if (
      settings.route_enabled &&
      sellerAccount &&
      sellerAccount.razorpay_account_id &&
      sellerAccount.onboarding_status === 'VERIFIED'
    ) {
      const sellerPaise = Math.round((purchase.seller_net_amount ?? purchase.seller_amount) * 100);
      const transferRes = await createRazorpayRouteTransfer({
        paymentId: razorpay_payment_id,
        sellerAccountId: sellerAccount.razorpay_account_id,
        amountInPaise: sellerPaise,
        notes: {
          noteId,
          orderId: razorpay_order_id,
          purchaseId: purchase.id,
        },
      });

      if (transferRes.success && transferRes.transferId) {
        store.recordPaymentTransfer({
          id: `pt_${Date.now()}`,
          payment_id: razorpay_payment_id,
          transfer_id: transferRes.transferId,
          seller_account_id: sellerAccount.razorpay_account_id,
          seller_id: purchase.seller_id,
          amount_paise: sellerPaise,
          currency: 'INR',
          status: 'PROCESSED',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        routeTransferResult = { success: true, transferId: transferRes.transferId };
      } else {
        console.warn('[ROUTE TRANSFER NOTICE]', transferRes.error);
        // Note: When Route is pending activation on Razorpay merchant account, funds remain safely in seller's wallet balance
        store.recordPaymentTransfer({
          id: `pt_${Date.now()}`,
          payment_id: razorpay_payment_id,
          seller_account_id: sellerAccount.razorpay_account_id,
          seller_id: purchase.seller_id,
          amount_paise: sellerPaise,
          currency: 'INR',
          status: 'PENDING',
          error_code: 'ROUTE_PENDING_ACTIVATION',
          error_description: transferRes.error,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    revalidatePath('/dashboard/purchases');
    revalidatePath(`/notes/${noteId}`);
    if (purchase.note?.slug) {
      revalidatePath(`/notes/${purchase.note.slug}`);
      revalidatePath(`/notes/${purchase.note.slug}/read`);
    }
    revalidatePath('/dashboard/seller');
    revalidatePath('/dashboard/seller/wallet');
    revalidatePath('/dashboard/seller/sales');
    revalidatePath('/dashboard/seller/earnings');
    revalidatePath('/dashboard/seller/transactions');
    revalidatePath('/super-admin/orders');
    revalidatePath('/super-admin/ledger');
    revalidatePath('/super-admin/dashboard');

    return {
      success: true,
      purchaseId: purchase.id,
      noteId,
      purchase,
      routeTransfer: routeTransferResult,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Payment verification error';
    return { error: errorMessage };
  }
}

export async function refundTransactionAction({
  purchaseId,
  reason,
}: {
  purchaseId: string;
  reason?: string;
}) {
  try {
    const refundedPurchase = store.refundPurchase(purchaseId, reason);
    revalidatePath('/dashboard/purchases');
    revalidatePath('/dashboard/seller');
    revalidatePath('/dashboard/seller/wallet');
    revalidatePath('/dashboard/seller/sales');
    revalidatePath('/dashboard/seller/earnings');
    revalidatePath('/dashboard/seller/transactions');
    revalidatePath('/super-admin/orders');
    revalidatePath('/super-admin/ledger');

    return {
      success: true,
      purchase: refundedPurchase,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to process refund';
    return { error: errorMessage };
  }
}

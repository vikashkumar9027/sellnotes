'use server';

import { getRazorpayInstance, verifyRazorpaySignature } from '@/lib/razorpay';
import { store, calculateOrderAmounts } from '@/lib/store';
import { revalidatePath } from 'next/cache';

export async function createRazorpayOrderAction({
  noteId,
  buyerId,
}: {
  noteId: string;
  buyerId: string;
}) {
  try {
    // 1. Fetch current product price & details from server-side store
    const note = store.getNotes().find((n) => n.id === noteId);
    if (!note) {
      return { error: 'Note not found' };
    }

    if (note.seller_id === buyerId) {
      return { error: 'You cannot purchase your own note' };
    }

    if (store.hasUserPurchased(buyerId, noteId)) {
      return { error: 'You already own this note' };
    }

    // 2. Perform all financial calculations strictly server-side
    const settings = store.getSettings();
    const financial = calculateOrderAmounts(
      note.price,
      settings.gst_rate ?? 18,
      settings.platform_commission ?? 20
    );

    // 3. Smallest currency unit for Razorpay API (paise = total rupees * 100)
    const amountInPaise = Math.round(financial.buyerTotalAmount * 100);

    const razorpay = getRazorpayInstance();
    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${noteId.substring(0, 6)}`,
      notes: {
        note_id: noteId,
        buyer_id: buyerId,
        base_amount: String(financial.baseAmount),
        gst_amount: String(financial.gstAmount),
        buyer_total_amount: String(financial.buyerTotalAmount),
        platform_fee_amount: String(financial.platformFeeAmount),
        seller_net_amount: String(financial.sellerNetAmount),
      },
    };

    let order;
    try {
      order = await razorpay.orders.create(orderOptions);
    } catch {
      // Demo order creation fallback if credentials not set
      order = {
        id: `order_demo_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderOptions.receipt,
      };
    }

    return {
      success: true,
      orderId: order.id,
      baseAmount: financial.baseAmount,
      gstRate: financial.gstRate,
      gstAmount: financial.gstAmount,
      buyerTotalAmount: financial.buyerTotalAmount,
      platformFeeRate: financial.platformFeeRate,
      platformFeeAmount: financial.platformFeeAmount,
      sellerNetAmount: financial.sellerNetAmount,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_notemart_demo',
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
  buyerId: string;
}) {
  try {
    const isValid = verifyRazorpaySignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return { error: 'Payment signature verification failed. Unauthorized transaction.' };
    }

    // Record purchase with server-calculated amounts (idempotent)
    const purchase = store.recordPurchase({
      buyerId,
      noteId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    revalidatePath('/dashboard/purchases');
    revalidatePath(`/notes/${noteId}`);
    revalidatePath('/dashboard/seller/sales');
    revalidatePath('/dashboard/seller/earnings');
    revalidatePath('/admin');

    return {
      success: true,
      purchaseId: purchase.id,
      noteId,
      purchase,
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
    revalidatePath('/admin');
    revalidatePath('/dashboard/purchases');
    revalidatePath('/dashboard/seller/sales');
    revalidatePath('/dashboard/seller/earnings');

    return {
      success: true,
      purchase: refundedPurchase,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to process refund';
    return { error: errorMessage };
  }
}

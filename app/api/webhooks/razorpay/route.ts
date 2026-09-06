import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { store } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_notemart_demo_secret';

    // 1. Verify webhook signature
    if (signature && webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // 2. Process events idempotently
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload.payload?.payment?.entity;
      const order = payload.payload?.order?.entity;

      const noteId = payment?.notes?.note_id || order?.notes?.note_id;
      const buyerId = payment?.notes?.buyer_id || order?.notes?.buyer_id;
      const paymentId = payment?.id || `pay_wh_${Date.now()}`;
      const orderId = order?.id || payment?.order_id || `ord_wh_${Date.now()}`;

      if (noteId && buyerId) {
        // Record purchase idempotently
        store.recordPurchase({
          buyerId,
          noteId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
        });
      }
    } else if (event === 'refund.processed') {
      const refund = payload.payload?.refund?.entity;
      const paymentId = refund?.payment_id;

      if (paymentId) {
        // Process refund idempotently
        store.refundPurchase(paymentId, 'Razorpay Webhook Refund Event');
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payload?.payment?.entity;
      console.log(`Payment failed notification received for payment_id: ${payment?.id}`);
    }

    return NextResponse.json({ success: true, event, processed: true }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { store } from '@/lib/store';
import { WalletLedgerService } from '@/lib/wallet';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. Verify webhook signature
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
      }

      const isValid = verifyRazorpayWebhookSignature({
        rawBody,
        signature,
        secret: webhookSecret,
      });

      if (!isValid) {
        console.error('[WEBHOOK SECURITY] Invalid Razorpay webhook signature received.');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('[SECURITY NOTICE] RAZORPAY_WEBHOOK_SECRET is not configured in production.');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    // Unique webhook event identifier
    const eventId = payload.event_id || payload.id || `evt_${event}_${Date.now()}`;

    // 2. Strict idempotency guard: Do not process the same event twice
    const isNewEvent = store.recordWebhookEvent({
      id: eventId,
      event_type: event,
      payload,
      processed_at: new Date().toISOString(),
    });

    if (!isNewEvent) {
      return NextResponse.json(
        { success: true, event, processed: false, reason: 'Duplicate event already processed' },
        { status: 200 }
      );
    }

    // 3. Dispatch specific event handlers
    switch (event) {
      case 'payment.captured':
      case 'order.paid': {
        const payment = payload.payload?.payment?.entity;
        const order = payload.payload?.order?.entity;

        const noteId = payment?.notes?.note_id || order?.notes?.note_id;
        const buyerId = payment?.notes?.buyer_id || order?.notes?.buyer_id;
        const paymentId = payment?.id;
        const orderId = order?.id || payment?.order_id;

        if (noteId && buyerId && paymentId) {
          // Idempotently records purchase & credits seller wallet ledger in integer paise (25% commission)
          store.recordPurchase({
            buyerId,
            noteId,
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
          });
        }
        break;
      }

      case 'transfer.processed': {
        const transfer = payload.payload?.transfer?.entity;
        if (transfer?.id) {
          const transfers = store.getPaymentTransfers();
          const record = transfers.find((t) => t.transfer_id === transfer.id);
          if (record) {
            record.status = 'PROCESSED';
            record.updated_at = new Date().toISOString();
          }
        }
        break;
      }

      case 'transfer.failed': {
        const transfer = payload.payload?.transfer?.entity;
        if (transfer?.id) {
          const transfers = store.getPaymentTransfers();
          const record = transfers.find((t) => t.transfer_id === transfer.id);
          if (record) {
            record.status = 'FAILED';
            record.error_code = transfer.error_code;
            record.error_description = transfer.error_description;
            record.updated_at = new Date().toISOString();
          }
        }
        break;
      }

      case 'refund.processed': {
        const refund = payload.payload?.refund?.entity;
        const paymentId = refund?.payment_id;

        if (paymentId) {
          store.refundPurchase(paymentId, 'Razorpay Webhook Refund');
        }
        break;
      }

      case 'payout.processed': {
        const payout = payload.payload?.payout?.entity;
        const payoutId = payout?.id;

        if (payoutId) {
          const withdrawals = store.getWithdrawalRequests();
          const target = withdrawals.find((w) => w.razorpay_payout_id === payoutId || w.id === payout.reference_id);
          if (target) {
            target.status = 'SUCCESS';
            target.processed_at = new Date().toISOString();
            target.updated_at = new Date().toISOString();
          }
        }
        break;
      }

      case 'payout.failed':
      case 'payout.reversed': {
        const payout = payload.payload?.payout?.entity;
        const payoutId = payout?.id;

        if (payoutId) {
          const withdrawals = store.getWithdrawalRequests();
          const target = withdrawals.find((w) => w.razorpay_payout_id === payoutId || w.id === payout.reference_id);
          if (target && target.status !== 'REVERSED') {
            target.status = 'REVERSED';
            target.failure_reason = payout.failure_reason || 'Payout reversed by provider';
            target.updated_at = new Date().toISOString();

            // Reverse through immutable ledger to safely restore funds
            WalletLedgerService.reverseWithdrawal({
              sellerId: target.seller_id,
              withdrawalId: target.id,
              reason: target.failure_reason,
            });
          }
        }
        break;
      }

      default:
        console.log(`[RAZORPAY WEBHOOK] Unhandled event received: ${event}`);
    }

    return NextResponse.json({ success: true, event, processed: true }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Webhook processing error';
    console.error('[RAZORPAY WEBHOOK ERROR]', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

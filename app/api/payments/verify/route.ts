import { NextResponse } from 'next/server';
import { verifyPaymentAction } from '@/actions/payments';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, noteId, buyerId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !noteId || !buyerId) {
      return NextResponse.json({ error: 'Missing payment verification details' }, { status: 400 });
    }

    const res = await verifyPaymentAction({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      noteId,
      buyerId,
    });

    return NextResponse.json(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

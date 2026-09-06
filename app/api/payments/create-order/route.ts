import { NextResponse } from 'next/server';
import { createRazorpayOrderAction } from '@/actions/payments';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { noteId, buyerId } = body;

    if (!noteId || !buyerId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const res = await createRazorpayOrderAction({ noteId, buyerId });
    return NextResponse.json(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

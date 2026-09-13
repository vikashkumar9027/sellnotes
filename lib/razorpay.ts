import Razorpay from 'razorpay';
import crypto from 'crypto';

export const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

  if (!key_secret) {
    console.warn('[RAZORPAY] RAZORPAY_KEY_SECRET is not set in environment variables.');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

/**
 * Verifies Razorpay client-side payment signature HMAC-SHA256
 */
export const verifyRazorpaySignature = ({
  order_id,
  payment_id,
  signature,
}: {
  order_id: string;
  payment_id: string;
  signature: string;
}): boolean => {
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

  if (!key_secret || !order_id || !payment_id || !signature) {
    return false;
  }

  try {
    const body = `${order_id}|${payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch (err) {
    console.error('Error verifying Razorpay signature:', err);
    return false;
  }
};

/**
 * Verifies Razorpay Webhook signature HMAC-SHA256
 */
export const verifyRazorpayWebhookSignature = ({
  rawBody,
  signature,
  secret,
}: {
  rawBody: string;
  signature: string;
  secret: string;
}): boolean => {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch (err) {
    console.error('Error verifying Razorpay webhook signature:', err);
    return false;
  }
};

/**
 * Creates a Razorpay Route Linked Account for a seller
 */
export async function createRazorpayRouteAccount({
  name,
  email,
  phone,
  accountNumber,
  ifsc,
  businessType = 'individual',
}: {
  name: string;
  email: string;
  phone?: string;
  accountNumber?: string;
  ifsc?: string;
  businessType?: string;
}) {
  const razorpay = getRazorpayInstance();

  try {
    // Official Razorpay Accounts API for Route
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accountPayload: any = {
      type: 'route',
      name,
      email,
      phone: phone || undefined,
      business_type: businessType,
      legal_business_name: name,
    };

    if (accountNumber && ifsc) {
      accountPayload.bank_account = {
        account_number: accountNumber,
        ifsc_code: ifsc,
        beneficiary_name: name,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdAccount: any = await (razorpay as any).accounts.create(accountPayload);
    return {
      success: true,
      accountId: createdAccount.id,
      account: createdAccount,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create Razorpay linked account';
    return {
      success: false,
      error: msg,
      isRouteInactive: msg.toLowerCase().includes('route') || msg.toLowerCase().includes('not authorized') || msg.toLowerCase().includes('feature'),
    };
  }
}

/**
 * Transfers funds from a captured payment to a seller's Razorpay Linked Account via Razorpay Route
 */
export async function createRazorpayRouteTransfer({
  paymentId,
  sellerAccountId,
  amountInPaise,
  notes,
}: {
  paymentId: string;
  sellerAccountId: string;
  amountInPaise: number;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpayInstance();

  try {
    // Official Razorpay Route Transfers API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transferRes: any = await (razorpay.payments as any).transfer(paymentId, {
      transfers: [
        {
          account: sellerAccountId,
          amount: amountInPaise,
          currency: 'INR',
          notes: notes || {},
        },
      ],
    });

    const transferItem = transferRes.items?.[0] || transferRes;
    return {
      success: true,
      transferId: transferItem.id,
      transfer: transferItem,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Route transfer failed';
    return {
      success: false,
      error: msg,
      isRouteInactive: msg.toLowerCase().includes('route') || msg.toLowerCase().includes('not authorized') || msg.toLowerCase().includes('feature'),
    };
  }
}

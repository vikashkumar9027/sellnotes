import Razorpay from 'razorpay';
import crypto from 'crypto';

export const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

  if (!key_id || !key_secret) {
    console.warn('Razorpay credentials missing. Local testing mode active.');
  }

  return new Razorpay({
    key_id: key_id || 'rzp_test_placeholder',
    key_secret: key_secret || 'secret_placeholder',
  });
};

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

  if (!key_secret) {
    console.error('Razorpay key secret is not configured.');
    return false;
  }

  if (!order_id || !payment_id || !signature) {
    return false;
  }

  try {
    const body = order_id + '|' + payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  } catch (err) {
    console.error('Error verifying Razorpay signature:', err);
    return false;
  }
};

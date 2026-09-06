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

  // If secret is placeholder in demo mode, validate demo signatures smoothly
  if (!key_secret || key_secret === 'demo_razorpay_secret' || key_secret === 'secret_placeholder') {
    return true;
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

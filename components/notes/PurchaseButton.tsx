'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2, Eye, ShieldCheck } from 'lucide-react';
import { Note } from '@/types';
import { createRazorpayOrderAction, verifyPaymentAction } from '@/actions/payments';
import { formatPrice } from '@/lib/utils';
import { store, calculateOrderAmounts } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';

interface PurchaseButtonProps {
  note: Note;
  buyerId?: string;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export default function PurchaseButton({ note, buyerId, onSuccess }: PurchaseButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const effectiveBuyerId = buyerId || user?.id;

  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(() =>
    effectiveBuyerId ? store.hasUserPurchased(effectiveBuyerId, note.id) : false
  );

  const settings = store.getSettings();
  const financial = calculateOrderAmounts(
    note.price,
    settings.gst_rate ?? 18,
    settings.platform_commission ?? 10
  );

  const restoreScroll = () => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyClick = async () => {
    if (!user || !effectiveBuyerId) {
      alert('Please log in or register to purchase and access notes.');
      router.push(`/login?redirect=/notes/${note.slug}`);
      return;
    }

    if (user.id === note.seller_id) {
      alert('You are the author of this note. You already have full access.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create real order server-side via Razorpay Orders API
      const orderRes = await createRazorpayOrderAction({
        noteId: note.id,
        buyerId: effectiveBuyerId,
      });

      if (orderRes.error || !orderRes.orderId) {
        alert(orderRes.error || 'Failed to initiate Razorpay order.');
        setLoading(false);
        return;
      }

      // 2. Load official Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Could not load Razorpay Checkout. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // 3. Configure Razorpay Checkout Modal
      const keyId = orderRes.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TYm09mHpY7NcDT';
      const isTestMode = keyId.startsWith('rzp_test_');

      const options = {
        key: keyId,
        amount: orderRes.amountInPaise,
        currency: orderRes.currency || 'INR',
        name: 'NoteMart',
        description: isTestMode
          ? `[TEST MODE - Do not use real PhonePe/GPay] Select Cards or Netbanking and click Success`
          : `Handwritten Note: ${note.title} (Inc. ${orderRes.gstRate}% GST)`,
        image: '/logo.png',
        order_id: orderRes.orderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          restoreScroll();
          setLoading(true);

          // 4. Server-Side HMAC Signature Verification (Never trust frontend alone)
          const verifyRes = await verifyPaymentAction({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            noteId: note.id,
            buyerId: effectiveBuyerId,
          });

          setLoading(false);

          if (verifyRes.success) {
            store.recordPurchase({
              buyerId: effectiveBuyerId,
              noteId: note.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
            });
            setPurchased(true);
            if (onSuccess) onSuccess();
            alert(`🎉 Payment Verified! Total Paid: ${formatPrice(financial.buyerTotalAmount)} (Inc. 18% GST). Full note access unlocked!`);
            router.push(`/notes/${note.slug}/read`);
          } else {
            alert(verifyRes.error || 'Payment signature verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.full_name || 'Student Buyer',
          email: user.email || '',
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            restoreScroll();
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rzp.on('payment.failed', function (resp: any) {
          setLoading(false);
          restoreScroll();
          alert(`Payment Failed: ${resp.error?.description || 'Transaction declined by bank/gateway.'}`);
        });
        rzp.open();
      } else {
        setLoading(false);
        alert('Razorpay Checkout failed to initialize.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An unexpected payment error occurred.';
      alert(errMsg);
      setLoading(false);
      restoreScroll();
    }
  };

  if (purchased || note.is_free || (user && user.id === note.seller_id)) {
    return (
      <div className="space-y-2 w-full">
        <Link
          href={`/notes/${note.slug}/read`}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01]"
        >
          <Eye className="w-5 h-5" />
          <span>Read Online in Secure Reader</span>
        </Link>
        {!note.is_free && user && user.id !== note.seller_id && (
          <button
            onClick={() => {
              if (effectiveBuyerId) {
                store.removePurchase(effectiveBuyerId, note.id);
                setPurchased(false);
              }
            }}
            className="w-full text-center text-xs text-slate-400 hover:text-indigo-600 transition-colors py-1"
          >
            🧪 [Test Mode] Reset purchase status to test Razorpay payment again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <button
        onClick={handleBuyClick}
        disabled={loading}
        className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.01]"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>Buy Now – {formatPrice(financial.buyerTotalAmount)}</span>
          </>
        )}
      </button>

      {/* TRANSPARENT COST BREAKDOWN FOR BUYER */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
        <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
          <span>Note Base Price:</span>
          <span>{formatPrice(financial.baseAmount)}</span>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
          <span>GST ({financial.gstRate}%):</span>
          <span className="text-amber-600 font-semibold">+{formatPrice(financial.gstAmount)}</span>
        </div>
        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between font-extrabold text-slate-900 dark:text-white">
          <span>Total Payable:</span>
          <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(financial.buyerTotalAmount)}</span>
        </div>
      </div>

      {(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TYm09mHpY7NcDT').startsWith('rzp_test_') && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <div className="font-black flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
            <span>🧪</span> Razorpay Test Mode Active
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-normal">
            Real UPI apps (PhonePe/GPay) do not work in Test Mode. In the checkout popup, choose <strong>Netbanking</strong> or <strong>Card</strong> and click <strong>Success</strong>, or enter UPI ID <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono font-bold">success@razorpay</code>. To accept real PhonePe payments, connect a Live Key.
          </p>
        </div>
      )}

      <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        Razorpay 256-Bit SSL Encrypted &bull; Instant In-Browser DRM Unlock
      </p>
    </div>
  );
}

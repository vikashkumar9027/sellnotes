'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2, Eye, ShieldCheck, Lock, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Note } from '@/types';
import { createRazorpayOrderAction, verifyPaymentAction } from '@/actions/payments';
import { formatPrice } from '@/lib/utils';
import { store, calculateOrderAmounts } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { getPdfFromIndexedDB, downloadBlobAsFile } from '@/lib/pdf-storage';

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
  const [checkoutError, setCheckoutError] = useState('');
  const [purchased, setPurchased] = useState(() =>
    effectiveBuyerId ? store.hasUserPurchased(effectiveBuyerId, note.id) : false
  );

  const settings = store.getSettings();
  const financial = calculateOrderAmounts(
    note.price,
    settings.gst_rate ?? 18,
    settings.platform_commission ?? 25
  );

  const restoreScroll = () => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.getElementById('razorpay-checkout-script');
      if (existingScript) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyClick = async () => {
    setCheckoutError('');

    if (!user || !effectiveBuyerId) {
      toast.info('Please log in or register to purchase and access notes.');
      router.push(`/login?redirect=/notes/${note.slug}`);
      return;
    }

    if (user.id === note.seller_id) {
      toast.info('You are the author of this note. You already have full access.');
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
        const err = orderRes.error || 'Failed to initiate Razorpay order.';
        setCheckoutError(err);
        toast.error(err);
        setLoading(false);
        return;
      }

      // 2. Ensure Razorpay Checkout SDK is ready
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        const err = 'Could not load Razorpay Checkout script. Please check your internet connection.';
        setCheckoutError(err);
        toast.error(err);
        setLoading(false);
        return;
      }

      // 3. Configure Razorpay Checkout Modal
      const keyId =
        orderRes.keyId ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        'rzp_live_Tb9qeGZfBaMqlH';
      const isTestMode = keyId.startsWith('rzp_test_');

      const options = {
        key: keyId,
        amount: orderRes.amountInPaise,
        currency: orderRes.currency || 'INR',
        name: 'NoteMart',
        description: isTestMode
          ? `[TEST MODE] Select Netbanking/Card & click Success`
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

          // 4. Server-Side HMAC Signature Verification
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
            toast.success(`🎉 Payment Verified! Total Paid: ${formatPrice(financial.buyerTotalAmount)}. Full note unlocked!`);
            router.push(`/notes/${note.slug}/read`);
          } else {
            const verifyErr = verifyRes.error || 'Payment signature verification failed. Please contact support.';
            setCheckoutError(verifyErr);
            toast.error(verifyErr);
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
          const failMsg = `Payment Failed: ${resp.error?.description || 'Transaction declined by bank/gateway.'}`;
          setCheckoutError(failMsg);
          toast.error(failMsg);
        });
        rzp.open();
      } else {
        setLoading(false);
        const failMsg = 'Razorpay Checkout modal failed to open. Please refresh and try again.';
        setCheckoutError(failMsg);
        toast.error(failMsg);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An unexpected payment error occurred.';
      setCheckoutError(errMsg);
      toast.error(errMsg);
      setLoading(false);
      restoreScroll();
    }
  };

  const handleDownload = async () => {
    try {
      const localBlob =
        (await getPdfFromIndexedDB(note.slug)) ||
        (await getPdfFromIndexedDB(note.id));

      if (localBlob) {
        downloadBlobAsFile(localBlob, `${note.title}.pdf`);
        toast.success('Downloaded note PDF!');
        return;
      }

      window.open(
        `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&download=1`,
        '_blank'
      );
    } catch {
      window.open(
        `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&download=1`,
        '_blank'
      );
    }
  };

  if (purchased || note.is_free || (user && user.id === note.seller_id)) {
    return (
      <div className="space-y-2.5 w-full">
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Full Unlocked Access to all {note.page_count} pages!</span>
        </div>

        <Link
          href={`/notes/${note.slug}/read`}
          className="w-full py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01]"
        >
          <Eye className="w-5 h-5" />
          <span>Read Online in Full Reader</span>
        </Link>

        <button
          onClick={handleDownload}
          className="w-full py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <Download className="w-5 h-5" />
          <span>Download PDF Note</span>
        </button>

        {!note.is_free && user && user.id !== note.seller_id && (
          <button
            onClick={() => {
              if (effectiveBuyerId) {
                store.removePurchase(effectiveBuyerId, note.id);
                setPurchased(false);
              }
            }}
            className="w-full text-center text-xs text-slate-400 hover:text-indigo-600 transition-colors py-1 cursor-pointer"
          >
            🧪 [Test Mode] Reset purchase status to test Razorpay payment again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {checkoutError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 flex-1">
            <div className="font-bold">Payment could not be opened</div>
            <div className="text-[11px] text-rose-700 dark:text-rose-400 leading-normal">{checkoutError}</div>
          </div>
        </div>
      )}

      {!user ? (
        <div className="space-y-1.5 w-full">
          <Link
            href={`/login?redirect=/notes/${note.slug}`}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.01]"
          >
            <Lock className="w-4 h-4" />
            <span>Login to Buy – {formatPrice(financial.buyerTotalAmount)}</span>
          </Link>
          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
            Sign in with email OTP to purchase &amp; save this note in your library.
          </p>
        </div>
      ) : (
        <button
          onClick={handleBuyClick}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-70"
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
      )}

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

      {(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').startsWith('rzp_test_') && (
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

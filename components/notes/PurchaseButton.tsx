'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Loader2, ShieldCheck, Eye, CreditCard, Smartphone, CheckCircle2, X, Info } from 'lucide-react';
import { Note } from '@/types';
import { createRazorpayOrderAction, verifyPaymentAction } from '@/actions/payments';
import { formatPrice } from '@/lib/utils';
import { store, calculateOrderAmounts } from '@/lib/store';

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

export default function PurchaseButton({ note, buyerId = 'user-student-1', onSuccess }: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(() => store.hasUserPurchased(buyerId, note.id));
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  const settings = store.getSettings();
  const financial = calculateOrderAmounts(
    note.price,
    settings.gst_rate ?? 18,
    settings.platform_commission ?? 10
  );

  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    baseAmount: number;
    gstRate: number;
    gstAmount: number;
    buyerTotalAmount: number;
    platformFeeRate: number;
    platformFeeAmount: number;
    sellerNetAmount: number;
    currency: string;
  } | null>(null);

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_notemart_demo';
  const isRealRazorpayKey = keyId.startsWith('rzp_live_') || (keyId.startsWith('rzp_test_') && keyId !== 'rzp_test_notemart_demo');

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
    setLoading(true);

    try {
      // Create Order with strict server-side calculation
      const orderRes = await createRazorpayOrderAction({ noteId: note.id, buyerId });

      if (orderRes.error || !orderRes.orderId) {
        alert(orderRes.error || 'Failed to start transaction.');
        setLoading(false);
        return;
      }

      setOrderDetails({
        orderId: orderRes.orderId,
        baseAmount: orderRes.baseAmount ?? financial.baseAmount,
        gstRate: orderRes.gstRate ?? financial.gstRate,
        gstAmount: orderRes.gstAmount ?? financial.gstAmount,
        buyerTotalAmount: orderRes.buyerTotalAmount ?? financial.buyerTotalAmount,
        platformFeeRate: orderRes.platformFeeRate ?? financial.platformFeeRate,
        platformFeeAmount: orderRes.platformFeeAmount ?? financial.platformFeeAmount,
        sellerNetAmount: orderRes.sellerNetAmount ?? financial.sellerNetAmount,
        currency: orderRes.currency || 'INR',
      });

      if (isRealRazorpayKey) {
        await loadRazorpayScript();

        const options = {
          key: orderRes.keyId,
          amount: Math.round((orderRes.buyerTotalAmount ?? financial.buyerTotalAmount) * 100),
          currency: orderRes.currency || 'INR',
          name: 'NoteMart',
          description: `Handwritten Note: ${note.title} (Inc. ${orderRes.gstRate}% GST)`,
          image: '/logo.png',
          order_id: orderRes.orderId,
          handler: async function (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            restoreScroll();
            const verifyRes = await verifyPaymentAction({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              noteId: note.id,
              buyerId,
            });

            setLoading(false);

            if (verifyRes.success) {
              setPurchased(true);
              if (onSuccess) onSuccess();
              alert(`🎉 Payment successful! Total Paid: ${formatPrice(financial.buyerTotalAmount)}. Full note reading access unlocked.`);
            } else {
              alert(verifyRes.error || 'Payment signature verification failed.');
            }
          },
          prefill: {
            name: 'Student Buyer',
            email: 'buyer@notemart.edu',
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
          rzp.open();
        } else {
          setLoading(false);
          alert('Razorpay Checkout failed to load.');
        }
      } else {
        setLoading(false);
        setShowDemoModal(true);
      }
    } catch {
      alert('An unexpected payment error occurred.');
      setLoading(false);
      restoreScroll();
    }
  };

  const handleConfirmDemoPayment = async () => {
    if (!orderDetails) return;
    setLoading(true);

    const fakePaymentId = `pay_demo_${Date.now()}`;
    const verifyRes = await verifyPaymentAction({
      razorpay_order_id: orderDetails.orderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: 'demo_sig',
      noteId: note.id,
      buyerId,
    });

    setLoading(false);
    setShowDemoModal(false);
    restoreScroll();

    if (verifyRes.success) {
      setPurchased(true);
      if (onSuccess) onSuccess();
      alert(`🎉 Payment Verified! Total Paid: ${formatPrice(orderDetails.buyerTotalAmount)} (Inc. ${orderDetails.gstRate}% GST). Saved to your purchases.`);
    } else {
      alert(verifyRes.error || 'Payment verification failed.');
    }
  };

  if (purchased || note.is_free) {
    return (
      <Link
        href={`/notes/${note.slug}/read`}
        className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01]"
      >
        <Eye className="w-5 h-5" />
        <span>Read Online in Secure Reader</span>
      </Link>
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

      {/* DEMO CHECKOUT MODAL WITH TRANSPARENT FINANCIAL BREAKDOWN */}
      {showDemoModal && orderDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowDemoModal(false);
                restoreScroll();
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg">
                R
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">NoteMart Secure Checkout</h3>
                <p className="text-xs text-slate-500">Order ID: {orderDetails.orderId.substring(0, 16)}...</p>
              </div>
            </div>

            {/* TRANSPARENT CHECKOUT SUMMARY */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <p className="font-bold text-slate-900 dark:text-white truncate">{note.title}</p>
              <p className="text-slate-500">{note.subject} • {note.university}</p>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5 font-medium text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Note Price:</span>
                  <span>{formatPrice(orderDetails.baseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({orderDetails.gstRate}%):</span>
                  <span className="text-amber-600 font-semibold">+{formatPrice(orderDetails.gstAmount)}</span>
                </div>
                <div className="pt-2 border-t flex justify-between font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  <span>Total Payable:</span>
                  <span>{formatPrice(orderDetails.buyerTotalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Select Payment Mode
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <div className="p-3 rounded-xl border-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>UPI / GPay</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 text-slate-600 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Cards / NetBanking</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmDemoPayment}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Complete Payment ({formatPrice(orderDetails.buyerTotalAmount)})</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> 256-Bit SSL Encrypted &amp; Secure Payment Processing
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

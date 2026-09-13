'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { store } from '@/lib/store';
import { saveSellerPayoutAccountAction } from '@/actions/route';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Smartphone,
  Building,
  Info,
} from 'lucide-react';
import { SellerOnboardingStatus } from '@/types';

export default function PayoutSetupPage() {
  const { user } = useAuth();
  const sellerId = user?.id || 'user-seller-1';

  const existingAccount = store.getSellerAccount(sellerId);

  const [legalName, setLegalName] = useState(existingAccount?.legal_business_name || user?.full_name || '');
  const [email, setEmail] = useState(existingAccount?.contact_email || user?.email || '');
  const [phone, setPhone] = useState(existingAccount?.contact_phone || '');
  const [payoutType, setPayoutType] = useState<'upi' | 'bank'>(existingAccount?.bank_account_number_last4 ? 'bank' : 'upi');
  const [upiId, setUpiId] = useState(existingAccount?.upi_vpa || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState(existingAccount?.bank_ifsc || '');
  const [holderName, setHolderName] = useState(existingAccount?.account_holder_name || user?.full_name || '');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const status: SellerOnboardingStatus = existingAccount?.onboarding_status || 'NOT_STARTED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setNotice('');
    setError('');

    if (payoutType === 'bank') {
      if (accountNumber && accountNumber !== confirmAccountNumber) {
        setError('Bank Account numbers do not match.');
        setLoading(false);
        return;
      }
    }

    const res = await saveSellerPayoutAccountAction({
      sellerId,
      legalBusinessName: legalName,
      contactEmail: email,
      contactPhone: phone,
      upiVpa: payoutType === 'upi' ? upiId : undefined,
      bankAccountNumber: payoutType === 'bank' ? accountNumber : undefined,
      bankIfsc: payoutType === 'bank' ? ifsc : undefined,
      accountHolderName: holderName,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setMessage(res.message || 'Payout account saved successfully!');
      if (res.notice) {
        setNotice(res.notice);
      }
      setAccountNumber('');
      setConfirmAccountNumber('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/seller"
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Payout Account Setup
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Configure your verified UPI ID or Bank Account for instant seller earnings settlements.
          </p>
        </div>
      </div>

      {/* ONBOARDING STATUS CARD */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Current Verification Status
          </span>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
              status === 'VERIFIED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                : status === 'SUBMITTED' || status === 'PENDING'
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
            }`}>
              {status}
            </span>
            {existingAccount?.razorpay_account_id && (
              <span className="font-mono text-xs text-slate-500">
                Route ID: {existingAccount.razorpay_account_id}
              </span>
            )}
          </div>
        </div>

        {existingAccount?.bank_account_number_last4 && (
          <div className="text-xs text-slate-500">
            <span className="font-bold text-slate-700 dark:text-slate-300">Linked Account: </span>
            A/C ••••••••{existingAccount.bank_account_number_last4} ({existingAccount.bank_ifsc})
          </div>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {notice && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
            1. Seller Contact &amp; Legal Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Legal Full Name (Matching Bank Record) *
              </label>
              <input
                type="text"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Payout Contact Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav@college.edu"
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Phone Number (For Payout SMS Alerts)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* PAYOUT METHOD SELECTION */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
            2. Receiving Payout Channel
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPayoutType('upi')}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                payoutType === 'upi'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Smartphone className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="text-xs font-bold block">Instant UPI ID</span>
                <span className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPayoutType('bank')}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                payoutType === 'bank'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Building className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="text-xs font-bold block">Bank Account</span>
                <span className="text-[10px] text-slate-500">Direct IMPS / NEFT Transfer</span>
              </div>
            </button>
          </div>

          {payoutType === 'upi' ? (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Virtual Payment Address (UPI ID) *
              </label>
              <input
                type="text"
                required={payoutType === 'upi'}
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. 9876543210@paytm or username@okaxis"
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Account Beneficiary Name *
                </label>
                <input
                  type="text"
                  required={payoutType === 'bank'}
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bank Account Number *
                  </label>
                  <input
                    type="password"
                    required={payoutType === 'bank'}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter Account Number"
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Confirm Account Number *
                  </label>
                  <input
                    type="text"
                    required={payoutType === 'bank'}
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    placeholder="Re-enter Account Number"
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  required={payoutType === 'bank'}
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium uppercase focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          <span>Save Verified Payout Account</span>
        </button>

        <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Bank account numbers are encrypted. Only the last 4 digits are retained on display.
        </p>
      </form>
    </div>
  );
}

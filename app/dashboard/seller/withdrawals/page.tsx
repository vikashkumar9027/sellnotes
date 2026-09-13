'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { store } from '@/lib/store';
import { requestWithdrawalAction } from '@/actions/seller';
import { formatPaise, paiseToRupees } from '@/lib/wallet';
import { formatDate } from '@/lib/utils';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Landmark,
  ShieldCheck,
  History,
} from 'lucide-react';

export default function WithdrawalsPage() {
  const { user } = useAuth();
  const sellerId = user?.id || 'user-seller-1';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const wallet = store.getWallet(sellerId);
  const account = store.getSellerAccount(sellerId);
  const settings = store.getSettings();

  const minWithdrawal = settings.min_withdrawal_amount ?? 100;
  const availableRupees = paiseToRupees(wallet.available_balance_paise);

  const [amount, setAmount] = useState(Math.max(minWithdrawal, Math.min(500, availableRupees)));
  const [method, setMethod] = useState<'upi' | 'bank_transfer'>(account?.bank_account_number_last4 ? 'bank_transfer' : 'upi');
  const [details, setDetails] = useState(account?.upi_vpa || (account?.bank_account_number_last4 ? `A/C ••••••••${account.bank_account_number_last4}, ${account.bank_ifsc}` : ''));

  const withdrawalRequests = store.getWithdrawalRequests(sellerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    const res = await requestWithdrawalAction(sellerId, amount, method, details);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(res.message || '🎉 Withdrawal request submitted! Funds will be settled into your verified account.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Payout &amp; Withdrawals
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Request direct payouts of your seller earnings to verified UPI or Bank Account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/seller/payout-setup"
            className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Landmark className="w-4 h-4" />
            <span>Payout Account Settings</span>
          </Link>
          <Link
            href="/dashboard/seller/transactions"
            className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <History className="w-4 h-4" />
            <span>Ledger History</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* REQUEST FORM */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-1">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">
              Available Payout Balance
            </span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {formatPaise(wallet.available_balance_paise)}
            </div>
            <span className="text-[10px] text-slate-500">
              Minimum withdrawal limit: ₹{minWithdrawal}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Withdrawal Amount (₹) *
              </label>
              <input
                type="number"
                min={minWithdrawal}
                max={availableRupees}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Payout Channel *
              </label>
              <select
                value={method}
                onChange={(e) => {
                  const m = e.target.value as 'upi' | 'bank_transfer';
                  setMethod(m);
                  if (m === 'upi' && account?.upi_vpa) {
                    setDetails(account.upi_vpa);
                  } else if (m === 'bank_transfer' && account?.bank_account_number_last4) {
                    setDetails(`A/C ••••••••${account.bank_account_number_last4}, ${account.bank_ifsc}`);
                  }
                }}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-hidden"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                <option value="bank_transfer">Direct Bank Transfer (NEFT / IMPS)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {method === 'upi' ? 'UPI ID (e.g. name@upi) *' : 'Account Details / Beneficiary *'}
              </label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
                placeholder={method === 'upi' ? 'e.g. 9876543210@paytm' : 'e.g. A/C 12345678, HDFC0001234'}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading || availableRupees < minWithdrawal}
              className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Payout Request'}
            </button>
          </form>
        </div>

        {/* WITHDRAWAL HISTORY TABLE */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Withdrawal History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method &amp; Details</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Requested Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {withdrawalRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No withdrawal requests placed yet.
                    </td>
                  </tr>
                ) : (
                  withdrawalRequests.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                        {formatPaise(w.amount_paise)}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                          {w.payout_method}
                        </span>
                        <p className="text-[11px] text-slate-500">{w.payout_details}</p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          w.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : w.status === 'PENDING' || w.status === 'PROCESSING'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {formatDate(w.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

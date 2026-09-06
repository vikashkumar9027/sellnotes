'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { requestWithdrawalAction } from '@/actions/seller';
import { formatPrice, formatDate, getStatusBadgeClass } from '@/lib/utils';
import { Wallet, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function WithdrawalsPage() {
  const sellerId = 'user-seller-1';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [details, setDetails] = useState('aarav@okaxis');

  const withdrawals = store.getWithdrawalsBySeller(sellerId);
  const sales = store.getPurchasesBySeller(sellerId);
  const totalEarnings = sales.reduce((sum, s) => sum + s.seller_amount, 0);

  const completedWithdrawn = withdrawals
    .filter((w) => w.status === 'completed' || w.status === 'pending' || w.status === 'processing')
    .reduce((sum, w) => sum + w.amount, 0);

  const availableBalance = Math.max(0, totalEarnings - completedWithdrawn);
  const settings = store.getSettings();

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
      setSuccess('🎉 Withdrawal request submitted! Admin will process your payout within 24 hours.');
      setAmount(100);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Payout &amp; Withdrawals</h1>
        <p className="text-xs text-slate-500 font-medium">Request direct payouts of your seller earnings to UPI or Bank Account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* REQUEST FORM */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-1">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Available Payout Balance</span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatPrice(availableBalance)}</div>
            <span className="text-[10px] text-slate-500">Minimum withdrawal limit: ₹{settings.min_withdrawal_amount}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Withdrawal Amount (₹) *</label>
              <input
                type="number"
                min={settings.min_withdrawal_amount}
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full py-2.5 px-3.5 rounded-xl border text-sm font-bold focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payout Method *</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as 'upi' | 'bank_transfer')}
                className="w-full py-2.5 px-3.5 rounded-xl border text-xs font-medium focus:outline-hidden"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                <option value="bank_transfer">Direct Bank Transfer (NEFT / IMPS)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {method === 'upi' ? 'UPI ID (e.g. name@upi) *' : 'Account No. & IFSC Code *'}
              </label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
                placeholder={method === 'upi' ? 'e.g. 9876543210@paytm' : 'e.g. A/C 12345678, HDFC0001234'}
                className="w-full py-2.5 px-3.5 rounded-xl border text-xs font-medium focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading || availableBalance < settings.min_withdrawal_amount}
              className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Payout Request'}
            </button>
          </form>
        </div>

        {/* WITHDRAWAL HISTORY TABLE */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Withdrawal History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b">
                <tr>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method &amp; Details</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Requested Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white">{formatPrice(w.amount)}</td>
                    <td className="p-3">
                      <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{w.payment_method}</span>
                      <p className="text-[11px] text-slate-500">{w.payment_details}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadgeClass(w.status)}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{formatDate(w.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

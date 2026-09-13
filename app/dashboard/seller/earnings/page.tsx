'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { store } from '@/lib/store';
import { formatPaise } from '@/lib/wallet';
import { formatPrice } from '@/lib/utils';
import { DollarSign, TrendingUp, Calendar, Wallet, ArrowDownToLine, History, Landmark } from 'lucide-react';

export default function EarningsPage() {
  const { user } = useAuth();
  const sellerId = user?.id || 'user-seller-1';

  const wallet = store.getWallet(sellerId);
  const sales = store.getPurchasesBySeller(sellerId);
  const settings = store.getSettings();

  const totalBaseSales = sales.reduce((sum, s) => sum + (s.base_amount ?? s.amount), 0);
  const totalSellerNet = sales.reduce((sum, s) => sum + (s.seller_net_amount ?? s.seller_amount), 0);
  const platformRate = settings.platform_commission ?? 25;
  const sellerShareRate = 100 - platformRate;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Revenue &amp; Earnings Analytics
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Track your income timeline, commission deductions, and net seller earnings from note sales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/seller/withdrawals"
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Withdraw</span>
          </Link>
          <Link
            href="/dashboard/seller/transactions"
            className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <History className="w-4 h-4" />
            <span>Ledger History</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Available for Payout</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatPaise(wallet.available_balance_paise)}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Reconciled in immutable ledger</span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Sales Count</span>
          <div className="text-3xl font-black text-indigo-600">{sales.length} Purchases</div>
          <span className="text-[10px] text-slate-500 font-bold">Gross: {formatPrice(totalBaseSales)}</span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Withdrawn</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {formatPaise(wallet.total_withdrawn_paise)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Bank &amp; UPI Settlements</span>
        </div>

        <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">
            Lifetime Net Earnings
          </span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatPaise(wallet.total_earned_paise)}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">{sellerShareRate}% seller revenue share ({platformRate}% platform fee)</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Earnings Timeline</h3>
        <div className="h-64 flex items-end justify-between gap-4 pt-8 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          {[
            { month: 'Sep', amount: 80 },
            { month: 'Oct', amount: 150 },
            { month: 'Nov', amount: 320 },
            { month: 'Dec', amount: 540 },
            { month: 'Jan', amount: 890 },
            { month: 'Feb', amount: Math.max(1250, totalSellerNet) },
          ].map((bar) => (
            <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                ₹{bar.amount}
              </span>
              <div
                style={{ height: `${Math.min(100, (bar.amount / 1250) * 100)}%` }}
                className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl group-hover:scale-105 transition-transform"
              />
              <span className="text-xs font-bold text-slate-500">{bar.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

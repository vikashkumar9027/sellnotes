'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { store } from '@/lib/store';
import { formatPaise } from '@/lib/wallet';
import { formatDate } from '@/lib/utils';
import {
  History,
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
} from 'lucide-react';

export default function SellerTransactionsPage() {
  const { user } = useAuth();
  const sellerId = user?.id || 'user-seller-1';

  const [activeFilter, setActiveFilter] = useState<'all' | 'sales' | 'withdrawals' | 'refunds' | 'adjustments'>('all');

  const transactions = store.getWalletTransactions(sellerId);
  const wallet = store.getWallet(sellerId);

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === 'sales') return tx.type === 'SALE_CREDIT';
    if (activeFilter === 'withdrawals') return tx.type === 'WITHDRAWAL_DEBIT' || tx.type === 'WITHDRAWAL_REVERSAL';
    if (activeFilter === 'refunds') return tx.type === 'REFUND_DEBIT';
    if (activeFilter === 'adjustments') return tx.type === 'ADJUSTMENT';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/seller"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Wallet Transaction History
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Immutable ledger of sales credits, withdrawal debits, reversals, and customer refund adjustments.
            </p>
          </div>
        </div>

        <div className="p-3 px-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-right">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            Current Available Balance
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatPaise(wallet.available_balance_paise)}
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Transactions' },
          { id: 'sales', label: 'Sales Credits' },
          { id: 'withdrawals', label: 'Withdrawals & Reversals' },
          { id: 'refunds', label: 'Customer Refunds' },
          { id: 'adjustments', label: 'Adjustments' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px]">
              <tr>
                <th className="p-4">Date &amp; Time</th>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Type</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Order / Reference ID</th>
                <th className="p-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No transactions recorded under this category.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'SALE_CREDIT' || tx.type === 'WITHDRAWAL_REVERSAL';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {tx.id}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${
                          tx.type === 'SALE_CREDIT'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : tx.type === 'WITHDRAWAL_REVERSAL'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}>
                          {isCredit ? <ArrowDownRight className="w-3 h-3 text-emerald-600 shrink-0" /> : <ArrowUpRight className="w-3 h-3 text-rose-600 shrink-0" />}
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`p-4 font-black text-sm ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isCredit ? '+' : '-'}{formatPaise(tx.amount_paise)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          tx.status === 'AVAILABLE' || tx.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {tx.reference_id}
                      </td>
                      <td className="p-4 text-slate-500 text-xs max-w-xs truncate">
                        {tx.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

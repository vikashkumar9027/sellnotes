'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { formatPaise } from '@/lib/wallet';
import { formatDate } from '@/lib/utils';
import { Receipt, Search, ArrowDownRight, ArrowUpRight, RefreshCw, Filter } from 'lucide-react';
import { WalletTransactionType } from '@/types';

export default function SuperAdminLedgerPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const transactions = store.getWalletTransactions();

  const filteredTransactions = transactions.filter((tx) => {
    const seller = store.getUserById(tx.seller_id);
    const matchesSearch =
      tx.id.toLowerCase().includes(search.toLowerCase()) ||
      tx.reference_id.toLowerCase().includes(search.toLowerCase()) ||
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      (seller?.full_name && seller.full_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Platform Wallet Ledger</h1>
          <p className="text-xs text-slate-400">
            Immutable transaction history of every credit, debit, transfer, and reversal calculated in exact integer paise.
          </p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Txn ID, Seller, Reference ID, or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {['all', 'SALE_CREDIT', 'WITHDRAWAL_DEBIT', 'WITHDRAWAL_REVERSAL', 'REFUND_DEBIT'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${
                typeFilter === t
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* LEDGER TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Txn ID / Timestamp</th>
                <th className="p-4">Seller Account</th>
                <th className="p-4">Type</th>
                <th className="p-4">Amount (Paise)</th>
                <th className="p-4">Balance (Before &rarr; After)</th>
                <th className="p-4">Reference &amp; Razorpay IDs</th>
                <th className="p-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No transactions matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const seller = store.getUserById(tx.seller_id);
                  const isCredit = tx.type === 'SALE_CREDIT' || tx.type === 'WITHDRAWAL_REVERSAL';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-[11px] text-slate-300 block">{tx.id}</span>
                        <span className="text-[10px] text-slate-500">{formatDate(tx.created_at)}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{seller?.full_name || 'Seller'}</div>
                        <span className="text-[10px] text-slate-500">{tx.seller_id}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                          tx.type === 'SALE_CREDIT'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : tx.type === 'WITHDRAWAL_REVERSAL'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {isCredit ? <ArrowDownRight className="w-3 h-3 text-emerald-400" /> : <ArrowUpRight className="w-3 h-3 text-rose-400" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className={`p-4 font-black ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'}{formatPaise(tx.amount_paise)}
                        <span className="text-[10px] text-slate-500 block font-mono">({tx.amount_paise} paise)</span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-300">
                        {formatPaise(tx.balance_before_paise)} &rarr;{' '}
                        <span className="font-bold text-white">{formatPaise(tx.balance_after_paise)}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-[11px] text-slate-300">Ref: {tx.reference_id}</div>
                        {tx.razorpay_payment_id && (
                          <span className="text-[10px] text-slate-500 font-mono block">Pay: {tx.razorpay_payment_id}</span>
                        )}
                        {tx.razorpay_order_id && (
                          <span className="text-[10px] text-slate-500 font-mono block">Ord: {tx.razorpay_order_id}</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 text-[11px] max-w-xs truncate">
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

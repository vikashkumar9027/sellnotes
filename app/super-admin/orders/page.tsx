'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { formatPrice, formatDate } from '@/lib/utils';
import { refundTransactionAction } from '@/actions/payments';
import { Search, CreditCard, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SuperAdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const purchases = store.getAllPurchases();
  const transfers = store.getPaymentTransfers();

  const handleRefund = async (purchaseId: string) => {
    if (confirm('Are you sure you want to issue a full refund? Seller ledger will be debited and note access will be revoked.')) {
      setRefundingId(purchaseId);
      await refundTransactionAction({ purchaseId, reason: 'Admin issued refund' });
      setRefundingId(null);
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      p.transaction_id.toLowerCase().includes(search.toLowerCase()) ||
      (p.note?.title && p.note.title.toLowerCase().includes(search.toLowerCase())) ||
      (p.buyer?.full_name && p.buyer.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.seller?.full_name && p.seller.full_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Orders &amp; Payment Ledger</h1>
          <p className="text-xs text-slate-400">
            Real-time audit log of customer checkouts, 25% platform fees, 75% seller net shares, and Razorpay payment/transfer references.
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
            placeholder="Search by Txn ID, Note title, Buyer, or Seller..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-rose-500"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'paid', 'refunded'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${
                statusFilter === s
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Txn / Payment ID</th>
                <th className="p-4">Note &amp; Parties</th>
                <th className="p-4">Gross Amount</th>
                <th className="p-4">Platform Fee (25%)</th>
                <th className="p-4">Seller Net (75%)</th>
                <th className="p-4">Route Transfer</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredPurchases.map((purchase) => {
                const transfer = transfers.find((t) => t.payment_id === purchase.transaction_id);
                const gross = purchase.base_amount ?? purchase.amount;
                const fee = purchase.platform_fee_amount ?? purchase.platform_fee;
                const net = purchase.seller_net_amount ?? purchase.seller_amount;

                return (
                  <tr key={purchase.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-[11px] text-slate-300">
                        {purchase.transaction_id}
                      </div>
                      <span className="text-[10px] text-slate-500">{formatDate(purchase.created_at)}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white max-w-xs truncate">{purchase.note?.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className="text-slate-500">Buyer:</span> {purchase.buyer?.full_name || 'Buyer'}
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-500">Seller:</span> {purchase.seller?.full_name || 'Seller'}
                      </div>
                    </td>
                    <td className="p-4 font-black text-white">
                      {formatPrice(gross)}
                    </td>
                    <td className="p-4 font-black text-rose-400">
                      {formatPrice(fee)}
                    </td>
                    <td className="p-4 font-black text-emerald-400">
                      {formatPrice(net)}
                    </td>
                    <td className="p-4">
                      {transfer ? (
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            transfer.status === 'PROCESSED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {transfer.status}
                          </span>
                          {transfer.transfer_id && (
                            <span className="font-mono text-[10px] text-slate-500 block truncate max-w-[100px]">
                              {transfer.transfer_id}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Wallet Settled</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        purchase.status === 'paid'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {purchase.status === 'paid' ? (
                        <button
                          onClick={() => handleRefund(purchase.id)}
                          disabled={refundingId === purchase.id}
                          className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] font-bold border border-rose-800 inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Refund
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">Refunded</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

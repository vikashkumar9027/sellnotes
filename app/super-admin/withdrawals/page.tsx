'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { formatPaise } from '@/lib/wallet';
import { formatDate } from '@/lib/utils';
import { reviewWithdrawalAction } from '@/actions/super-admin';
import { ArrowDownToLine, CheckCircle2, XCircle, Clock, AlertTriangle, Search, ShieldCheck } from 'lucide-react';

export default function SuperAdminWithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const withdrawals = store.getWithdrawalRequests();

  const handleReview = async (withdrawalId: string, decision: 'APPROVE' | 'REJECT' | 'REVERSE') => {
    let note: string | undefined;
    if (decision === 'REJECT' || decision === 'REVERSE') {
      const reason = prompt('Reason for declining / reversing withdrawal payout:');
      if (!reason) return;
      note = reason;
    }

    setProcessingId(withdrawalId);
    const res = await reviewWithdrawalAction({ withdrawalId, decision, adminNote: note });
    setProcessingId(null);

    if (res.error) {
      alert(res.error);
    } else {
      alert(res.message);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    return statusFilter === 'all' || w.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Seller Withdrawal Management</h1>
          <p className="text-xs text-slate-400">
            Review and execute seller bank/UPI payouts. Rejections automatically restore seller wallet balance via immutable reversal entries.
          </p>
        </div>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="flex flex-wrap gap-2">
        {['all', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED'].map((s) => (
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

      {/* WITHDRAWALS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Request ID</th>
                <th className="p-4">Seller</th>
                <th className="p-4">Payout Amount</th>
                <th className="p-4">Method &amp; Details</th>
                <th className="p-4">Status</th>
                <th className="p-4">Request Date</th>
                <th className="p-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No withdrawal requests matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((w) => {
                  const seller = store.getUserById(w.seller_id);

                  return (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-[11px] text-slate-300">{w.id}</span>
                        {w.admin_note && (
                          <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                            Note: {w.admin_note}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{seller?.full_name || 'Seller'}</div>
                        <span className="text-[11px] text-slate-400">{seller?.email}</span>
                      </td>
                      <td className="p-4 font-black text-emerald-400 text-sm">
                        {formatPaise(w.amount_paise)}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-white uppercase text-[10px] bg-slate-800 px-2 py-0.5 rounded">
                          {w.payout_method}
                        </span>
                        <div className="text-[11px] text-slate-300 mt-1">{w.payout_details}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          w.status === 'SUCCESS'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : w.status === 'PENDING' || w.status === 'PROCESSING'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}>
                          {w.status}
                        </span>
                        {w.failure_reason && (
                          <span className="text-[10px] text-rose-400 block mt-1">
                            {w.failure_reason}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        {formatDate(w.created_at)}
                      </td>
                      <td className="p-4 text-right">
                        {w.status === 'PENDING' || w.status === 'PROCESSING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReview(w.id, 'APPROVE')}
                              disabled={processingId === w.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-bold border border-emerald-800"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(w.id, 'REJECT')}
                              disabled={processingId === w.id}
                              className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] font-bold border border-rose-800"
                            >
                              Decline &amp; Reverse
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Settled</span>
                        )}
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

'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { processWithdrawalAction } from '@/actions/admin';
import { WithdrawalStatus } from '@/types';
import { formatPrice, formatDate, getStatusBadgeClass } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState(() => store.getAllWithdrawals());

  const handleProcess = async (id: string, status: WithdrawalStatus) => {
    await processWithdrawalAction(id, status, 'Processed by admin');
    setWithdrawals([...store.getAllWithdrawals()]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Seller Withdrawal Payouts</h1>
        <p className="text-xs text-slate-500 font-medium">Review and process seller payout transfers to UPI IDs and Bank accounts.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b">
              <tr>
                <th className="p-4">Seller</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method &amp; Details</th>
                <th className="p-4">Requested Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{w.seller?.full_name || 'Seller'}</td>
                  <td className="p-4 font-black text-emerald-600">{formatPrice(w.amount)}</td>
                  <td className="p-4">
                    <span className="font-extrabold uppercase">{w.payment_method}</span>
                    <p className="text-[11px] text-slate-500">{w.payment_details}</p>
                  </td>
                  <td className="p-4 text-slate-500">{formatDate(w.created_at)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusBadgeClass(w.status)}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {w.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleProcess(w.id, 'completed')}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                        >
                          Approve Payout
                        </button>
                        <button
                          onClick={() => handleProcess(w.id, 'rejected')}
                          className="py-1.5 px-3 rounded-lg bg-rose-600 text-white font-bold text-[11px]"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

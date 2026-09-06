'use client';

import React from 'react';
import { store } from '@/lib/store';
import { formatDate, formatPrice } from '@/lib/utils';
import { ShoppingBag, Info } from 'lucide-react';

export default function SalesPage() {
  const sellerId = 'user-seller-1';
  const sales = store.getPurchasesBySeller(sellerId);

  const totalBaseSales = sales.reduce((sum, s) => sum + (s.base_amount ?? s.amount), 0);
  const totalPlatformFees = sales.reduce((sum, s) => sum + (s.platform_fee_amount ?? s.platform_fee), 0);
  const totalNetEarnings = sales.reduce((sum, s) => sum + (s.seller_net_amount ?? s.seller_amount), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Sales &amp; Transaction History</h1>
          <p className="text-xs text-slate-500 font-medium">Detailed breakdown of note base price, 20% platform fee deduction, and your net earnings.</p>
        </div>
      </div>

      {/* SELLER METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Completed Sales</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{sales.length}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Gross Note Sales (Base)</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{formatPrice(totalBaseSales)}</div>
        </div>

        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-1">
          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">Platform Fees (20%)</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">-{formatPrice(totalPlatformFees)}</div>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-1">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Your Net Earnings (80%)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatPrice(totalNetEarnings)}</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <span>
          <strong>Marketplace Pricing Model:</strong> 18% GST paid by buyers at checkout is collected separately for tax compliance and is NOT deducted from your note price. Your net earning is calculated as <strong>Note Base Price - 20% Platform Fee</strong>.
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b">
              <tr>
                <th className="p-4">Note Title</th>
                <th className="p-4">Buyer</th>
                <th className="p-4">Note Price (Base)</th>
                <th className="p-4">Platform Fee (10%)</th>
                <th className="p-4">Your Net Earnings</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{s.note?.title}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{s.buyer?.full_name}</td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{formatPrice(s.base_amount ?? s.amount)}</td>
                  <td className="p-4 text-amber-600 font-semibold">-{formatPrice(s.platform_fee_amount ?? s.platform_fee)}</td>
                  <td className="p-4 font-black text-emerald-600">{formatPrice(s.seller_net_amount ?? s.seller_amount)}</td>
                  <td className="p-4 text-slate-500">{formatDate(s.created_at)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      s.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {s.status}
                    </span>
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

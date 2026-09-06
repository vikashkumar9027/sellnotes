'use client';

import React from 'react';
import { store } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { DollarSign, TrendingUp, Calendar, Wallet } from 'lucide-react';

export default function EarningsPage() {
  const sellerId = 'user-seller-1';
  const sales = store.getPurchasesBySeller(sellerId);
  const totalRevenue = sales.reduce((sum, s) => sum + s.seller_amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Revenue &amp; Earnings Analytics</h1>
        <p className="text-xs text-slate-500 font-medium">Track your income timeline across daily, weekly, and monthly note sales.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Today</span>
          <div className="text-3xl font-black text-indigo-600">₹44.10</div>
          <span className="text-[10px] text-emerald-600 font-bold">+100% vs yesterday</span>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">This Week</span>
          <div className="text-3xl font-black text-indigo-600">₹315.00</div>
          <span className="text-[10px] text-emerald-600 font-bold">7 Sales</span>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">This Month</span>
          <div className="text-3xl font-black text-indigo-600">₹1,450.00</div>
          <span className="text-[10px] text-emerald-600 font-bold">32 Sales</span>
        </div>
        <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 space-y-2">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">All-Time Revenue</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatPrice(totalRevenue)}</div>
          <span className="text-[10px] text-emerald-600 font-bold">90% seller revenue share</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Earnings Timeline</h3>
        <div className="h-64 flex items-end justify-between gap-4 pt-8 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed">
          {[
            { month: 'Sep', amount: 80 },
            { month: 'Oct', amount: 150 },
            { month: 'Nov', amount: 320 },
            { month: 'Dec', amount: 540 },
            { month: 'Jan', amount: 890 },
            { month: 'Feb', amount: 1250 },
          ].map((bar) => (
            <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">₹{bar.amount}</span>
              <div
                style={{ height: `${(bar.amount / 1250) * 100}%` }}
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

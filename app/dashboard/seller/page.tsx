'use client';

import React from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { PlusCircle, FileText, CheckCircle2, Clock, DollarSign, Wallet, ArrowUpRight, ShoppingBag, Info } from 'lucide-react';
import { formatPrice, formatDate, getStatusBadgeClass } from '@/lib/utils';

export default function SellerDashboardPage() {
  const sellerId = 'user-seller-1';
  const notes = store.getNotesBySeller(sellerId);
  const sales = store.getPurchasesBySeller(sellerId);
  const withdrawals = store.getWithdrawalsBySeller(sellerId);

  const approvedCount = notes.filter((n) => n.status === 'approved').length;
  const pendingCount = notes.filter((n) => n.status === 'pending').length;

  const totalSalesCount = sales.length;
  const totalBaseSales = sales.reduce((sum, s) => sum + (s.base_amount ?? s.amount), 0);
  const totalPlatformFees = sales.reduce((sum, s) => sum + (s.platform_fee_amount ?? s.platform_fee), 0);
  const totalNetRevenue = sales.reduce((sum, s) => sum + (s.seller_net_amount ?? s.seller_amount), 0);

  const completedWithdrawn = withdrawals
    .filter((w) => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingWithdrawn = withdrawals
    .filter((w) => w.status === 'pending' || w.status === 'processing')
    .reduce((sum, w) => sum + w.amount, 0);

  const availableBalance = totalNetRevenue - completedWithdrawn - pendingWithdrawn;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
            Seller Portal
          </span>
          <h1 className="text-3xl font-black">Seller Dashboard</h1>
          <p className="text-xs text-slate-300">Track your uploaded study notes, sales metrics, platform commission deductions, and payout balance.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/seller/upload"
            className="py-3 px-6 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Upload New Note
          </Link>
          <Link
            href="/dashboard/seller/withdrawals"
            className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition-colors"
          >
            Request Payout
          </Link>
        </div>
      </div>

      {/* OVERVIEW METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Available Balance</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatPrice(availableBalance)}
          </div>
          <span className="text-[10px] text-slate-400">Ready for withdrawal</span>
        </div>

        <div className="col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Net Revenue (80%)</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {formatPrice(totalNetRevenue)}
          </div>
          <span className="text-[10px] text-slate-400">From {totalSalesCount} total purchases</span>
        </div>

        <div className="col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Withdrawn Amount</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatPrice(completedWithdrawn)}
          </div>
          <span className="text-[10px] text-amber-500 font-semibold">Pending payout: {formatPrice(pendingWithdrawn)}</span>
        </div>

        <div className="col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Note Uploads</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {notes.length}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">{approvedCount} Approved • {pendingCount} Pending</span>
        </div>
      </div>

      {/* QUICK SELLER LINKS & MY NOTES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">My Uploaded Notes</h3>
            <Link href="/dashboard/seller/notes" className="text-xs font-bold text-indigo-600 hover:underline">
              Manage All Notes &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notes.map((note) => (
              <div key={note.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getStatusBadgeClass(note.status)}`}>
                      {note.status}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">{note.subject}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{note.title}</h4>
                  <p className="text-xs text-slate-500">{note.downloads} Downloads • Note Base Price: {formatPrice(note.price, note.is_free)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/notes/${note.slug}`}
                    className="py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT SALES LOG */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Recent Sales</h3>
            <Link href="/dashboard/seller/sales" className="text-xs font-bold text-indigo-600 hover:underline">
              Sales History &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {sales.map((s) => (
              <div key={s.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 space-y-1 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-white truncate max-w-[160px]">{s.buyer?.full_name || 'Student Buyer'}</span>
                  <span className="text-emerald-600">+{formatPrice(s.seller_net_amount ?? s.seller_amount)}</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">{s.note?.title}</p>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                  <span>Price: {formatPrice(s.base_amount ?? s.amount)} (Fee: -{formatPrice(s.platform_fee_amount ?? s.platform_fee)})</span>
                  <span>{formatDate(s.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

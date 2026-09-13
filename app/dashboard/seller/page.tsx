'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { formatPaise } from '@/lib/wallet';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  PlusCircle,
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ShoppingBag,
  History,
  ArrowDownToLine,
  Landmark,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const sellerId = user?.id || 'user-seller-1';

  const wallet = store.getWallet(sellerId);
  const account = store.getSellerAccount(sellerId);
  const [notes, setNotes] = useState(() => store.getNotesBySeller(sellerId));
  const sales = store.getPurchasesBySeller(sellerId);
  const settings = store.getSettings();

  useEffect(() => {
    setNotes(store.getNotesBySeller(sellerId));
    fetch('/api/notes')
      .then((r) => r.json())
      .then((d) => {
        if (d.notes && Array.isArray(d.notes)) {
          store.syncNotes(d.notes);
          setNotes(store.getNotesBySeller(sellerId));
        }
      })
      .catch(() => {});

    const handleUpdate = () => setNotes(store.getNotesBySeller(sellerId));
    window.addEventListener('notemart_notes_updated', handleUpdate);
    return () => window.removeEventListener('notemart_notes_updated', handleUpdate);
  }, [sellerId]);

  const approvedNotes = notes.filter((n) => n.status === 'approved');
  const pendingNotes = notes.filter((n) => n.status === 'pending');

  const totalSalesCount = sales.length;
  const totalBaseSales = sales.reduce((sum, s) => sum + (s.base_amount ?? s.amount), 0);
  const totalPlatformFees = sales.reduce((sum, s) => sum + (s.platform_fee_amount ?? s.platform_fee), 0);
  const totalNetEarnings = sales.reduce((sum, s) => sum + (s.seller_net_amount ?? s.seller_amount), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <span>Verified Seller Portal</span>
            {account?.onboarding_status === 'VERIFIED' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-black">
                <CheckCircle2 className="w-3 h-3" /> Payout Active
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Seller Dashboard &amp; Wallet</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Immutable earnings ledger, transparent 25% platform revenue share, and verified bank/UPI payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/seller/upload"
            className="py-3 px-5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Upload New Note
          </Link>
          <Link
            href="/dashboard/seller/payout-setup"
            className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition-colors flex items-center gap-2"
          >
            <Landmark className="w-4 h-4" /> Payout Account Setup
          </Link>
        </div>
      </div>

      {/* 1. SELLER WALLET SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">My Wallet</h2>
              <p className="text-xs text-slate-500">Immutable ledger reconciled in exact integer paise.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/seller/withdrawals"
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Withdraw Money</span>
            </Link>
            <Link
              href="/dashboard/seller/transactions"
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <History className="w-4 h-4" />
              <span>Transaction History</span>
            </Link>
          </div>
        </div>

        {/* 4 WALLET METRICS TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              Available Balance
            </span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {formatPaise(wallet.available_balance_paise)}
            </div>
            <span className="text-[11px] text-slate-500">Ready for immediate withdrawal</span>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              Pending Balance
            </span>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {formatPaise(wallet.pending_balance_paise)}
            </div>
            <span className="text-[11px] text-slate-500">Settling / route transfer in progress</span>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider block">
              Total Earned
            </span>
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {formatPaise(wallet.total_earned_paise)}
            </div>
            <span className="text-[11px] text-slate-500">Net seller earnings after 25% fee</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Total Withdrawn
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {formatPaise(wallet.total_withdrawn_paise)}
            </div>
            <span className="text-[11px] text-slate-500">Successfully sent to bank / UPI</span>
          </div>
        </div>
      </div>

      {/* OVERVIEW SALES & UPLOADS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Note Sales</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalSalesCount} Purchases</div>
          <span className="text-[10px] text-emerald-600 font-semibold">{formatPrice(totalBaseSales)} Gross</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Platform Commission</span>
          <div className="text-2xl font-black text-rose-600">{formatPrice(totalPlatformFees)}</div>
          <span className="text-[10px] text-slate-400">{settings.platform_commission ?? 25}% Platform deduction</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Seller Net Revenue</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatPrice(totalNetEarnings)}</div>
          <span className="text-[10px] text-indigo-500 font-semibold">75% Net Seller Share</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Uploaded Notes</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{notes.length} Study Notes</div>
          <span className="text-[10px] text-slate-400">{approvedNotes.length} Live &bull; {pendingNotes.length} In Review</span>
        </div>
      </div>

      {/* RECENT SALES LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Recent Note Sales</h3>
          <Link
            href="/dashboard/seller/sales"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All Sales</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Note Title</th>
                <th className="p-3">Buyer Paid</th>
                <th className="p-3">Platform Fee (25%)</th>
                <th className="p-3">Your Net Earning (75%)</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No sales recorded yet. Upload notes to start earning!
                  </td>
                </tr>
              ) : (
                sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-slate-500">{formatDate(sale.created_at)}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {sale.note?.title}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {formatPrice(sale.base_amount ?? sale.amount)}
                    </td>
                    <td className="p-3 text-rose-600 font-bold">
                      -{formatPrice(sale.platform_fee_amount ?? sale.platform_fee)}
                    </td>
                    <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">
                      {formatPrice(sale.seller_net_amount ?? sale.seller_amount)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

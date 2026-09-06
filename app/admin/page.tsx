'use client';

import React from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { Shield, Users, FileText, CheckCircle2, AlertTriangle, DollarSign, Wallet, Flag, Settings, ArrowRight, Receipt, RefreshCw, XCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { refundTransactionAction } from '@/actions/payments';

export default function AdminDashboardPage() {
  const users = store.getUsers();
  const notes = store.getNotes();
  const allPurchases = store.getAllPurchases();
  const withdrawals = store.getAllWithdrawals();
  const reports = store.getReports();

  const pendingNotes = notes.filter((n) => n.status === 'pending');
  const approvedNotes = notes.filter((n) => n.status === 'approved');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');

  const paidPurchases = allPurchases.filter((p) => p.status === 'paid');
  const refundedPurchases = allPurchases.filter((p) => p.status === 'refunded');

  // Exact Financial Totals
  const totalBaseSales = paidPurchases.reduce((sum, p) => sum + (p.base_amount ?? p.amount), 0);
  const totalPlatformCommission = paidPurchases.reduce((sum, p) => sum + (p.platform_fee_amount ?? p.platform_fee), 0);
  const totalGstCollected = paidPurchases.reduce((sum, p) => sum + (p.gst_amount ?? (p.base_amount * 0.18)), 0);
  const totalBuyerPayments = paidPurchases.reduce((sum, p) => sum + (p.buyer_total_amount ?? (p.base_amount * 1.18)), 0);
  const totalSellerNetEarnings = paidPurchases.reduce((sum, p) => sum + (p.seller_net_amount ?? p.seller_amount), 0);
  const totalRefundedAmount = refundedPurchases.reduce((sum, p) => sum + (p.buyer_total_amount ?? p.amount), 0);

  const handleProcessRefund = async (purchaseId: string) => {
    if (confirm('Are you sure you want to process a full refund for this transaction? This will reverse seller earnings and revoke buyer access.')) {
      await refundTransactionAction({ purchaseId, reason: 'Admin requested refund' });
      alert('Refund processed successfully.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ADMIN HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rose-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-800/60">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-900 text-rose-300 text-xs font-black uppercase">
            <Shield className="w-3.5 h-3.5" /> NoteMart Central Administration
          </div>
          <h1 className="text-3xl font-black">Platform Control &amp; Financial Dashboard</h1>
          <p className="text-xs text-rose-200">Monitor financial accounting (GMV, Platform Commission, GST Collected), users, note moderation, and payouts.</p>
        </div>

        <Link
          href="/admin/settings"
          className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition-colors flex items-center gap-2"
        >
          <Settings className="w-4 h-4" /> Global Settings &amp; Rates
        </Link>
      </div>

      {/* FINANCIAL AUDIT BREAKDOWN CARDS */}
      <div className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-indigo-600" /> Financial Revenue &amp; Tax Accounting Summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Base Sales (GMV)</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{formatPrice(totalBaseSales)}</div>
            <span className="text-[10px] text-slate-500">100% Note Base Sales</span>
          </div>

          <div className="p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">Platform Commission</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatPrice(totalPlatformCommission)}</div>
            <span className="text-[10px] text-indigo-600 font-bold">20% Platform Revenue</span>
          </div>

          <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">GST Collected (18%)</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatPrice(totalGstCollected)}</div>
            <span className="text-[10px] font-bold text-amber-700">Tax Liability (Not Platform Profit)</span>
          </div>

          <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">Seller Net Earnings</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatPrice(totalSellerNetEarnings)}</div>
            <span className="text-[10px] font-bold text-emerald-600">80% Net Seller Payout</span>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-md space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Buyer Payments</span>
            <div className="text-2xl font-black text-amber-400">{formatPrice(totalBuyerPayments)}</div>
            <span className="text-[10px] text-slate-300">Base Sales + GST Collected</span>
          </div>
        </div>
      </div>

      {/* OPERATIONAL METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Link href="/admin/users" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 hover:border-indigo-500 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Users</span>
          <div className="text-xl font-black text-slate-900 dark:text-white">{users.length}</div>
        </Link>

        <Link href="/admin/notes" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 hover:border-indigo-500 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Notes</span>
          <div className="text-xl font-black text-slate-900 dark:text-white">{notes.length}</div>
        </Link>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Successful Txns</span>
          <div className="text-xl font-black text-emerald-600">{paidPurchases.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Refunds Processed</span>
          <div className="text-xl font-black text-rose-600">{refundedPurchases.length} ({formatPrice(totalRefundedAmount)})</div>
        </div>

        <Link href="/admin/withdrawals" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 hover:border-indigo-500 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Payouts</span>
          <div className="text-xl font-black text-amber-600">{pendingWithdrawals.length}</div>
        </Link>

        <Link href="/admin/reports" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 hover:border-indigo-500 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Flagged Reports</span>
          <div className="text-xl font-black text-slate-900 dark:text-white">{reports.length}</div>
        </Link>
      </div>

      {/* RECENT FINANCIAL TRANSACTIONS & AUDIT LOG */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Recent Transactions &amp; GST Audit Log</h3>
            <p className="text-xs text-slate-500">Every transaction permanently records historical GST, platform fees, and net payouts.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b">
              <tr>
                <th className="p-3">Txn ID</th>
                <th className="p-3">Note Title</th>
                <th className="p-3">Buyer Base</th>
                <th className="p-3">GST (18%)</th>
                <th className="p-3">Buyer Paid</th>
                <th className="p-3">Platform Fee (10%)</th>
                <th className="p-3">Seller Net</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {allPurchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono text-[11px] text-slate-500">{p.transaction_id.substring(0, 12)}...</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white max-w-[180px] truncate">{p.note?.title}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{formatPrice(p.base_amount ?? p.amount)}</td>
                  <td className="p-3 text-amber-600 font-bold">+{formatPrice(p.gst_amount ?? (p.base_amount * 0.18))}</td>
                  <td className="p-3 font-black text-indigo-600">{formatPrice(p.buyer_total_amount ?? (p.base_amount * 1.18))}</td>
                  <td className="p-3 text-indigo-600 font-bold">{formatPrice(p.platform_fee_amount ?? p.platform_fee)}</td>
                  <td className="p-3 font-black text-emerald-600">{formatPrice(p.seller_net_amount ?? p.seller_amount)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      p.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {p.status === 'paid' ? (
                      <button
                        onClick={() => handleProcessRefund(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center gap-1 border border-rose-200"
                      >
                        <RefreshCw className="w-3 h-3" /> Refund
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">Refunded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIN NAVIGATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Note Moderation Queue', desc: 'Approve or reject newly uploaded student notes.', link: '/admin/notes', badge: `${pendingNotes.length} Pending` },
          { title: 'User & Seller Management', desc: 'View profiles, change user roles, or suspend violators.', link: '/admin/users', badge: `${users.length} Users` },
          { title: 'Seller Payout Approvals', desc: 'Process seller withdrawal requests to UPI / Bank accounts.', link: '/admin/withdrawals', badge: `${pendingWithdrawals.length} Pending` },
          { title: 'Manage Categories', desc: 'Create and update subject categories and descriptions.', link: '/admin/categories', badge: '14 Domains' },
          { title: 'Copyright & Reports Queue', desc: 'Review user-submitted copyright and quality flags.', link: '/admin/reports', badge: `${reports.length} Reports` },
          { title: 'Platform Settings & Rates', desc: 'Configure platform commission %, GST %, price caps, and auto-approval.', link: '/admin/settings', badge: 'Settings' }
        ].map((item, idx) => (
          <Link
            key={idx}
            href={item.link}
            className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:shadow-xl transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                {item.title}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {item.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500">{item.desc}</p>
            <div className="flex items-center gap-1 text-xs font-bold text-rose-600">
              <span>Open Panel</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

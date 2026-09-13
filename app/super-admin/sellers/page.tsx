'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { formatPaise } from '@/lib/wallet';
import { formatPrice } from '@/lib/utils';
import { updateSellerOnboardingStatusAction } from '@/actions/super-admin';
import { Briefcase, CheckCircle2, Clock, AlertTriangle, XCircle, Search, ExternalLink, Shield } from 'lucide-react';
import { SellerOnboardingStatus } from '@/types';

export default function SuperAdminSellersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const users = store.getUsers();
  const sellers = users.filter((u) => u.role === 'seller');
  const purchases = store.getAllPurchases();

  const handleUpdateStatus = async (sellerId: string, newStatus: SellerOnboardingStatus) => {
    setUpdatingId(sellerId);
    await updateSellerOnboardingStatusAction(sellerId, newStatus);
    setUpdatingId(null);
  };

  const filteredSellers = sellers.filter((seller) => {
    const account = store.getSellerAccount(seller.id);
    const matchesSearch =
      seller.full_name.toLowerCase().includes(search.toLowerCase()) ||
      seller.email.toLowerCase().includes(search.toLowerCase()) ||
      (account?.legal_business_name && account.legal_business_name.toLowerCase().includes(search.toLowerCase()));

    const status = account?.onboarding_status || 'NOT_STARTED';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Seller Accounts &amp; Razorpay Route</h1>
          <p className="text-xs text-slate-400">
            Monitor seller KYC verification, linked account statuses, net earnings, and payout eligibility.
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
            placeholder="Search by seller name, business name, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {['all', 'VERIFIED', 'SUBMITTED', 'PENDING', 'REJECTED', 'SUSPENDED'].map((s) => (
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

      {/* SELLERS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Seller Details</th>
                <th className="p-4">Razorpay Linked ID</th>
                <th className="p-4">Onboarding Status</th>
                <th className="p-4">Payout Method (Masked)</th>
                <th className="p-4">Available Balance</th>
                <th className="p-4">Lifetime Earned</th>
                <th className="p-4 text-right">Verification Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredSellers.map((seller) => {
                const account = store.getSellerAccount(seller.id);
                const wallet = store.getWallet(seller.id);
                const status: SellerOnboardingStatus = account?.onboarding_status || 'NOT_STARTED';

                return (
                  <tr key={seller.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{seller.full_name}</span>
                          {account?.legal_business_name && account.legal_business_name !== seller.full_name && (
                            <span className="text-[10px] text-slate-400">({account.legal_business_name})</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{seller.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {account?.razorpay_account_id ? (
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {account.razorpay_account_id}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Not Linked</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        status === 'VERIFIED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : status === 'SUBMITTED' || status === 'PENDING'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      {account?.upi_vpa ? (
                        <div>
                          <span className="font-bold text-[10px] uppercase text-indigo-400">UPI:</span> {account.upi_vpa}
                        </div>
                      ) : account?.bank_account_number_last4 ? (
                        <div>
                          <span className="font-bold text-[10px] uppercase text-indigo-400">Bank:</span> A/C ••••••••{account.bank_account_number_last4}
                          <span className="text-[10px] text-slate-500 block">IFSC: {account.bank_ifsc}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">None Provided</span>
                      )}
                    </td>
                    <td className="p-4 font-black text-emerald-400">
                      {formatPaise(wallet.available_balance_paise)}
                    </td>
                    <td className="p-4 font-black text-white">
                      {formatPaise(wallet.total_earned_paise)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {status !== 'VERIFIED' && (
                          <button
                            onClick={() => handleUpdateStatus(seller.id, 'VERIFIED')}
                            disabled={updatingId === seller.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-bold border border-emerald-800"
                          >
                            Verify
                          </button>
                        )}
                        {status !== 'SUSPENDED' && (
                          <button
                            onClick={() => handleUpdateStatus(seller.id, 'SUSPENDED')}
                            disabled={updatingId === seller.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] font-bold border border-rose-800"
                          >
                            Suspend
                          </button>
                        )}
                        {status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleUpdateStatus(seller.id, 'VERIFIED')}
                            disabled={updatingId === seller.id}
                            className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-[11px] font-bold border border-indigo-800"
                          >
                            Unsuspend
                          </button>
                        )}
                      </div>
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

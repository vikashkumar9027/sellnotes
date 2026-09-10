'use client';

import React from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { ShoppingBag, Heart, Download, User, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function BuyerDashboardPage() {
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id || 'user-student-1';
  const user = authUser || store.getUserById(currentUserId);
  const purchases = store.getPurchasesByUser(currentUserId);
  const wishlist = store.getWishlistByUser(currentUserId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
            alt={user?.full_name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500"
          />
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Welcome back, {user?.full_name}!
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {user?.college || 'College of Engineering Pune'} • {user?.course || 'B.Tech Mechanical'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Edit Profile
          </Link>
          <Link
            href="/dashboard/seller/upload"
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors"
          >
            Switch to Seller
          </Link>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link href="/dashboard/purchases" className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Purchases</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{purchases.length}</div>
          <span className="text-xs text-emerald-600 font-semibold block">Instant PDF downloads &rarr;</span>
        </Link>

        <Link href="/dashboard/wishlist" className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:shadow-lg transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Wishlist</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{wishlist.length}</div>
          <span className="text-xs text-rose-500 font-semibold block">Saved notes &rarr;</span>
        </Link>

        <Link href="/notes" className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:shadow-lg transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Explore Notes</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">Marketplace</div>
          <span className="text-xs text-amber-600 font-semibold block">Browse study materials &rarr;</span>
        </Link>
      </div>

      {/* RECENT PURCHASES LOG */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Recent Purchased Notes</h3>
          <Link href="/dashboard/purchases" className="text-xs font-bold text-indigo-600 hover:underline">
            View All Purchases
          </Link>
        </div>

        {purchases.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {purchases.map((p) => (
              <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.note?.title}</h4>
                    <p className="text-xs text-slate-500">{p.note?.subject} • Purchased on {formatDate(p.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900 dark:text-white">{formatPrice(p.amount)}</span>
                  <Link
                    href={`/notes/${p.note?.slug}`}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">You haven&apos;t purchased any paid notes yet.</p>
        )}
      </div>
    </div>
  );
}

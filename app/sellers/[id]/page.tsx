'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import NoteCard from '@/components/notes/NoteCard';
import { Star, Download, BookOpen, GraduationCap, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SellerProfilePage() {
  const params = useParams();
  const sellerId = params.id as string;

  const seller = store.getUserById(sellerId) || store.getUsers()[0];
  const sellerNotes = store.getNotesBySeller(seller.id).filter((n) => n.status === 'approved');
  const sales = store.getPurchasesBySeller(seller.id);

  const totalDownloads = sellerNotes.reduce((sum, n) => sum + n.downloads, 0);
  const avgRating = sellerNotes.length > 0
    ? (sellerNotes.reduce((sum, n) => sum + n.average_rating, 0) / sellerNotes.length).toFixed(1)
    : '5.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* SELLER HEADER CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src={seller.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
            alt={seller.full_name}
            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500 shadow-md"
          />

          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{seller.full_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Student Seller
              </span>
            </div>

            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {seller.university} • {seller.college} ({seller.course})
            </p>

            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {seller.bio || 'Top university student sharing high quality handwritten notes.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
              <span>Member since {formatDate(seller.created_at)}</span>
            </div>
          </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Published Notes</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{sellerNotes.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Downloads</span>
            <span className="text-xl font-black text-indigo-600">{totalDownloads}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Average Rating</span>
            <span className="text-xl font-black text-amber-500">{avgRating} ★</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Sales</span>
            <span className="text-xl font-black text-emerald-600">{sales.length}</span>
          </div>
        </div>
      </div>

      {/* SELLER'S PUBLISHED NOTES */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Notes by {seller.full_name} ({sellerNotes.length})
        </h2>

        {sellerNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sellerNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No notes published by this seller yet.</p>
        )}
      </div>
    </div>
  );
}

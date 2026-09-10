'use client';

import React from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { Download, BookOpen, ArrowRight } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { getSecureDownloadUrl } from '@/actions/notes';
import { useAuth } from '@/context/AuthContext';

export default function PurchasesPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || 'user-student-1';
  const purchases = store.getPurchasesByUser(currentUserId);

  const handleDownload = async (noteId: string, title: string) => {
    const res = await getSecureDownloadUrl(currentUserId, noteId);
    if (res.success && res.downloadUrl) {
      const link = document.createElement('a');
      link.href = res.downloadUrl;
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(res.error || 'Failed to download file.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">My Purchased Notes</h1>
          <p className="text-xs text-slate-500 font-medium">Access and redownload your purchased study materials anytime.</p>
        </div>
      </div>

      {purchases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {purchases.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-600 font-bold">
                  <span>{p.note?.subject}</span>
                  <span className="text-slate-400 font-normal">Purchased: {formatDate(p.created_at)}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{p.note?.title}</h3>
                <p className="text-xs text-slate-500">{p.note?.university} • {p.note?.course}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatPrice(p.amount)}</span>
                <button
                  onClick={() => p.note && handleDownload(p.note.id, p.note.title)}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-md"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-indigo-500 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Purchases Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Explore handwritten notes on the marketplace and upgrade your semester exam preparation.</p>
          <Link href="/notes" className="inline-block py-2.5 px-6 rounded-xl bg-indigo-600 text-white font-bold text-xs">
            Browse Notes
          </Link>
        </div>
      )}
    </div>
  );
}

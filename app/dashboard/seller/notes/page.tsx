'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { PlusCircle, Eye, Trash2, CheckCircle2 } from 'lucide-react';
import { formatPrice, formatDate, getStatusBadgeClass } from '@/lib/utils';
import { Note } from '@/types';

export default function SellerNotesPage() {
  const sellerId = 'user-seller-1';
  const [notes, setNotes] = useState<Note[]>([]);

  const refreshNotes = () => {
    setNotes(store.getNotesBySeller(sellerId));
  };

  useEffect(() => {
    refreshNotes();
  }, []);

  const handleDelete = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      store.deleteNote(noteId);
      refreshNotes();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">My Uploaded Notes</h1>
          <p className="text-xs text-slate-500 font-medium">Manage, view live, edit, or track performance of your handwritten notes.</p>
        </div>
        <Link
          href="/dashboard/seller/upload"
          className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 self-start shadow-md"
        >
          <PlusCircle className="w-4 h-4" /> Upload New Note
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b">
              <tr>
                <th className="p-4">Title &amp; Subject</th>
                <th className="p-4">Status</th>
                <th className="p-4">Price</th>
                <th className="p-4">Downloads</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <tr key={note.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 dark:text-white line-clamp-1">{note.title}</div>
                      <div className="text-[11px] text-indigo-600 font-medium">{note.subject} • {note.university}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusBadgeClass(note.status)}`}>
                        {note.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{formatPrice(note.price, note.is_free)}</td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">{note.downloads}</td>
                    <td className="p-4 text-slate-500">{formatDate(note.created_at)}</td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/notes/${note.slug}`}
                        className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 inline-flex items-center gap-1 text-xs font-bold"
                        title="View Live Note"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Live
                      </Link>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 inline-block"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No uploaded notes found. <Link href="/dashboard/seller/upload" className="text-indigo-600 underline font-bold">Upload your first note here</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

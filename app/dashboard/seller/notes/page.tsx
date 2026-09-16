'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { PlusCircle, Eye, Trash2, CheckCircle2, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { formatPrice, formatDate, getStatusBadgeClass } from '@/lib/utils';
import { Note } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { deleteNoteAction } from '@/actions/notes';
import { deletePdfFromIndexedDB } from '@/lib/pdf-storage';

export default function SellerNotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMyNotes = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const res = await fetch('/api/notes/my', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.notes && Array.isArray(data.notes)) {
          // Format notes
          const mappedNotes: Note[] = data.notes.map((n: any) => ({
            id: n.id || n._id,
            title: n.title,
            slug: n.slug,
            description: n.description || '',
            subject: n.subject || '',
            university: n.university || '',
            college: n.college || '',
            course: n.course || '',
            semester: n.semester || '',
            price: n.price || 0,
            is_free: Boolean(n.is_free),
            page_count: n.page_count || 1,
            downloads: n.downloads || 0,
            views: n.views || 0,
            rating: n.rating || 5.0,
            status: n.status || 'approved',
            seller_id: user?.id || (n.seller?._id || n.seller),
            pdf_path: n.pdf_path || '',
            storage_key: n.storage_key || '',
            created_at: n.createdAt || n.created_at || new Date().toISOString(),
          }));
          setNotes(mappedNotes);
          return;
        }
      }

      // If server returned unauthenticated, clear notes
      setNotes([]);
    } catch (err) {
      console.error('Error fetching my notes:', err);
      setErrorMsg('Failed to fetch your uploaded notes.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMyNotes();
    }

    const handleUpdated = () => fetchMyNotes();
    window.addEventListener('notemart_notes_updated', handleUpdated);

    return () => {
      window.removeEventListener('notemart_notes_updated', handleUpdated);
    };
  }, [user, fetchMyNotes]);

  const handleDelete = async (note: Note) => {
    if (!confirm(`Are you sure you want to delete "${note.title}"? This will permanently remove the note and its original PDF file from your account.`)) {
      return;
    }

    setDeletingId(note.id);
    try {
      const res = await deleteNoteAction(note.id, user?.id, user?.role);
      if (res.error && !res.error.toLowerCase().includes('not found')) {
        alert(res.error);
      } else {
        await deletePdfFromIndexedDB([note.slug, note.id, note.pdf_path, note.storage_key, note.title]);
        store.deleteNote(note.id);
        store.deleteNote(note.slug);
        setNotes((prev) => prev.filter((n) => n.id !== note.id && n.slug !== note.slug));
        window.dispatchEvent(new Event('notemart_notes_updated'));
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
      await deletePdfFromIndexedDB([note.slug, note.id, note.pdf_path, note.storage_key, note.title]);
      store.deleteNote(note.id);
      store.deleteNote(note.slug);
      setNotes((prev) => prev.filter((n) => n.id !== note.id && n.slug !== note.slug));
      window.dispatchEvent(new Event('notemart_notes_updated'));
    } finally {
      setDeletingId(null);
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
          className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 self-start shadow-md transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" /> Upload New Note
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

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
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                      <span className="text-xs font-semibold">Loading your uploaded notes from MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : notes.length > 0 ? (
                notes.map((note) => (
                  <tr key={note.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 dark:text-white line-clamp-1">{note.title}</div>
                      <div className="text-[11px] text-indigo-600 font-medium">{note.subject} • {note.university || note.course}</div>
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
                        onClick={() => handleDelete(note)}
                        disabled={deletingId === note.id}
                        className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 inline-block disabled:opacity-50 transition-colors cursor-pointer"
                        title="Delete Note"
                      >
                        {deletingId === note.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">You haven&apos;t uploaded any study notes yet.</p>
                      <Link
                        href="/dashboard/seller/upload"
                        className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
                      >
                        Upload Your First Note Now
                      </Link>
                    </div>
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


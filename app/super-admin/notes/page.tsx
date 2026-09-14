'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { moderateNoteSuperAdminAction } from '@/actions/super-admin';
import { deleteNoteAction } from '@/actions/notes';
import { deletePdfFromIndexedDB } from '@/lib/pdf-storage';
import { formatPrice } from '@/lib/utils';
import { Note } from '@/types';
import { Search, CheckCircle2, XCircle, Trash2, Eye, Download, BookOpen, ExternalLink, Loader2 } from 'lucide-react';

export default function SuperAdminNotesPage() {
  const [notesList, setNotesList] = useState<Note[]>(() => store.getNotes());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const purchases = store.getAllPurchases();

  useEffect(() => {
    fetch('/api/notes')
      .then((res) => res.json())
      .then((data) => {
        if (data.notes && Array.isArray(data.notes)) {
          store.syncNotes(data.notes);
          setNotesList([...store.getNotes()]);
        }
      })
      .catch((err) => console.warn('Failed to sync super admin notes:', err));
  }, []);

  const handleModerate = async (noteId: string, status: 'approved' | 'rejected') => {
    let reason: string | undefined;
    if (status === 'rejected') {
      const input = prompt('Please enter rejection reason (e.g. copyright flag, blurred pages, invalid subject):');
      if (!input) return;
      reason = input;
    }

    setProcessingId(noteId);
    await moderateNoteSuperAdminAction(noteId, status, reason);
    setNotesList([...store.getNotes()]);
    setProcessingId(null);
  };

  const handleDeleteNote = async (note: Note) => {
    if (!confirm(`Are you sure you want to permanently delete "${note.title}"? This will delete the database record and the original PDF file from all storage tiers.`)) {
      return;
    }

    setProcessingId(note.id);
    try {
      const res = await deleteNoteAction(note.id, 'user-super-admin', 'admin');
      if (res.error && !res.alreadyDeleted) {
        alert(res.error);
      } else {
        await deletePdfFromIndexedDB([note.slug, note.id, note.pdf_path, note.storage_key, note.title]);
        store.deleteNote(note.id);
        store.deleteNote(note.slug);
        setNotesList((prev) => prev.filter((n) => n.id !== note.id && n.slug !== note.slug));
        window.dispatchEvent(new Event('notemart_notes_updated'));
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
      await deletePdfFromIndexedDB([note.slug, note.id, note.pdf_path, note.storage_key, note.title]);
      store.deleteNote(note.id);
      store.deleteNote(note.slug);
      setNotesList((prev) => prev.filter((n) => n.id !== note.id && n.slug !== note.slug));
      window.dispatchEvent(new Event('notemart_notes_updated'));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredNotes = notesList.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.subject.toLowerCase().includes(search.toLowerCase()) ||
      n.university.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Study Notes Moderation &amp; Catalog</h1>
          <p className="text-xs text-slate-400">
            Review submitted student notes, approve for public listing, monitor downloads, and enforce copyright policies.
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
            placeholder="Search by note title, subject, or university..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-rose-500"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
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

      {/* NOTES TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Note Title</th>
                <th className="p-4">Author / Seller</th>
                <th className="p-4">Subject &amp; University</th>
                <th className="p-4">Price</th>
                <th className="p-4">Sales / Downloads</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredNotes.map((note) => {
                const notePurchases = purchases.filter((p) => p.note_id === note.id && p.status === 'paid');
                const seller = store.getUserById(note.seller_id);

                return (
                  <tr key={note.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={note.thumbnail_url || note.preview_path || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200'}
                          alt={note.title}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-800 shrink-0"
                        />
                        <div className="max-w-xs">
                          <Link
                            href={`/notes/${note.slug}`}
                            target="_blank"
                            className="font-bold text-white hover:text-rose-400 transition-colors line-clamp-1 flex items-center gap-1"
                          >
                            <span>{note.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </Link>
                          <span className="text-[11px] text-slate-400 block">{note.page_count} Pages &bull; {note.semester}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{seller?.full_name || 'Seller'}</div>
                      <span className="text-[11px] text-slate-500">{seller?.email}</span>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div>{note.subject}</div>
                      <span className="text-[10px] text-slate-500">{note.university}</span>
                    </td>
                    <td className="p-4 font-black text-white">
                      {note.is_free ? (
                        <span className="text-emerald-400">FREE</span>
                      ) : (
                        <span>{formatPrice(note.price)}</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-300">
                      <div>{notePurchases.length} sales</div>
                      <span className="text-[10px] text-slate-500">{note.downloads} downloads</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        note.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : note.status === 'pending'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}>
                        {note.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {note.status !== 'approved' && (
                          <button
                            onClick={() => handleModerate(note.id, 'approved')}
                            disabled={processingId === note.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-bold border border-emerald-800"
                          >
                            Approve
                          </button>
                        )}
                        {note.status !== 'rejected' && (
                          <button
                            onClick={() => handleModerate(note.id, 'rejected')}
                            disabled={processingId === note.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] font-bold border border-rose-800"
                          >
                            Reject
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteNote(note)}
                          disabled={processingId === note.id}
                          className="px-2.5 py-1 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 text-[11px] font-bold border border-red-800 disabled:opacity-50 flex items-center gap-1 transition-colors"
                          title="Permanently Delete Note"
                        >
                          {processingId === note.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          <span>Delete</span>
                        </button>
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

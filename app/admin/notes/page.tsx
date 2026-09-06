'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { moderateNoteAction } from '@/actions/admin';
import { Note, NoteStatus } from '@/types';
import { formatPrice, formatDate, getStatusBadgeClass } from '@/lib/utils';
import { CheckCircle2, XCircle, Eye, Trash2, ShieldAlert } from 'lucide-react';

export default function AdminNotesPage() {
  const [notes, setNotes] = useState(() => store.getNotes());
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetNoteId, setTargetNoteId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const handleModerate = async (noteId: string, status: NoteStatus, reason?: string) => {
    await moderateNoteAction(noteId, status, reason);
    setNotes([...store.getNotes()]);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    handleModerate(targetNoteId, 'rejected', rejectionReason);
    setRejectModalOpen(false);
    setRejectionReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Note Moderation Queue</h1>
          <p className="text-xs text-slate-500 font-medium">Review pending note submissions, approve quality material, or flag copyright violations.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b">
              <tr>
                <th className="p-4">Note Title</th>
                <th className="p-4">Seller</th>
                <th className="p-4">Category / Subject</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {notes.map((note) => (
                <tr key={note.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4">
                    <div className="font-extrabold text-slate-900 dark:text-white line-clamp-1">{note.title}</div>
                    <div className="text-[11px] text-slate-400">{note.university} • {note.page_count} Pages</div>
                  </td>
                  <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{note.seller?.full_name}</td>
                  <td className="p-4">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{note.subject}</span>
                  </td>
                  <td className="p-4 font-extrabold text-slate-900 dark:text-white">{formatPrice(note.price, note.is_free)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusBadgeClass(note.status)}`}>
                      {note.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      href={`/notes/${note.slug}`}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 inline-block font-bold"
                      title="Preview Note"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>

                    {note.status !== 'approved' && (
                      <button
                        onClick={() => handleModerate(note.id, 'approved')}
                        className="p-2 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 inline-block font-bold"
                        title="Approve Note"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {note.status !== 'rejected' && (
                      <button
                        onClick={() => {
                          setTargetNoteId(note.id);
                          setRejectModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 inline-block font-bold"
                        title="Reject Note"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECT REASON MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 border shadow-2xl">
            <h3 className="font-extrabold text-slate-900 dark:text-white">Provide Rejection Reason</h3>
            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                rows={3}
                placeholder="Explain why this note was rejected (e.g., Unclear handwriting, copyrighted textbook pages)..."
                className="w-full p-3 rounded-xl border text-xs"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 text-white"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

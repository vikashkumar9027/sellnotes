'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import SecurePdfReader from '@/components/notes/SecurePdfReader';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Note } from '@/types';

export default function SecureReaderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, loading } = useAuth();

  const [note, setNote] = useState<Note | null>(() => store.getNoteBySlug(slug) || null);
  const [fetching, setFetching] = useState(!note);

  useEffect(() => {
    const existing = store.getNoteBySlug(slug);
    if (existing) {
      setNote(existing);
      setFetching(false);
      return;
    }

    fetch(`/api/notes?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.note) {
          store.saveNoteLocally(data.note);
          setNote(data.note);
        }
      })
      .catch((err) => console.warn('Could not fetch note for reader:', err))
      .finally(() => setFetching(false));
  }, [slug]);

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400 font-bold">Opening Reader Document...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Note Not Found</h2>
        <Link href="/notes" className="py-2.5 px-6 rounded-xl bg-indigo-600 text-white font-bold text-xs">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const hasAccess = Boolean(
    note.is_free ||
    (user && (store.hasUserPurchased(user.id, note.id) || user.id === note.seller_id))
  );

  const readerUser = user || {
    id: 'guest',
    full_name: 'Guest Student',
    email: 'guest@notemart.edu',
    role: 'student' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <SecurePdfReader note={note} currentUser={readerUser} hasAccess={hasAccess} />;
}

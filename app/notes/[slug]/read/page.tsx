'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import SecurePdfReader from '@/components/notes/SecurePdfReader';
import { Lock, ArrowLeft } from 'lucide-react';

export default function SecureReaderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const currentUserId = 'user-student-1';
  const currentUser = store.getUserById(currentUserId) || store.getUsers()[2];
  const note = store.getNoteBySlug(slug);

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

  const hasAccess = store.hasUserPurchased(currentUserId, note.id);

  if (!hasAccess && !note.is_free) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Purchase Required to Read Full Notes</h2>
        <p className="text-slate-400 text-xs max-w-md">
          You must purchase &quot;{note.title}&quot; to unlock full in-platform reading access.
        </p>
        <Link href={`/notes/${note.slug}`} className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go to Note Details &amp; Buy Access
        </Link>
      </div>
    );
  }

  return <SecurePdfReader note={note} currentUser={currentUser} />;
}

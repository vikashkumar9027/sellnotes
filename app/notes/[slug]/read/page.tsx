'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import SecurePdfReader from '@/components/notes/SecurePdfReader';
import { Lock, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SecureReaderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, loading } = useAuth();

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

  // If free note, anyone can read
  if (note.is_free) {
    const readerUser = user || {
      id: 'guest',
      full_name: 'Guest Student',
      email: 'guest@notemart.edu',
      role: 'student' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return <SecurePdfReader note={note} currentUser={readerUser} />;
  }

  // Paid note requires authentication
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Login Required</h2>
        <p className="text-slate-400 text-xs max-w-md">
          Please log in to your NoteMart account to view and read your purchased notes.
        </p>
        <Link
          href={`/login?redirect=/notes/${note.slug}/read`}
          className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" /> Log In with Email OTP
        </Link>
      </div>
    );
  }

  const hasAccess = user ? (store.hasUserPurchased(user.id, note.id) || user.id === note.seller_id) : false;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Purchase Required to Read Full Notes</h2>
        <p className="text-slate-400 text-xs max-w-md">
          You must complete payment for &quot;{note.title}&quot; to unlock full in-platform reading access.
        </p>
        <Link
          href={`/notes/${note.slug}`}
          className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Note Details &amp; Buy Access
        </Link>
      </div>
    );
  }

  return <SecurePdfReader note={note} currentUser={user!} />;
}

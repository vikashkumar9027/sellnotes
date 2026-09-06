'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import NoteCard from '@/components/notes/NoteCard';
import { Heart, BookOpen } from 'lucide-react';

export default function WishlistPage() {
  const currentUserId = 'user-student-1';
  const wishlistItems = store.getWishlistByUser(currentUserId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Saved Wishlist</h1>
          <p className="text-xs text-slate-500 font-medium">Keep track of study notes you are interested in buying later.</p>
        </div>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            item?.note ? <NoteCard key={item.id} note={item.note} currentUserId={currentUserId} /> : null
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
          <Heart className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Click the heart icon on any note card to save it here for quick access later.</p>
          <Link href="/notes" className="inline-block py-2.5 px-6 rounded-xl bg-indigo-600 text-white font-bold text-xs">
            Browse Marketplace
          </Link>
        </div>
      )}
    </div>
  );
}

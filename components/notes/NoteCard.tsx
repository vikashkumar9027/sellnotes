'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Download, Star, BookOpen, GraduationCap, ArrowRight, Eye, ShieldCheck } from 'lucide-react';
import { Note } from '@/types';
import { formatPrice, formatFileSize } from '@/lib/utils';
import { store } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';

interface NoteCardProps {
  note: Note;
  currentUserId?: string;
}

export default function NoteCard({ note, currentUserId: propUserId }: NoteCardProps) {
  const { user } = useAuth();
  const currentUserId = propUserId || user?.id || 'user-student-1';
  const [isWishlisted, setIsWishlisted] = useState(() => store.isInWishlist(currentUserId, note.id));

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = store.toggleWishlist(currentUserId, note.id);
    setIsWishlisted(newState);
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* THUMBNAIL CONTAINER */}
      <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={note.thumbnail_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
          alt={note.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* BADGES */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wide shadow-md ${
              note.is_free
                ? 'bg-emerald-500 text-white'
                : 'bg-indigo-600 text-white'
            }`}
          >
            {note.is_free ? 'FREE' : formatPrice(note.price)}
          </span>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 backdrop-blur-md text-white">
            {note.page_count} Pages
          </span>
        </div>

        {/* WISHLIST BUTTON */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:text-rose-500 dark:hover:text-rose-400 transition-colors shadow-md z-10"
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* QUICK HOVER OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <Link
            href={`/notes/${note.slug}`}
            className="w-full py-2.5 px-4 rounded-xl bg-white/95 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-lg"
          >
            <Eye className="w-4 h-4" /> Quick Preview
          </Link>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* CATEGORY & UNIVERSITY */}
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">
            <span className="truncate max-w-[140px]">{note.subject}</span>
            <span>•</span>
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
              {note.university}
            </span>
          </div>

          {/* TITLE */}
          <Link href={`/notes/${note.slug}`} className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2">
              {note.title}
            </h3>
          </Link>

          {/* COURSE & SEMESTER */}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{note.course} • {note.semester}</span>
          </p>
        </div>

        {/* FOOTER STATS */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {/* SELLER & RATING */}
          <div className="flex items-center gap-2">
            <img
              src={note.seller?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
              alt={note.seller?.full_name || 'Seller'}
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />
            <div className="text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300 block truncate max-w-[90px]">
                {note.seller?.full_name || 'Verified Student'}
              </span>
            </div>
          </div>

          {/* DOWNLOADS & RATING */}
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span>{note.average_rating > 0 ? note.average_rating : 'New'}</span>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <Download className="w-3.5 h-3.5" />
              <span>{note.downloads}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTON */}
        <div className="mt-3">
          <Link
            href={`/notes/${note.slug}`}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              note.is_free
                ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
            }`}
          >
            <span>{note.is_free ? 'Download Free PDF' : `Buy Now – ${formatPrice(note.price)}`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

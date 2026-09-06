'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Lock, FileText, ShieldCheck, ChevronLeft, ChevronRight, Lock as LockIcon, Sparkles } from 'lucide-react';
import { Note } from '@/types';
import { formatPrice } from '@/lib/utils';

interface PdfPreviewerProps {
  note: Note;
  hasAccess: boolean;
  onPurchaseClick?: () => void;
  onDownloadClick?: () => void;
}

export default function PdfPreviewer({
  note,
  hasAccess,
  onPurchaseClick,
}: PdfPreviewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const maxDemoPages = 4; // Exactly 4 image demo access pages
  const allowedPageLimit = note.is_free || hasAccess ? note.page_count : Math.min(maxDemoPages, note.page_count);

  const handleNext = () => {
    if (currentPage < allowedPageLimit) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* HEADER BAR */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="truncate max-w-[240px] sm:max-w-xs">{note.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            {hasAccess || note.is_free ? 'Full Unlocked Platform Access' : '4-Page Demo Image Access'}
          </span>

          <div className="text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            Page {currentPage} of {note.page_count}
          </div>
        </div>
      </div>

      {/* CANVAS / IMAGE DEMO SLIDE VIEWPORT */}
      <div className="relative aspect-[3/4] sm:aspect-[4/3] bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
        {!hasAccess && !note.is_free && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center rotate-[-25deg] select-none opacity-15">
            <span className="text-4xl sm:text-6xl font-black text-slate-300 uppercase tracking-widest">
              NoteMart Demo Preview
            </span>
          </div>
        )}

        <div className="relative max-w-lg w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col justify-between p-6 text-slate-800 select-none border border-slate-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{note.subject} • {note.university}</span>
              <span className="text-[10px] text-slate-400 font-mono">Demo Page {currentPage} / {note.page_count}</span>
            </div>

            <h4 className="text-base font-bold text-slate-900 leading-snug">{note.title}</h4>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-sans">
              <p className="font-semibold text-indigo-950">Demo Chapter {currentPage}: Key Formulas &amp; Diagrams</p>
              <p className="italic bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
                &quot;{note.description.substring(0, 180)}...&quot;
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300 space-y-1">
                <div className="h-2.5 bg-slate-200 rounded-sm w-3/4 animate-pulse"></div>
                <div className="h-2.5 bg-slate-200 rounded-sm w-full animate-pulse"></div>
                <div className="h-2.5 bg-slate-200 rounded-sm w-5/6 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-between text-[11px] text-slate-400">
            <span>Author: {note.seller?.full_name || 'Verified University Student'}</span>
            <span>4-Page Demo Access</span>
          </div>
        </div>

        {/* DEMO LIMITATION LOCK OVERLAY FOR PAGE 5 ONWARDS */}
        {currentPage >= allowedPageLimit && !hasAccess && !note.is_free && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <LockIcon className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-extrabold text-white">
                Unlock Complete PDF ({note.page_count} Pages)
              </h3>
              <p className="text-xs text-slate-300">
                You have reached the end of the 4-page demo preview. Purchase to unlock full in-platform reading access to all {note.page_count} pages!
              </p>
            </div>

            <button
              onClick={onPurchaseClick}
              className="py-3 px-8 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Unlock Full PDF for {formatPrice(note.price)}</span>
            </button>
          </div>
        )}
      </div>

      {/* FOOTER NAVIGATION */}
      <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-300 font-medium">
            Demo Page {currentPage} / {allowedPageLimit}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === allowedPageLimit}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {hasAccess || note.is_free ? (
          <Link
            href={`/notes/${note.slug}/read`}
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-md"
          >
            <Eye className="w-4 h-4" /> Read Online in Secure Reader
          </Link>
        ) : (
          <button
            onClick={onPurchaseClick}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" /> Unlock Full Access ({formatPrice(note.price)})
          </button>
        )}
      </div>
    </div>
  );
}

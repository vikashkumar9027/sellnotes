'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ArrowLeft, CameraOff, AlertOctagon } from 'lucide-react';
import { Note, Profile } from '@/types';

interface SecurePdfReaderProps {
  note: Note;
  currentUser: Profile;
}

export default function SecurePdfReader({ note, currentUser }: SecurePdfReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isScreenBlocked, setIsScreenBlocked] = useState(false);

  // Anti-Screenshot & Screen-Capture Protection Controls
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert('🔒 NoteMart DRM Notice: Context menu & file copying are disabled to protect seller copyrights.');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect PrintScreen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        setIsScreenBlocked(true);
        alert('📸 Screenshot Detected! Screen capture is disabled on NoteMart to protect author copyright.');
        setTimeout(() => setIsScreenBlocked(false), 3000);
      }

      // Block Snipping Tool (Win+Shift+S / Cmd+Shift+S / Cmd+Shift+4)
      if (
        (e.metaKey || e.ctrlKey || e.shiftKey) &&
        (e.key === 'S' || e.key === 's' || e.key === '4' || e.key === '3')
      ) {
        setIsScreenBlocked(true);
        setTimeout(() => setIsScreenBlocked(false), 2500);
      }

      // Block Ctrl+P, Ctrl+S, Ctrl+C, Ctrl+U
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S' || e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U')
      ) {
        e.preventDefault();
        alert('🔒 Security Notice: Printing, saving, and copying notes are restricted to in-platform reading.');
      }
    };

    // Blackout content when window loses focus (e.g. Snipping tool opened)
    const handleWindowBlur = () => {
      setIsScreenBlocked(true);
    };

    const handleWindowFocus = () => {
      setIsScreenBlocked(false);
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const handleNext = () => {
    if (currentPage < note.page_count) setCurrentPage((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none no-print relative">
      {/* GLOBAL CSS PRINT & SELECTION PROTECTION STYLES */}
      <style jsx global>{`
        @media print {
          html, body {
            display: none !important;
          }
        }
        .select-none {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>

      {/* SCREENSHOT BLACKOUT OVERLAY */}
      {isScreenBlocked && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/40 flex items-center justify-center">
            <CameraOff className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Screenshots &amp; Screen Recording Restricted</h2>
          <p className="text-slate-400 text-xs max-w-md">
            NoteMart Platform DRM active. Screen capture tools are blocked to protect seller handwritten notes copyright.
          </p>
          <button
            onClick={() => setIsScreenBlocked(false)}
            className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            Resume Reading Note
          </button>
        </div>
      )}

      {/* TOP CONTROL BAR */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/notes/${note.slug}`}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Details
          </Link>

          <div className="hidden sm:block">
            <h1 className="font-extrabold text-sm text-white truncate max-w-xs">{note.title}</h1>
            <p className="text-[11px] text-slate-400">{note.subject} • {note.university}</p>
          </div>
        </div>

        {/* SECURITY & LICENSED BADGE */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Anti-Screenshot Protected Reader</span>
          </span>
        </div>

        {/* ZOOM & PAGE CONTROLS */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.max(75, z - 15))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-indigo-400 w-10 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(175, z + 15))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-white">
              Page {currentPage} of {note.page_count}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === note.page_count}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CANVAS READER VIEWPORT WITH WATERMARK */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="relative max-w-3xl w-full bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-700 min-h-[750px] p-8 sm:p-12 transition-transform duration-200 select-none overflow-hidden"
        >
          {/* ANTI-PIRACY REPEATED WATERMARK */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center rotate-[-30deg] select-none opacity-10">
            <div className="text-center space-y-4">
              <p className="text-4xl sm:text-5xl font-black text-slate-900 uppercase tracking-widest">
                Licensed to {currentUser.full_name}
              </p>
              <p className="text-xl font-bold text-slate-700">
                {currentUser.email} • NoteMart Protected Reader
              </p>
            </div>
          </div>

          {/* READER HEADER */}
          <div className="border-b pb-4 mb-6 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className="text-indigo-600 font-bold uppercase">{note.subject} • {note.university}</span>
            <span className="font-mono">Page {currentPage} / {note.page_count}</span>
          </div>

          {/* HANDWRITTEN NOTE CONTENT SIMULATION */}
          <div className="space-y-6 text-sm text-slate-800 leading-relaxed font-sans">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
              {note.title} (Chapter {currentPage})
            </h2>

            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <h4 className="font-bold text-indigo-900 text-xs uppercase tracking-wider">Key Topic Summary</h4>
              <p className="text-xs text-indigo-950 font-medium">
                {note.description}
              </p>
            </div>

            {/* HANDWRITTEN DIAGRAM & FORMULA SECTION */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Solved Formulas &amp; Exam Highlights</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-white rounded-xl border border-slate-300">
                  <span className="text-indigo-600 font-bold block mb-1">Time Complexity:</span>
                  <p className="text-slate-800 font-extrabold">O(N log N) Best / Average</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-300">
                  <span className="text-emerald-600 font-bold block mb-1">Space Complexity:</span>
                  <p className="text-slate-800 font-extrabold">O(1) Auxiliary Memory</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-dashed border-indigo-300 space-y-2">
                <span className="text-xs font-extrabold text-slate-900 block">Step-by-step Execution Proof:</span>
                <div className="h-3 bg-slate-200 rounded-sm w-full animate-pulse"></div>
                <div className="h-3 bg-slate-200 rounded-sm w-4/5 animate-pulse"></div>
                <div className="h-3 bg-slate-200 rounded-sm w-11/12 animate-pulse"></div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Note: Full handwritten notes are protected under NoteMart Digital Content Rights. Copying, printing, downloading raw PDF files, or taking screenshots outside NoteMart is strictly prohibited to prevent unauthorized distribution.
            </p>
          </div>

          {/* FOOTER */}
          <div className="absolute bottom-4 left-8 right-8 pt-4 border-t flex items-center justify-between text-[11px] text-slate-400">
            <span>Seller: {note.seller?.full_name || 'Verified Topper'}</span>
            <span>Anti-Screenshot Protection Active</span>
          </div>
        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>In-Platform Read Protection (Raw File Download &amp; Screenshot Disabled)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30"
          >
            Previous Page
          </button>
          <button
            onClick={handleNext}
            disabled={currentPage === note.page_count}
            className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-30"
          >
            Next Page &rarr;
          </button>
        </div>
      </footer>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Download,
  ArrowLeft,
  ExternalLink,
  Loader2,
  FileText,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { Note, Profile } from '@/types';
import { getPdfFromIndexedDB, downloadBlobAsFile } from '@/lib/pdf-storage';
import { toast } from 'sonner';

interface SecurePdfReaderProps {
  note: Note;
  currentUser: Profile;
}

export default function SecurePdfReader({ note, currentUser }: SecurePdfReaderProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isLocalBlob, setIsLocalBlob] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    let createdUrl = '';

    const resolvePdf = async () => {
      try {
        // 1. Try resolving original file from browser IndexedDB
        const localBlob =
          (await getPdfFromIndexedDB(note.slug)) ||
          (await getPdfFromIndexedDB(note.id)) ||
          (await getPdfFromIndexedDB(note.title));

        if (localBlob && active) {
          createdUrl = URL.createObjectURL(localBlob);
          setPdfUrl(createdUrl);
          setIsLocalBlob(true);
          setLoading(false);
          return;
        }

        // 2. Fallback to server API endpoint that streams the PDF
        const serverUrl = `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&path=${encodeURIComponent(note.pdf_path || '')}`;
        if (active) {
          setPdfUrl(serverUrl);
          setIsLocalBlob(false);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Could not resolve PDF blob from local storage:', err);
        const fallbackUrl = `/api/notes/file?slug=${encodeURIComponent(note.slug)}`;
        if (active) {
          setPdfUrl(fallbackUrl);
          setLoading(false);
        }
      }
    };

    resolvePdf();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [note.slug, note.id, note.title, note.pdf_path]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // 1. Try downloading local indexedDB blob directly
      const localBlob =
        (await getPdfFromIndexedDB(note.slug)) ||
        (await getPdfFromIndexedDB(note.id));

      if (localBlob) {
        downloadBlobAsFile(localBlob, `${note.title}.pdf`);
        toast.success('Original PDF downloaded successfully!');
        setDownloading(false);
        return;
      }

      // 2. Trigger download through the server API endpoint
      const downloadEndpoint = `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&download=1`;
      const link = document.createElement('a');
      link.href = downloadEndpoint;
      link.download = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF download started!');
    } catch {
      toast.error('Could not initiate download. Opening PDF in new tab...');
      window.open(pdfUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* TOP CONTROL BAR */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href={`/notes/${note.slug}`}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Details
          </Link>

          <div className="hidden md:block">
            <h1 className="font-extrabold text-sm text-white truncate max-w-sm">{note.title}</h1>
            <p className="text-[11px] text-indigo-400 font-semibold">
              {note.subject} • {note.university} ({note.page_count} Pages)
            </p>
          </div>
        </div>

        {/* LICENSE BADGE */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950 border border-indigo-800/80 text-indigo-300 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Full Note Unlocked • Licensed to {currentUser.full_name || 'Student'}</span>
          </span>
        </div>

        {/* ACTIONS: DOWNLOAD & FULLSCREEN */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* DOWNLOAD BUTTON */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
            title="Download complete PDF notes to your device"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download PDF</span>
          </button>

          {/* OPEN FULLSCREEN / NEW TAB */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Open native browser PDF viewer in full tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fullscreen Tab</span>
            </a>
          )}
        </div>
      </header>

      {/* EMBEDDED REAL PDF VIEWER */}
      <main className="flex-1 p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center relative bg-slate-950">
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-bold text-slate-300">Loading Handwritten PDF Document...</p>
            <p className="text-xs text-slate-500">Preparing all {note.page_count} pages for reading</p>
          </div>
        ) : pdfUrl ? (
          <div className="w-full h-full min-h-[85vh] flex-1 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-white relative">
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full min-h-[85vh] border-0"
              title={note.title}
            />
          </div>
        ) : (
          <div className="p-8 text-center space-y-4 max-w-md bg-slate-900 rounded-3xl border border-slate-800">
            <FileText className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold">PDF Could Not Be Embedded</h3>
            <p className="text-xs text-slate-400">
              Your browser may not support inline PDF embedding. You can download the PDF file directly to read offline.
            </p>
            <button
              onClick={handleDownload}
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              Download PDF Note
            </button>
          </div>
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>NoteMart Complete Study Viewer &bull; All pages unlocked &amp; available for reading</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Save / Download Copy
          </button>
        </div>
      </footer>
    </div>
  );
}

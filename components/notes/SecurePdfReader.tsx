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
  Layers,
  Lock,
} from 'lucide-react';
import { Note, Profile } from '@/types';
import { getPdfFromIndexedDB, downloadBlobAsFile } from '@/lib/pdf-storage';
import { toast } from 'sonner';
import RealPdfCanvasViewer from './RealPdfCanvasViewer';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

interface SecurePdfReaderProps {
  note: Note;
  currentUser: Profile;
  hasAccess?: boolean;
}

export default function SecurePdfReader({
  note,
  currentUser,
  hasAccess = true,
}: SecurePdfReaderProps) {
  const router = useRouter();
  const [pdfSource, setPdfSource] = useState<string | Blob>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [viewerMode, setViewerMode] = useState<'canvas' | 'native'>('canvas');

  const isAuthor = currentUser?.id === note.seller_id;
  const isUnlocked = hasAccess || note.is_free || isAuthor;

  useEffect(() => {
    let active = true;

    const resolvePdf = async () => {
      try {
        // 1. Check local IndexedDB for exact original file
        const localBlob =
          (await getPdfFromIndexedDB(note.slug)) ||
          (await getPdfFromIndexedDB(note.id)) ||
          (await getPdfFromIndexedDB(note.title));

        if (localBlob && active) {
          setPdfSource(localBlob);
          setLoading(false);
          return;
        }

        // 2. Fallback to server route
        const serverUrl = `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&path=${encodeURIComponent(note.pdf_path || '')}`;
        if (active) {
          setPdfSource(serverUrl);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Could not resolve PDF blob:', err);
        if (active) {
          setPdfSource(`/api/notes/file?slug=${encodeURIComponent(note.slug)}`);
          setLoading(false);
        }
      }
    };

    resolvePdf();

    return () => {
      active = false;
    };
  }, [note.slug, note.id, note.title, note.pdf_path]);

  const handleDownload = async () => {
    if (!isUnlocked) {
      toast.error('You need to purchase this note to download the full PDF.');
      router.push(`/notes/${note.slug}`);
      return;
    }

    setDownloading(true);
    try {
      const localBlob =
        (await getPdfFromIndexedDB(note.slug)) ||
        (await getPdfFromIndexedDB(note.id));

      if (localBlob) {
        downloadBlobAsFile(localBlob, `${note.title}.pdf`);
        toast.success('Downloaded original PDF note!');
        setDownloading(false);
        return;
      }

      const downloadEndpoint = `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&download=1`;
      const link = document.createElement('a');
      link.href = downloadEndpoint;
      link.download = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF download started!');
    } catch {
      toast.error('Could not initiate download. Opening in new tab...');
      window.open(`/api/notes/file?slug=${encodeURIComponent(note.slug)}&download=1`, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const handlePurchaseRedirect = () => {
    router.push(`/notes/${note.slug}`);
  };

  const nativePdfUrl =
    typeof pdfSource === 'string'
      ? pdfSource
      : pdfSource instanceof Blob
      ? URL.createObjectURL(pdfSource)
      : `/api/notes/file?slug=${encodeURIComponent(note.slug)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* TOP BAR */}
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

        {/* UNLOCKED OR SAMPLE STATUS */}
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              isUnlocked
                ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                : 'bg-amber-950 border border-amber-800 text-amber-300'
            }`}
          >
            {isUnlocked ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Full Note Unlocked ({note.page_count} Pages)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Sample Preview: First 4 Pages Free</span>
              </>
            )}
          </span>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 text-xs">
          {/* VIEW MODE TOGGLE */}
          <div className="hidden sm:flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewerMode('canvas')}
              className={`py-1 px-2.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                viewerMode === 'canvas'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Page View
            </button>
            <button
              onClick={() => setViewerMode('native')}
              className={`py-1 px-2.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                viewerMode === 'native'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scroll View
            </button>
          </div>

          {/* DOWNLOAD BUTTON (UNLOCKED ONLY) */}
          {isUnlocked ? (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
              title="Download complete PDF notes"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download PDF</span>
            </button>
          ) : (
            <button
              onClick={handlePurchaseRedirect}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Unlock All Pages ({formatPrice(note.price)})</span>
            </button>
          )}

          {/* FULLSCREEN NEW TAB */}
          <a
            href={nativePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Open in Fullscreen Browser Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* MAIN VIEWER AREA */}
      <main className="flex-1 p-2 sm:p-6 flex flex-col items-center justify-center max-w-6xl w-full mx-auto">
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-bold text-slate-300">Loading Handwritten Notes...</p>
            <p className="text-xs text-slate-500">Preparing high-resolution PDF pages</p>
          </div>
        ) : viewerMode === 'canvas' ? (
          <RealPdfCanvasViewer
            note={note}
            pdfSource={pdfSource}
            hasAccess={isUnlocked}
            onPurchaseClick={handlePurchaseRedirect}
            onDownload={handleDownload}
            maxDemoPages={4}
          />
        ) : (
          /* NATIVE IFRAME SCROLL VIEW */
          <div className="w-full h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-white relative">
            <iframe
              src={`${nativePdfUrl}#toolbar=1&navpanes=1`}
              className="w-full h-full border-0"
              title={note.title}
            />
          </div>
        )}
      </main>
    </div>
  );
}

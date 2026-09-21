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
import { getPdfFromIndexedDB, downloadBlobAsFile, savePdfToIndexedDB } from '@/lib/pdf-storage';
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
        // 1. Check local IndexedDB across all available keys for exact original file
        const localBlob = await getPdfFromIndexedDB([
          note.slug,
          note.id,
          note.pdf_path || '',
          note.storage_key || '',
          note.title,
        ]);

        if (localBlob && active) {
          setPdfSource(localBlob);
          setLoading(false);
          return;
        }

        // 2. Fetch original PDF binary from server storage vault
        const serverUrl = `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&path=${encodeURIComponent(note.pdf_path || '')}`;
        
        try {
          const res = await fetch(serverUrl);
          if (res.ok) {
            const blob = await res.blob();
            if (active) {
              setPdfSource(blob);
              setLoading(false);
            }
            savePdfToIndexedDB([note.slug, note.id, note.pdf_path || ''], blob);
            return;
          }
        } catch {
          // Fall through to serverUrl string
        }

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
      <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2.5 sm:py-3 sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 sm:gap-4 shadow-xl">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href={`/notes/${note.slug}`}
            className="p-2 sm:py-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
            title="Back to Details"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Details</span>
          </Link>

          <div className="min-w-0">
            <h1 className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-sm">{note.title}</h1>
            <p className="text-[10px] sm:text-[11px] text-indigo-400 font-semibold truncate">
              {note.subject} • {note.university} ({note.page_count} Pages)
            </p>
          </div>
        </div>

        {/* UNLOCKED OR SAMPLE STATUS */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold ${
              isUnlocked
                ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                : 'bg-amber-950 border border-amber-800 text-amber-300'
            }`}
          >
            {isUnlocked ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Unlocked ({note.page_count}p)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Sample Preview (4p)</span>
              </>
            )}
          </span>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
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
              className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
              title="Download complete PDF notes"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download</span>
            </button>
          ) : (
            <button
              onClick={handlePurchaseRedirect}
              className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Unlock ({formatPrice(note.price)})</span>
            </button>
          )}

          {/* FULLSCREEN NEW TAB */}
          <a
            href={nativePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Open in Fullscreen Browser Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
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

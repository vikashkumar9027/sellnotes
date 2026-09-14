'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Eye,
  Lock,
  FileText,
  ShieldCheck,
  Lock as LockIcon,
  Sparkles,
  Download,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Note } from '@/types';
import { formatPrice } from '@/lib/utils';
import { getPdfFromIndexedDB, downloadBlobAsFile } from '@/lib/pdf-storage';

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
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    let createdUrl = '';

    const resolvePdf = async () => {
      try {
        const localBlob =
          (await getPdfFromIndexedDB(note.slug)) ||
          (await getPdfFromIndexedDB(note.id));

        if (localBlob && active) {
          createdUrl = URL.createObjectURL(localBlob);
          setPdfUrl(createdUrl);
          setLoading(false);
          return;
        }

        const serverUrl = `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&path=${encodeURIComponent(note.pdf_path || '')}`;
        if (active) {
          setPdfUrl(serverUrl);
          setLoading(false);
        }
      } catch {
        if (active) {
          setPdfUrl(`/api/notes/file?slug=${encodeURIComponent(note.slug)}`);
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
  }, [note.slug, note.id, note.pdf_path]);

  const handleDownload = async () => {
    try {
      const localBlob =
        (await getPdfFromIndexedDB(note.slug)) ||
        (await getPdfFromIndexedDB(note.id));

      if (localBlob) {
        downloadBlobAsFile(localBlob, `${note.title}.pdf`);
        return;
      }

      window.open(
        `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&download=1`,
        '_blank'
      );
    } catch {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* HEADER BAR */}
      <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate max-w-[220px] sm:max-w-md">{note.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              hasAccess || note.is_free
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                : 'bg-amber-950 text-amber-400 border border-amber-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {hasAccess || note.is_free ? 'Full Access Unlocked' : 'Interactive PDF Preview'}
          </span>

          <span className="text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            {note.page_count} Pages
          </span>
        </div>
      </div>

      {/* EMBEDDED REAL PDF VIEWPORT */}
      <div className="relative aspect-[4/5] sm:aspect-[4/3] min-h-[500px] sm:min-h-[620px] bg-slate-950 flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400 font-bold">Loading PDF Document Preview...</p>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full border-0 bg-white"
            title={note.title}
          />
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            PDF preview could not be loaded.
          </div>
        )}

        {/* OVERLAY FOR NON-PURCHASED NOTES */}
        {!hasAccess && !note.is_free && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-20 pb-8 px-6 text-center space-y-3 z-20">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-amber-500/20">
              <LockIcon className="w-6 h-6" />
            </div>

            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-black text-white">
                Unlock Complete PDF ({note.page_count} Pages)
              </h3>
              <p className="text-xs text-slate-300">
                You are viewing the preview. Purchase this verified note to read all pages in high-resolution, zoom, and download to your device.
              </p>
            </div>

            <button
              onClick={onPurchaseClick}
              className="py-3 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Unlock &amp; Download for {formatPrice(note.price)}</span>
            </button>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="bg-slate-950 px-4 py-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <span>Author: <strong className="text-slate-200">{note.seller?.full_name || 'Verified Student'}</strong></span>
          <span>&bull;</span>
          <span>{note.subject}</span>
        </div>

        <div className="flex items-center gap-2">
          {hasAccess || note.is_free ? (
            <>
              <button
                onClick={handleDownload}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>

              <Link
                href={`/notes/${note.slug}/read`}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
              >
                <Eye className="w-4 h-4" /> Open Fullscreen Reader
              </Link>
            </>
          ) : (
            <button
              onClick={onPurchaseClick}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" /> Unlock Note ({formatPrice(note.price)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Note } from '@/types';
import { getPdfFromIndexedDB, downloadBlobAsFile } from '@/lib/pdf-storage';
import RealPdfCanvasViewer from './RealPdfCanvasViewer';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [pdfSource, setPdfSource] = useState<string | Blob>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const resolvePdf = async () => {
      try {
        const localBlob =
          (await getPdfFromIndexedDB(note.slug)) ||
          (await getPdfFromIndexedDB(note.id)) ||
          (await getPdfFromIndexedDB(note.title));

        if (localBlob && active) {
          setPdfSource(localBlob);
          setLoading(false);
          return;
        }

        const serverUrl = `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&path=${encodeURIComponent(note.pdf_path || '')}`;
        if (active) {
          setPdfSource(serverUrl);
          setLoading(false);
        }
      } catch {
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
    try {
      const localBlob =
        (await getPdfFromIndexedDB(note.slug)) ||
        (await getPdfFromIndexedDB(note.id));

      if (localBlob) {
        downloadBlobAsFile(localBlob, `${note.title}.pdf`);
        toast.success('Downloaded note PDF!');
        return;
      }

      window.open(
        `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&download=1`,
        '_blank'
      );
    } catch {
      window.open(
        `/api/notes/file?slug=${encodeURIComponent(note.slug)}&noteId=${encodeURIComponent(note.id)}&download=1`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-3xl border border-slate-800 min-h-[480px] flex flex-col items-center justify-center space-y-3 p-8">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400 font-bold">Loading PDF Document Preview...</p>
      </div>
    );
  }

  return (
    <RealPdfCanvasViewer
      note={note}
      pdfSource={pdfSource}
      hasAccess={hasAccess}
      onPurchaseClick={onPurchaseClick}
      onDownload={handleDownload}
      maxDemoPages={4}
      compact={true}
    />
  );
}

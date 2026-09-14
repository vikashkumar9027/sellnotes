'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Lock,
  Sparkles,
  Download,
  Loader2,
  FileText,
  ShieldCheck,
  AlertCircle,
  Maximize2,
} from 'lucide-react';
import { Note } from '@/types';
import { formatPrice } from '@/lib/utils';

interface RealPdfCanvasViewerProps {
  note: Note;
  pdfSource: string | Blob;
  hasAccess: boolean;
  onPurchaseClick?: () => void;
  onDownload?: () => void;
  maxDemoPages?: number;
  compact?: boolean;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfjsLib: any;
  }
}

export default function RealPdfCanvasViewer({
  note,
  pdfSource,
  hasAccess,
  onPurchaseClick,
  onDownload,
  maxDemoPages = 4,
  compact = false,
}: RealPdfCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeRenderTaskRef = useRef<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(note.page_count || 4);
  const [zoom, setZoom] = useState<number>(compact ? 100 : 120);
  const [renderingPage, setRenderingPage] = useState<boolean>(false);

  const isUnlocked = hasAccess || note.is_free;
  const allowedPageLimit = isUnlocked ? totalPages : Math.min(maxDemoPages, totalPages);

  // 1. Ensure PDF.js is loaded in browser
  const loadPdfJsLibrary = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if (window.pdfjsLib) return resolve(true);

      const existingScript = document.getElementById('pdfjs-library-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        return;
      }

      const script = document.createElement('script');
      script.id = 'pdfjs-library-script';
      script.src = '/vendor/pdfjs/pdf.min.js';
      script.async = true;

      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.js';
        }
        resolve(true);
      };

      script.onerror = () => {
        // Fallback to CDN if local bundle isn't available
        const cdnScript = document.createElement('script');
        cdnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        cdnScript.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
          resolve(true);
        };
        cdnScript.onerror = () => resolve(false);
        document.body.appendChild(cdnScript);
      };

      document.body.appendChild(script);
    });
  };

  // 2. Load PDF document from source (Blob or URL)
  useEffect(() => {
    let isCancelled = false;

    const initPdf = async () => {
      if (!pdfSource) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const libReady = await loadPdfJsLibrary();
      if (!libReady || !window.pdfjsLib) {
        if (!isCancelled) {
          setError('PDF rendering engine could not be initialized.');
          setLoading(false);
        }
        return;
      }

      try {
        let loadingTask;
        if (pdfSource instanceof Blob) {
          const arrayBuffer = await pdfSource.arrayBuffer();
          loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        } else if (typeof pdfSource === 'string') {
          loadingTask = window.pdfjsLib.getDocument(pdfSource);
        } else {
          throw new Error('Invalid PDF source');
        }

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: unknown) {
        if (!isCancelled) {
          console.warn('PDF.js failed to load document directly:', err);
          setError('Could not load PDF document.');
          setLoading(false);
        }
      }
    };

    initPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfSource]);

  // 3. Render current page to canvas with high DPI scaling & strict cancellation
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDocRef.current) return;
    if (currentPage > allowedPageLimit) return;

    // 1. Cancel in-flight render task to prevent race conditions & duplicate overwriting
    if (activeRenderTaskRef.current) {
      try {
        activeRenderTaskRef.current.cancel();
      } catch {}
      activeRenderTaskRef.current = null;
    }

    setRenderingPage(true);
    try {
      const page = await pdfDocRef.current.getPage(currentPage);
      // Ensure we are rendering the exact requested page number
      if (page.pageNumber !== currentPage) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const scale = (zoom / 100) * (window.devicePixelRatio || 1);
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / (window.devicePixelRatio || 1)}px`;
      canvas.style.height = `${viewport.height / (window.devicePixelRatio || 1)}px`;

      // 2. Pre-clear canvas to prevent previous page bleed-through
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      activeRenderTaskRef.current = renderTask;

      await renderTask.promise;
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException') {
        // Normal cancellation when user rapidly clicks next/prev page
        return;
      }
      console.warn('Error rendering page:', err);
    } finally {
      activeRenderTaskRef.current = null;
      setRenderingPage(false);
    }
  }, [currentPage, allowedPageLimit, zoom]);

  useEffect(() => {
    if (!loading && !error && pdfDocRef.current) {
      renderCurrentPage();
    }
  }, [loading, error, currentPage, zoom, renderCurrentPage]);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const isPageLocked = !isUnlocked && currentPage > allowedPageLimit;

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col w-full select-none">
      {/* HEADER TOOLBAR */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* LEFT: TITLE & ACCESS BADGE */}
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-extrabold text-white truncate max-w-[200px] sm:max-w-xs">
            {note.title}
          </span>
          <span
            className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isUnlocked
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            {isUnlocked ? 'All Pages Unlocked' : `Sample Preview (1–${allowedPageLimit} of ${totalPages})`}
          </span>
        </div>

        {/* CENTER: PAGE NAVIGATOR */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs font-extrabold text-slate-200 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 min-w-[100px] text-center">
            Page {currentPage} / {totalPages}
          </span>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* RIGHT: ZOOM & ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.max(70, z - 15))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-bold text-indigo-400 w-9 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 15))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {onDownload && isUnlocked && (
            <button
              onClick={onDownload}
              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Download full PDF document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN VIEWPORT: REAL CANVAS OR LOCKED OVERLAY */}
      <div className="relative min-h-[520px] max-h-[78vh] overflow-auto bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-bold text-slate-300">Rendering Handwritten Pages...</p>
            <p className="text-xs text-slate-500">Loading exact PDF formatting and original ink notes</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-4 max-w-md bg-slate-900 rounded-2xl border border-slate-800">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Direct Canvas Preview Unavailable</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your browser is rendering the PDF in standard secure mode. You can open or download the complete document below.
            </p>
            {onDownload && (
              <button
                onClick={onDownload}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PDF Notes
              </button>
            )}
          </div>
        ) : isPageLocked ? (
          /* LOCKED MODAL FOR PAGE 5 ONWARDS BEFORE PURCHASE */
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-fade-in my-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-amber-500/20">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                Sample Limit Reached
              </span>
              <h3 className="text-xl font-black text-white">
                Unlock Page 5 to {totalPages} ({totalPages - allowedPageLimit} More Pages)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You have viewed all <strong>4 free sample pages</strong> of these handwritten notes. Unlock the complete verified PDF to view every chapter, proof, diagram, and download to your device.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setCurrentPage(1)}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                &larr; Back to Page 1
              </button>

              <button
                onClick={onPurchaseClick}
                className="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Unlock All {totalPages} Pages for {formatPrice(note.price)}</span>
              </button>
            </div>
          </div>
        ) : (
          /* REAL HIGH RESOLUTION CANVAS RENDERING */
          <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white transition-transform duration-150">
            {renderingPage && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            )}
            <canvas key={`pdf-canvas-p${currentPage}`} ref={canvasRef} className="block max-w-full h-auto" />
          </div>
        )}
      </div>

      {/* PAGE THUMBNAILS STRIP */}
      {totalPages > 1 && (
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase shrink-0 mr-1">
            Jump To Page:
          </span>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
            const isLocked = !isUnlocked && pNum > allowedPageLimit;
            const isCurrent = pNum === currentPage;
            return (
              <button
                key={pNum}
                onClick={() => setCurrentPage(pNum)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400'
                    : isLocked
                    ? 'bg-slate-900 hover:bg-slate-850 text-slate-500 border border-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={isLocked ? `Page ${pNum} (Locked - Purchase required)` : `Page ${pNum}`}
              >
                {isLocked && <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                <span>P.{pNum}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* FOOTER BAR */}
      <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Full Access Unlocked
            </span>
          ) : (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Pages 1–{allowedPageLimit} Free Sample Preview
            </span>
          )}
          <span>&bull;</span>
          <span>Subject: {note.subject}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isUnlocked && currentPage <= allowedPageLimit && (
            <button
              onClick={onPurchaseClick}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              Unlock remaining {totalPages - allowedPageLimit} pages ({formatPrice(note.price)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

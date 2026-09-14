import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { store } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const noteId = searchParams.get('noteId');
    const requestedPath = searchParams.get('path');
    const isDownload = searchParams.get('download') === '1' || searchParams.get('download') === 'true';

    let note = null;
    if (slug) {
      note = store.getNoteBySlug(slug);
    } else if (noteId) {
      note = store.getNotes().find((n) => n.id === noteId);
    }

    const title = note?.title || 'NoteMart-Handwritten-Notes';
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${sanitizedTitle}.pdf`;

    // Candidate file locations
    const candidatePaths: string[] = [];

    if (requestedPath) {
      const cleanReq = requestedPath.startsWith('/') ? requestedPath.slice(1) : requestedPath;
      candidatePaths.push(path.join(process.cwd(), 'public', cleanReq));
      candidatePaths.push(path.join('/tmp', cleanReq));
      candidatePaths.push(path.join('/tmp', 'uploads', path.basename(cleanReq)));
    }

    if (note && note.pdf_path) {
      const cleanPath = note.pdf_path.startsWith('/') ? note.pdf_path.slice(1) : note.pdf_path;
      candidatePaths.push(path.join(process.cwd(), 'public', cleanPath));
      candidatePaths.push(path.join('/tmp', cleanPath));
      candidatePaths.push(path.join('/tmp', 'uploads', path.basename(cleanPath)));
    }

    // Fallbacks
    candidatePaths.push(path.join(process.cwd(), 'public', 'sample-notes', 'data-analytics.pdf'));
    candidatePaths.push(path.join(process.cwd(), 'public', 'sample-notes', 'sample.pdf'));

    let fileBuffer: Buffer | null = null;
    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p)) {
          fileBuffer = fs.readFileSync(p);
          if (fileBuffer && fileBuffer.length > 0) {
            break;
          }
        }
      } catch {
        // Continue searching
      }
    }

    if (!fileBuffer) {
      return new NextResponse('PDF file not available', { status: 404 });
    }

    const disposition = isDownload ? `attachment; filename="${fileName}"` : `inline; filename="${fileName}"`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to serve PDF';
    return new NextResponse(`Error loading PDF: ${msg}`, { status: 500 });
  }
}

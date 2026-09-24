import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getOriginalPdfBuffer, getBufferFromGridFS } from '@/lib/server-pdf-vault';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const noteId = searchParams.get('noteId');
    const requestedPath = searchParams.get('path');
    const gridFsId = searchParams.get('gridFsId');
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

    // 1. Fetch exact original byte-for-byte buffer from GridFS or server storage vault
    let fileBuffer: Buffer | null = null;
    if (gridFsId) {
      fileBuffer = await getBufferFromGridFS(gridFsId);
    }
    if (!fileBuffer && note?.gridfs_id) {
      fileBuffer = await getBufferFromGridFS(note.gridfs_id);
    }
    if (!fileBuffer) {
      fileBuffer = await getOriginalPdfBuffer(
        requestedPath || (note ? note.pdf_path : null),
        note ? note.pdf_path : null
      );
    }

    if (!fileBuffer) {
      return new NextResponse(
        JSON.stringify({
          error: 'Original PDF file not found on server.',
          slug,
          noteId,
          pdf_path: note?.pdf_path,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const disposition = isDownload
      ? `attachment; filename="${fileName}"`
      : `inline; filename="${fileName}"`;

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
    const msg = err instanceof Error ? err.message : 'Failed to serve original PDF';
    return new NextResponse(`Error loading PDF: ${msg}`, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { store } from '@/lib/store';
import { getOriginalPdfBuffer } from '@/lib/server-pdf-vault';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get('noteId');
  const stream = searchParams.get('stream') === '1';

  if (!noteId) {
    return NextResponse.json({ error: 'Missing noteId parameter' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get('notemart_user_id')?.value;
  const paramUserId = searchParams.get('userId');
  const userId = sessionUserId || paramUserId;

  const note = store.getNotes().find((n) => n.id === noteId);
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  const isOwner = userId && note.seller_id === userId;
  const hasPurchased = userId && store.hasUserPurchased(userId, noteId);
  const isAuthorized = note.is_free || isOwner || hasPurchased;

  if (!isAuthorized) {
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to download this note.' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Unauthorized access. You must purchase this note before downloading.' },
      { status: 403 }
    );
  }

  store.incrementNoteDownloads(noteId);

  const sanitizedTitle = note.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${sanitizedTitle}.pdf`;

  // If stream requested, deliver the binary directly
  if (stream) {
    const fileBuffer = await getOriginalPdfBuffer(note.pdf_path, note.pdf_path);
    if (!fileBuffer) {
      return new NextResponse('Original PDF file is not available on server.', { status: 404 });
    }
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  }

  // Otherwise return secure download metadata pointing to direct file stream
  const secureDownloadUrl = `/api/notes/file?noteId=${encodeURIComponent(note.id)}&slug=${encodeURIComponent(note.slug)}&download=1`;

  return NextResponse.json({
    success: true,
    downloadUrl: secureDownloadUrl,
    directStreamUrl: `/api/notes/download?noteId=${encodeURIComponent(note.id)}&stream=1`,
    fileName,
    pageCount: note.page_count,
    fileSize: note.file_size,
  });
}

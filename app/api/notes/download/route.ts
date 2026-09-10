import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { store } from '@/lib/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get('noteId');

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

  // Free notes can be downloaded
  if (note.is_free) {
    store.incrementNoteDownloads(noteId);
    return NextResponse.json({
      success: true,
      downloadUrl: note.pdf_path,
      fileName: `${note.title}.pdf`,
    });
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required. Please log in to download this note.' },
      { status: 401 }
    );
  }

  const hasAccess = store.hasUserPurchased(userId, noteId) || note.seller_id === userId;
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Unauthorized access. You must purchase this note before downloading.' },
      { status: 403 }
    );
  }

  store.incrementNoteDownloads(noteId);

  return NextResponse.json({
    success: true,
    downloadUrl: note.pdf_path,
    fileName: `${note.title}.pdf`,
  });
}

import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get('noteId');
  const userId = searchParams.get('userId') || 'user-student-1';

  if (!noteId) {
    return NextResponse.json({ error: 'Missing noteId parameter' }, { status: 400 });
  }

  const hasAccess = store.hasUserPurchased(userId, noteId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Unauthorized access. Note purchase required.' }, { status: 403 });
  }

  const note = store.getNotes().find((n) => n.id === noteId);
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  store.incrementNoteDownloads(noteId);

  return NextResponse.json({
    success: true,
    downloadUrl: note.pdf_path,
    fileName: `${note.title}.pdf`,
  });
}

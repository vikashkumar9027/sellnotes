import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { loadSavedNotesFromDisk } from '@/lib/notes-storage';

export async function GET(request: NextRequest) {
  try {
    // 1. Sync from server disk if available
    const diskNotes = loadSavedNotesFromDisk();
    if (diskNotes && diskNotes.length > 0) {
      store.syncNotes(diskNotes);
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const sellerId = searchParams.get('sellerId');

    if (slug) {
      const note = store.getNoteBySlug(slug);
      if (!note) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, note });
    }

    if (sellerId) {
      const notes = store.getNotesBySeller(sellerId);
      return NextResponse.json({ success: true, notes });
    }

    const allNotes = store.getNotes();
    const approvedNotes = store.getApprovedNotes();

    return NextResponse.json({
      success: true,
      notes: allNotes,
      approvedNotes,
      totalCount: allNotes.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { noteId, userId } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const { deleteNoteAction } = await import('@/actions/notes');
    const result = await deleteNoteAction(noteId, userId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { loadSavedNotesFromDisk, loadDeletedNoteIdsFromDisk } from '@/lib/notes-storage';
import { fetchAllNotesFromSupabase } from '@/lib/supabase-db';

export async function GET(request: NextRequest) {
  try {
    // 0. Register any tombstoned deleted notes from disk into in-memory store
    const deletedOnDisk = loadDeletedNoteIdsFromDisk();
    for (const d of deletedOnDisk) {
      store.addDeletedNoteId(d);
    }

    // 1. If Supabase SQL database is connected, fetch live records from PostgreSQL
    const supabaseNotes = await fetchAllNotesFromSupabase();
    if (supabaseNotes && supabaseNotes.length > 0) {
      store.syncNotes(supabaseNotes);
    } else {
      // Fallback to local server disk storage
      const diskNotes = loadSavedNotesFromDisk();
      if (diskNotes && diskNotes.length > 0) {
        store.syncNotes(diskNotes);
      }
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
    const { noteId, userId, userRole } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const { deleteNoteAction } = await import('@/actions/notes');
    const result = await deleteNoteAction(noteId, userId, userRole);

    if (result.error && !result.alreadyDeleted) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


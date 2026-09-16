import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { loadSavedNotesFromDisk, loadDeletedNoteIdsFromDisk } from '@/lib/notes-storage';
import { fetchAllNotesFromSupabase } from '@/lib/supabase-db';
import { connectToDatabase } from '@/lib/mongodb';
import Note from '@/models/Note';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 0. Register any tombstoned deleted notes from disk into in-memory store
    const deletedOnDisk = loadDeletedNoteIdsFromDisk();
    for (const d of deletedOnDisk) {
      store.addDeletedNoteId(d);
    }

    // 1. Fetch live notes from MongoDB if connected
    try {
      await connectToDatabase();
      const mongoNotes = await Note.find({ status: 'approved' })
        .populate('seller', 'name email college profileImage course')
        .lean();

      if (mongoNotes && mongoNotes.length > 0) {
        const formatted = mongoNotes.map((n: any) => {
          const sellerObj = n.seller as Record<string, unknown> | null;
          return {
            ...n,
            id: (n._id as { toString(): string }).toString(),
            seller_id: sellerObj ? (sellerObj._id as { toString(): string })?.toString() : '',
            seller: sellerObj
              ? {
                  id: (sellerObj._id as { toString(): string })?.toString(),
                  full_name: (sellerObj.name as string) || 'Verified Student',
                  email: (sellerObj.email as string) || '',
                  college: (sellerObj.college as string) || '',
                  avatar_url: (sellerObj.profileImage as string) || '',
                  role: 'seller',
                }
              : undefined,
          };
        });
        store.syncNotes(formatted as unknown as import('@/types').Note[]);
      }
    } catch (mErr) {
      console.warn('MongoDB note sync notice:', mErr);
    }

    // 2. Supabase SQL database sync fallback
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

export async function POST(request: NextRequest) {
  try {
    // Authenticate user strictly from HTTP-only JWT cookie
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to sell your notes.' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const body = await request.json();

    const {
      title,
      description,
      subject,
      university,
      college,
      course,
      semester,
      price,
      is_free,
      pdf_path,
      page_count,
      file_size,
      storage_key,
      original_filename,
      mime_type,
      tags,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Note title is required.' }, { status: 400 });
    }
    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Subject is required.' }, { status: 400 });
    }
    if (!course || !course.trim()) {
      return NextResponse.json({ error: 'Course name is required.' }, { status: 400 });
    }
    if (!pdf_path) {
      return NextResponse.json({ error: 'PDF file path is required.' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const slug = cleanTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '') + `-${Date.now()}`;

    // Create note in MongoDB with seller strictly bound to req.user._id
    const newNote = await Note.create({
      seller: authUser._id, // NEVER trust a userId from request body!
      title: cleanTitle,
      slug,
      description: description || '',
      subject: subject.trim(),
      university: university || authUser.college || 'University Study Notes',
      college: college || authUser.college || '',
      course: course.trim(),
      semester: semester || authUser.semester || '1st Semester',
      price: is_free ? 0 : Number(price) || 0,
      is_free: Boolean(is_free),
      pdf_path,
      storage_key: storage_key || `key-${Date.now()}`,
      original_filename: original_filename || 'document.pdf',
      mime_type: mime_type || 'application/pdf',
      page_count: Number(page_count) || 1,
      file_size: Number(file_size) || 0,
      tags: Array.isArray(tags) ? tags : [],
      status: 'approved',
    });

    // Populate seller details for JSON response
    const populated = await newNote.populate('seller', 'name email college profileImage');

    const formattedNote = {
      ...populated.toJSON(),
      seller: {
        id: authUser._id.toString(),
        full_name: authUser.name,
        email: authUser.email,
        college: authUser.college,
        avatar_url: authUser.profileImage || '',
        role: 'seller',
      },
    };

    // Sync to store for instant client display
    store.saveNoteLocally(formattedNote as unknown as import('@/types').Note);

    return NextResponse.json({
      success: true,
      note: formattedNote,
      message: 'Note uploaded and published successfully!',
    });
  } catch (err: unknown) {
    console.error('Error creating note:', err);
    const message = err instanceof Error ? err.message : 'Failed to create note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { noteId } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const authUser = await getAuthUserFromRequest(request);
    const cleanId = noteId.trim();

    // Check ownership in MongoDB
    await connectToDatabase();
    const note = await Note.findOne({
      $or: [{ _id: cleanId.length === 24 ? cleanId : null }, { slug: cleanId }],
    });

    if (note) {
      const isOwner = authUser && note.seller.toString() === authUser._id.toString();
      const isAdmin = authUser && authUser.role === 'admin';

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized: You are only permitted to delete notes you uploaded.' },
          { status: 403 }
        );
      }

      await Note.deleteOne({ _id: note._id });
    }

    const { deleteNoteAction } = await import('@/actions/notes');
    const result = await deleteNoteAction(cleanId, authUser?._id.toString(), authUser?.role);

    if (result.error && !result.alreadyDeleted) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    console.error('Delete note API error:', err);
    const message = err instanceof Error ? err.message : 'Failed to delete note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

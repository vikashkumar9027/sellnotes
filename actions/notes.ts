'use server';

import fs from 'fs';
import path from 'path';
import { store } from '@/lib/store';
import { saveNotesToDisk, saveDeletedNoteIdToDisk } from '@/lib/notes-storage';
import { revalidatePath } from 'next/cache';
import { ReportSchema, ReviewSchema } from '@/lib/validators';
import { storeOriginalPdf, isValidPdfBuffer, deletePhysicalPdf } from '@/lib/server-pdf-vault';
import { getCurrentUserAction } from '@/actions/auth';
import { requireSuperAdmin } from '@/lib/super-admin-auth';
import { upsertNoteInSupabase, deleteNoteFromSupabase } from '@/lib/supabase-db';
import { getAuthUserFromCookies } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Note from '@/models/Note';

export async function uploadNoteAction(formData: FormData, sellerId: string) {
  try {
    const title = formData.get('title') as string;
    const subject = formData.get('subject') as string;
    const category_id = formData.get('category_id') as string;
    const custom_category_name = (formData.get('custom_category_name') as string) || '';
    const description = formData.get('description') as string;
    const university = formData.get('university') as string;
    const college = (formData.get('college') as string) || '';
    const course = formData.get('course') as string;
    const semester = formData.get('semester') as string;
    const year = (formData.get('year') as string) || '2026';
    const language = (formData.get('language') as string) || 'English';
    const tagsRaw = (formData.get('tags') as string) || '';
    const is_free = formData.get('is_free') === 'true';
    const price = Number(formData.get('price')) || 0;
    const page_count = Number(formData.get('page_count')) || 15;
    const terms_agreed = formData.get('terms_agreed') === 'true';

    if (!terms_agreed) {
      return { error: 'You must confirm ownership rights to upload notes' };
    }

    if (!title || !subject || (!category_id && !custom_category_name) || !description || !university || !course) {
      return { error: 'Please fill in all required fields' };
    }

    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
    const pdfFile = formData.get('pdf_file') as File | null;
    let pdf_path = '/sample-notes/sample.pdf';
    let file_size = 4500000;
    let final_page_count = page_count;
    let storage_key = `key-${Date.now()}`;
    let original_filename = 'handwritten-notes.pdf';
    let mime_type = 'application/pdf';

    if (pdfFile && typeof pdfFile !== 'string' && pdfFile.size > 0) {
      original_filename = pdfFile.name || 'handwritten-notes.pdf';
      mime_type = pdfFile.type || 'application/pdf';
      file_size = pdfFile.size;

      try {
        const bytes = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (!isValidPdfBuffer(buffer)) {
          return { error: 'Uploaded file is not a valid PDF document. Please upload a genuine PDF file.' };
        }

        const stored = await storeOriginalPdf(buffer, original_filename);
        pdf_path = stored.pdfPath;
        storage_key = stored.storageKey;
        file_size = stored.fileSize;
        // Automatic page count detection directly from uploaded PDF binary
        final_page_count = stored.pageCount > 0 ? stored.pageCount : (page_count || 1);
      } catch (fileErr) {
        console.warn('Could not process uploaded PDF file:', fileErr);
        return { error: 'Failed to process and store uploaded PDF file.' };
      }
    }

    const authUser = await getAuthUserFromCookies();
    if (!authUser) {
      return { error: 'You must be logged in to upload and sell study notes.' };
    }
    const effectiveSellerId = authUser._id.toString();

    const newNote = store.createNote(
      {
        title,
        subject,
        category_id,
        custom_category_name,
        description,
        university,
        college,
        course,
        semester,
        year,
        language,
        tags,
        is_free,
        price,
        page_count: final_page_count,
        pdf_path,
        storage_key,
        original_filename,
        mime_type,
        uploaded_at: new Date().toISOString(),
        file_size,
      },
      effectiveSellerId
    );

    if (authUser) {
      newNote.seller_id = authUser._id.toString();
      newNote.seller = {
        id: authUser._id.toString(),
        full_name: authUser.name,
        email: authUser.email,
        college: authUser.college || '',
        avatar_url: authUser.profileImage || '',
        role: 'seller',
      } as unknown as import('@/types').Profile;
    }

    // Save to MongoDB if connected
    try {
      await connectToDatabase();
      if (authUser) {
        await Note.create({
          seller: authUser._id,
          title: newNote.title,
          slug: newNote.slug,
          description: newNote.description,
          subject: newNote.subject,
          university: newNote.university,
          college: newNote.college || '',
          course: newNote.course,
          semester: newNote.semester,
          price: newNote.price,
          is_free: newNote.is_free,
          pdf_path: newNote.pdf_path,
          storage_key: newNote.storage_key,
          original_filename: newNote.original_filename,
          mime_type: newNote.mime_type,
          file_size: newNote.file_size,
          page_count: newNote.page_count,
          status: 'approved',
        });
      }
    } catch (mErr) {
      console.warn('MongoDB note save error:', mErr);
    }

    saveNotesToDisk(store.getNotes());

    // Sync to Supabase PostgreSQL table if configured
    await upsertNoteInSupabase(newNote);

    revalidatePath('/notes');
    revalidatePath('/categories');
    revalidatePath('/dashboard/seller/notes');

    return { success: true, note: newNote };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Invalid upload data';
    return { error: errorMessage };
  }
}

export async function toggleWishlistAction(userId: string, noteId: string) {
  try {
    const added = store.toggleWishlist(userId, noteId);
    revalidatePath('/notes');
    revalidatePath(`/notes/${noteId}`);
    revalidatePath('/dashboard/wishlist');
    return { success: true, isWishlisted: added };
  } catch {
    return { error: 'Failed to update wishlist' };
  }
}

export async function addReviewAction(userId: string, noteId: string, rating: number, reviewText: string) {
  try {
    const validated = ReviewSchema.parse({ rating, review: reviewText });
    const review = store.addReview(userId, noteId, validated.rating, validated.review);
    revalidatePath(`/notes/${noteId}`);
    return { success: true, review };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';
    return { error: errorMessage };
  }
}

export async function reportNoteAction(reporterId: string, noteId: string, reason: string, description: string) {
  try {
    const validated = ReportSchema.parse({ reason, description });
    const report = store.createReport(reporterId, noteId, validated.reason, validated.description);
    revalidatePath('/admin/reports');
    return { success: true, report };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to report note';
    return { error: errorMessage };
  }
}

export async function getSecureDownloadUrl(userId: string, noteId: string) {
  try {
    const hasAccess = store.hasUserPurchased(userId, noteId);
    if (!hasAccess) {
      return { error: 'Payment required to download this note.' };
    }

    const note = store.getNotes().find((n) => n.id === noteId);
    if (!note) return { error: 'Note not found' };

    store.incrementNoteDownloads(noteId);

    return {
      success: true,
      downloadUrl: note.pdf_path,
      fileName: `${note.title}.pdf`,
    };
  } catch {
    return { error: 'Failed to generate download URL' };
  }
}

export async function deleteNoteAction(
  noteId: string,
  requesterUserId?: string,
  requesterRole?: string
) {
  try {
    const cleanId = (noteId || '').trim();
    if (!cleanId) {
      return { error: 'Note ID is required' };
    }

    // Check in-memory store by ID or Slug
    const note = store.getNotes().find((n) => n.id === cleanId || n.slug === cleanId);

    // Resolve requester profile
    let user = requesterUserId ? store.getUserById(requesterUserId) : null;
    if (!user) {
      user = await getCurrentUserAction();
    }

    // Super-admin check
    let isSuperAdmin = false;
    try {
      const superAuth = await requireSuperAdmin();
      if (superAuth.authorized) isSuperAdmin = true;
    } catch {}

    const isAdmin =
      isSuperAdmin ||
      requesterRole === 'admin' ||
      requesterUserId === 'user-admin-1' ||
      user?.role === 'admin' ||
      user?.email === 'admin@notemart.com' ||
      user?.email === 'vikash@notemart.com';

    // If note is not found on server, record tombstone & remove from DB, but succeed so client can clean up
    if (!note) {
      store.deleteNote(cleanId);
      saveDeletedNoteIdToDisk(cleanId);
      await deleteNoteFromSupabase(cleanId);
      return {
        success: true,
        deletedNoteId: cleanId,
        alreadyDeleted: true,
      };
    }

    // Check ownership
    const isDirectOwner = Boolean(
      requesterUserId && (note.seller_id === requesterUserId || note.seller?.id === requesterUserId)
    );
    const isUserOwner = Boolean(
      user && (note.seller_id === user.id || note.seller?.email === user.email)
    );
    const isSellerDefault =
      requesterUserId === 'user-seller-1' || note.seller_id === 'user-seller-1' || !note.seller_id;

    if (!isAdmin && !isDirectOwner && !isUserOwner && !isSellerDefault) {
      return {
        error: 'Unauthorized: You are only permitted to delete notes that you uploaded to your account.',
      };
    }

    // 1. Physically remove PDF file from filesystem / storage vault
    if (note.pdf_path) {
      await deletePhysicalPdf(note.pdf_path);
    }

    // 2. Remove from in-memory state and tombstone registry
    store.deleteNote(note.id);
    store.deleteNote(note.slug);
    store.deleteNote(cleanId);

    // 3. Persist deleted IDs to disk
    saveDeletedNoteIdToDisk(note.id);
    saveDeletedNoteIdToDisk(note.slug);
    saveDeletedNoteIdToDisk(cleanId);

    // 4. Persist updated note list to disk
    saveNotesToDisk(store.getNotes());

    // 5. Delete from Supabase PostgreSQL if configured
    await deleteNoteFromSupabase(note.id);
    if (note.slug) {
      await deleteNoteFromSupabase(note.slug);
    }

    // 6. Delete from MongoDB database
    try {
      await connectToDatabase();
      const deleteConditions: Array<{ _id?: string; slug?: string }> = [{ slug: cleanId }];
      if (note.slug) deleteConditions.push({ slug: note.slug });
      if (cleanId.length === 24 && /^[0-9a-fA-F]{24}$/.test(cleanId)) {
        deleteConditions.push({ _id: cleanId });
      }
      if (note.id && note.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(note.id)) {
        deleteConditions.push({ _id: note.id });
      }
      await Note.deleteMany({ $or: deleteConditions });
    } catch (mongoErr) {
      console.warn('MongoDB note deletion error:', mongoErr);
    }

    // 6. Revalidate pages
    revalidatePath('/notes');
    revalidatePath('/dashboard/seller/notes');
    revalidatePath('/admin/notes');
    revalidatePath('/super-admin/notes');
    revalidatePath(`/notes/${note.slug}`);
    revalidatePath('/');

    return {
      success: true,
      deletedNoteId: note.id,
      pdfPath: note.pdf_path,
      slug: note.slug,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete note';
    return { error: message };
  }
}


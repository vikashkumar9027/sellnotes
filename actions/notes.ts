'use server';

import fs from 'fs';
import path from 'path';
import { store } from '@/lib/store';
import { saveNotesToDisk } from '@/lib/notes-storage';
import { revalidatePath } from 'next/cache';
import { ReportSchema, ReviewSchema } from '@/lib/validators';
import { storeOriginalPdf, isValidPdfBuffer, deletePhysicalPdf } from '@/lib/server-pdf-vault';
import { getCurrentUserAction } from '@/actions/auth';
import { requireSuperAdmin } from '@/lib/super-admin-auth';

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
      sellerId
    );

    saveNotesToDisk(store.getNotes());

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

export async function deleteNoteAction(noteId: string, requesterUserId?: string) {
  try {
    if (!noteId) {
      return { error: 'Note ID is required' };
    }

    const note = store.getNotes().find((n) => n.id === noteId);
    if (!note) {
      return { error: 'Note not found' };
    }

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
      user?.role === 'admin' ||
      user?.email === 'admin@notemart.com' ||
      user?.email === 'vikash@notemart.com';

    const isOwner = user && (note.seller_id === user.id || note.seller?.email === user.email);

    if (!isAdmin && !isOwner) {
      return {
        error: 'Unauthorized: You are only permitted to delete notes that you uploaded to your account.',
      };
    }

    // 1. Physically remove PDF file from filesystem / storage vault
    await deletePhysicalPdf(note.pdf_path);

    // 2. Remove from in-memory state
    store.deleteNote(noteId);

    // 3. Persist updated note list to disk
    saveNotesToDisk(store.getNotes());

    // 4. Revalidate pages
    revalidatePath('/notes');
    revalidatePath('/dashboard/seller/notes');
    revalidatePath('/admin/notes');
    revalidatePath('/super-admin/notes');
    revalidatePath(`/notes/${note.slug}`);
    revalidatePath('/');

    return {
      success: true,
      deletedNoteId: noteId,
      pdfPath: note.pdf_path,
      slug: note.slug,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete note';
    return { error: message };
  }
}


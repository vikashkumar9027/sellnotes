'use server';

import { store } from '@/lib/store';
import { revalidatePath } from 'next/cache';
import { ReportSchema, ReviewSchema } from '@/lib/validators';

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
    const pdf_path = pdfFile ? `/uploads/${pdfFile.name}` : '/sample-notes/sample.pdf';
    const file_size = pdfFile ? pdfFile.size : 4500000;

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
        page_count,
        pdf_path,
        file_size,
      },
      sellerId
    );

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

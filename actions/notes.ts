'use server';

import fs from 'fs';
import path from 'path';
import { store } from '@/lib/store';
import { saveNotesToDisk } from '@/lib/notes-storage';
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
    let pdf_path = '/sample-notes/sample.pdf';
    let file_size = 4500000;

    if (pdfFile && typeof pdfFile !== 'string' && pdfFile.size > 0) {
      file_size = pdfFile.size;
      try {
        const bytes = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeName = `${Date.now()}-${pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // 1. Try public/uploads (local dev, VPS, persistent server)
        let written = false;
        try {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          fs.writeFileSync(path.join(uploadsDir, safeName), buffer);
          written = true;
        } catch {
          // Ignored if read-only filesystem
        }

        // 2. Fallback to /tmp/uploads (Vercel serverless writable storage)
        if (!written) {
          try {
            const tmpDir = path.join('/tmp', 'uploads');
            if (!fs.existsSync(tmpDir)) {
              fs.mkdirSync(tmpDir, { recursive: true });
            }
            fs.writeFileSync(path.join(tmpDir, safeName), buffer);
          } catch (tmpErr) {
            console.warn('Could not write to /tmp/uploads:', tmpErr);
          }
        }

        pdf_path = `/uploads/${safeName}`;
      } catch (fileErr) {
        console.warn('Could not process uploaded PDF file:', fileErr);
        pdf_path = `/uploads/${Date.now()}-${pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
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
        page_count,
        pdf_path,
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

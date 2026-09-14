import { createAdminClient } from '@/lib/supabase/admin';
import { Note, Purchase } from '@/types';

/**
 * Checks if real production Supabase environment variables are present.
 */
export function isRealSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && !url.includes('demo.supabase.co') && key && !key.includes('demo'));
}

/**
 * Fetch all notes from Supabase PostgreSQL notes table.
 */
export async function fetchAllNotesFromSupabase(): Promise<Note[] | null> {
  if (!isRealSupabase()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Supabase fetch notes error:', error?.message);
      return null;
    }
    return data as Note[];
  } catch (err) {
    console.warn('Supabase fetch notes failed:', err);
    return null;
  }
}

/**
 * Persist or update a note in the Supabase PostgreSQL notes table.
 */
export async function upsertNoteInSupabase(note: Note): Promise<boolean> {
  if (!isRealSupabase()) return false;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('notes').upsert({
      id: note.id,
      seller_id: note.seller_id,
      category_id: note.category_id || null,
      title: note.title,
      slug: note.slug,
      description: note.description,
      subject: note.subject,
      university: note.university,
      college: note.college || '',
      course: note.course,
      semester: note.semester,
      year: note.year || '2026',
      language: note.language || 'English',
      tags: note.tags || [],
      pdf_path: note.pdf_path,
      preview_path: note.preview_path || null,
      thumbnail_url: note.thumbnail_url || null,
      file_size: note.file_size || 0,
      page_count: note.page_count || 1,
      price: note.price || 0,
      is_free: Boolean(note.is_free),
      status: note.status || 'pending',
      downloads: note.downloads || 0,
      views: note.views || 0,
      created_at: note.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase upsert note error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsert note failed:', err);
    return false;
  }
}

/**
 * Remove a note record from the Supabase PostgreSQL notes table.
 */
export async function deleteNoteFromSupabase(noteId: string): Promise<boolean> {
  if (!isRealSupabase() || !noteId) return false;
  try {
    const supabase = createAdminClient();
    const clean = noteId.trim();
    const { error } = await supabase
      .from('notes')
      .delete()
      .or(`id.eq.${clean},slug.eq.${clean}`);
    if (error) {
      console.warn('Supabase delete note error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete note failed:', err);
    return false;
  }
}

/**
 * Record a verified purchase in the Supabase PostgreSQL purchases table.
 */
export async function recordPurchaseInSupabase(purchase: Purchase): Promise<boolean> {
  if (!isRealSupabase()) return false;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('purchases').upsert({
      id: purchase.id,
      buyer_id: purchase.buyer_id,
      seller_id: purchase.seller_id,
      note_id: purchase.note_id,
      amount: purchase.amount,
      platform_fee: purchase.platform_fee,
      seller_amount: purchase.seller_amount,
      status: purchase.status,
      created_at: purchase.created_at,
    });

    if (error) {
      console.warn('Supabase record purchase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase record purchase failed:', err);
    return false;
  }
}

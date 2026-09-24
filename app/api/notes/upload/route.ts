import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getAuthUserFromRequest, getAuthUserFromCookies } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Note from '@/models/Note';
import User from '@/models/User';
import { store } from '@/lib/store';
import { saveNotesToDisk } from '@/lib/notes-storage';
import { storeOriginalPdf, isValidPdfBuffer } from '@/lib/server-pdf-vault';
import { upsertNoteInSupabase } from '@/lib/supabase-db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user from request or cookies
    let authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      authUser = await getAuthUserFromCookies();
    }

    // 2. Parse multipart form data
    const formData = await request.formData();

    // Fallback: If cookies were not present or cross-origin/session expired, resolve via form data
    if (!authUser) {
      const sellerId = formData.get('seller_id') as string;
      const userEmail = formData.get('user_email') as string;
      if (sellerId || userEmail) {
        await connectToDatabase();
        if (sellerId && mongoose.isValidObjectId(sellerId)) {
          authUser = await User.findById(sellerId).select('-password');
        }
        if (!authUser && userEmail) {
          authUser = await User.findOne({ email: userEmail.trim().toLowerCase() }).select('-password');
        }
      }
    }

    if (!authUser) {
      return NextResponse.json(
        { error: 'Please log in or register before uploading notes.' },
        { status: 401 }
      );
    }

    const title = (formData.get('title') as string) || '';
    const subject = (formData.get('subject') as string) || '';
    let category_id = (formData.get('category_id') as string) || '';
    let custom_category_name = (formData.get('custom_category_name') as string) || '';
    const description = (formData.get('description') as string) || '';
    const university = (formData.get('university') as string) || '';
    const college = (formData.get('college') as string) || '';
    const course = (formData.get('course') as string) || '';
    const semester = (formData.get('semester') as string) || '1st Semester';
    const year = (formData.get('year') as string) || '2026';
    const language = (formData.get('language') as string) || 'English';
    const tagsRaw = (formData.get('tags') as string) || '';
    const is_free = formData.get('is_free') === 'true';
    const price = Number(formData.get('price')) || 0;
    const page_count = Number(formData.get('page_count')) || 1;
    const terms_agreed =
      formData.get('terms_agreed') === 'true' ||
      formData.get('terms_agreed') === 'on' ||
      formData.get('terms_agreed') === '1' ||
      Boolean(formData.get('terms_agreed'));

    if (!terms_agreed) {
      return NextResponse.json(
        { error: 'You must confirm ownership rights to upload notes.' },
        { status: 400 }
      );
    }

    if (!title.trim() || !subject.trim() || !university.trim() || !course.trim()) {
      return NextResponse.json(
        { error: 'Please fill in all required fields (title, subject, course, university).' },
        { status: 400 }
      );
    }

    if (!category_id && !custom_category_name) {
      custom_category_name = course.trim();
    }

    const finalDescription =
      description.trim() ||
      `${title.trim()} handwritten study notes for ${subject.trim()} (${course.trim()}), ${university.trim()}. Verified exam preparation material.`;

    const pdfFile = formData.get('pdf_file') as File | null;
    if (!pdfFile || typeof pdfFile === 'string' || pdfFile.size === 0) {
      return NextResponse.json(
        { error: 'Please select a genuine PDF document to upload.' },
        { status: 400 }
      );
    }

    // 3. Process PDF file binary
    const originalFileName = pdfFile.name || 'handwritten-notes.pdf';
    const mimeType = pdfFile.type || 'application/pdf';
    const bytes = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!isValidPdfBuffer(buffer)) {
      return NextResponse.json(
        { error: 'Uploaded file is not a valid PDF document. Please upload a genuine PDF file.' },
        { status: 400 }
      );
    }

    // 4. Store PDF file in vault
    const stored = await storeOriginalPdf(buffer, originalFileName);
    const finalPageCount = stored.pageCount > 0 ? stored.pageCount : (page_count || 1);

    // 5. Generate clean URL slug
    const cleanTitle = title.trim();
    const baseSlug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
    const slug = `${baseSlug}-${Date.now()}`;

    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

    // 6. Record note in MongoDB with seller strictly bound to authUser._id
    await connectToDatabase();

    if (authUser.role !== 'seller' && authUser.role !== 'admin') {
      authUser.role = 'seller';
      await authUser.save().catch(() => {});
    }

    const newMongoNote = await Note.create({
      seller: authUser._id,
      title: cleanTitle,
      slug,
      description: finalDescription,
      subject: subject.trim(),
      university: university.trim(),
      college: college.trim() || authUser.college || '',
      course: course.trim(),
      semester,
      year,
      language,
      tags,
      price: is_free ? 0 : price,
      is_free,
      pdf_path: stored.pdfPath,
      storage_key: stored.storageKey,
      original_filename: originalFileName,
      mime_type: mimeType,
      page_count: finalPageCount,
      file_size: stored.fileSize,
      status: 'approved',
    });

    const populated = await newMongoNote.populate('seller', 'name email college profileImage course');

    const formattedNote = {
      ...populated.toJSON(),
      id: populated._id.toString(),
      seller_id: authUser._id.toString(),
      seller: {
        id: authUser._id.toString(),
        full_name: authUser.name,
        email: authUser.email,
        college: authUser.college || '',
        avatar_url: authUser.profileImage || '',
        role: 'seller',
      },
    };

    // 7. Sync into store & persist to disk
    store.saveNoteLocally(formattedNote as unknown as import('@/types').Note);
    saveNotesToDisk(store.getNotes());

    // 8. Non-blocking sync to Supabase (2s timeout)
    try {
      await Promise.race([
        upsertNoteInSupabase(formattedNote as unknown as import('@/types').Note),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch (supaErr) {
      console.warn('Supabase sync skipped or timed out:', supaErr);
    }

    return NextResponse.json({
      success: true,
      note: formattedNote,
      message: 'Note published live successfully!',
    });
  } catch (err: unknown) {
    console.error('API notes/upload error:', err);
    const message = err instanceof Error ? err.message : 'Failed to upload note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import {
  uploadBufferToGridFS,
  storeOriginalPdf,
  isValidPdfBuffer,
  detectPdfPageCountFromBuffer,
} from '@/lib/server-pdf-vault';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const uploadId = (formData.get('uploadId') as string) || '';
    const chunkIndex = parseInt((formData.get('chunkIndex') as string) || '0', 10);
    const totalChunks = parseInt((formData.get('totalChunks') as string) || '1', 10);
    const fileName = (formData.get('fileName') as string) || 'handwritten-notes.pdf';
    const chunkFile = formData.get('chunk') as File | null;

    if (!uploadId) {
      return NextResponse.json({ error: 'Missing uploadId parameter' }, { status: 400 });
    }

    if (!chunkFile || typeof chunkFile === 'string' || chunkFile.size === 0) {
      return NextResponse.json({ error: 'Missing or empty chunk binary' }, { status: 400 });
    }

    const chunkBytes = await chunkFile.arrayBuffer();
    const chunkBuffer = Buffer.from(chunkBytes);

    await connectToDatabase();
    const db = mongoose.connection.db!;
    const chunksCollection = db.collection('upload_chunks');

    // Upsert chunk in MongoDB
    await chunksCollection.updateOne(
      { uploadId, chunkIndex },
      {
        $set: {
          uploadId,
          chunkIndex,
          totalChunks,
          fileName,
          data: chunkBuffer,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Check how many chunks have been uploaded for this uploadId
    const uploadedCount = await chunksCollection.countDocuments({ uploadId });

    // If still waiting for more chunks, return progress response
    if (uploadedCount < totalChunks) {
      return NextResponse.json({
        success: true,
        done: false,
        chunkIndex,
        totalChunks,
        uploadedCount,
        progress: Math.round((uploadedCount / totalChunks) * 100),
      });
    }

    // All chunks received! Assemble complete file
    const allChunks = await chunksCollection.find({ uploadId }).sort({ chunkIndex: 1 }).toArray();

    if (allChunks.length < totalChunks) {
      return NextResponse.json({
        success: true,
        done: false,
        uploadedCount: allChunks.length,
        totalChunks,
      });
    }

    const bufferParts: Buffer[] = allChunks.map((c) => {
      if (Buffer.isBuffer(c.data)) {
        return c.data;
      }
      if (c.data?.buffer) {
        return Buffer.from(c.data.buffer);
      }
      return Buffer.from(c.data);
    });

    const fullBuffer = Buffer.concat(bufferParts);

    if (!isValidPdfBuffer(fullBuffer)) {
      await chunksCollection.deleteMany({ uploadId });
      return NextResponse.json(
        { error: 'Uploaded file is not a valid PDF document.' },
        { status: 400 }
      );
    }

    const pageCount = detectPdfPageCountFromBuffer(fullBuffer);

    // 1. Upload to permanent MongoDB GridFS storage
    const gridResult = await uploadBufferToGridFS(fullBuffer, fileName);

    // 2. Also populate local/tmp/supabase fallback tiers
    const localStoreResult = await storeOriginalPdf(fullBuffer, fileName).catch(() => null);

    // 3. Clean up temporary chunks from database
    await chunksCollection.deleteMany({ uploadId }).catch(() => {});

    const pdfPath = `/api/notes/file?gridFsId=${gridResult.gridFsId}`;

    return NextResponse.json({
      success: true,
      done: true,
      gridFsId: gridResult.gridFsId,
      pdfPath,
      storageKey: localStoreResult?.storageKey || `gridfs_${gridResult.gridFsId}`,
      fileSize: fullBuffer.length,
      pageCount: gridResult.pageCount || pageCount || 1,
      fileName,
    });
  } catch (err: unknown) {
    console.error('Error in chunk upload API:', err);
    const message = err instanceof Error ? err.message : 'Chunk upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

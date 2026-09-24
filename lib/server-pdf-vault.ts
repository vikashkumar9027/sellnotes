import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import { createAdminClient } from '@/lib/supabase/admin';
import { connectToDatabase } from '@/lib/mongodb';

export interface StoredPdfResult {
  storageKey: string;
  pdfPath: string;
  gridFsId?: string;
  fileSize: number;
  pageCount: number;
  originalFileName: string;
  mimeType: string;
}

/**
 * Validate that a buffer begins with standard PDF magic bytes (%PDF-).
 */
export function isValidPdfBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) return false;
  // Standard PDF begins with %PDF-, but scanner apps/BOM may offset it slightly
  const headChunk = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('latin1');
  return headChunk.includes('%PDF-');
}

/**
 * Accurately detect the real page count directly from the raw PDF binary.
 * Reads the /Pages dictionary /Count or tallies distinct /Type /Page objects.
 */
export function detectPdfPageCountFromBuffer(buffer: Buffer): number {
  try {
    if (!isValidPdfBuffer(buffer)) return 1;

    // Fast sampling of head and trailer bytes (linear O(1) memory, no freezing)
    let sampleBuffer: Buffer;
    if (buffer.length > 1024 * 1024) {
      const head = buffer.subarray(0, 512 * 1024);
      const tail = buffer.subarray(buffer.length - 512 * 1024);
      sampleBuffer = Buffer.concat([head, tail]);
    } else {
      sampleBuffer = buffer;
    }

    const text = sampleBuffer.toString('latin1');

    // Direct /Count search without catastrophic backtracking
    const countMatches = text.matchAll(/\/Count\s+(\d+)/g);
    let maxCount = 0;
    for (const match of countMatches) {
      const val = parseInt(match[1], 10);
      if (val > maxCount && val <= 10000) {
        maxCount = val;
      }
    }
    if (maxCount > 0) return maxCount;

    const pageMatches = text.match(/\/Type\s*\/Page\b(?!\s*s)/g);
    if (pageMatches && pageMatches.length > 0) {
      return Math.min(pageMatches.length, 10000);
    }
  } catch (err) {
    console.warn('Could not detect page count from PDF buffer:', err);
  }
  return 1;
}

/**
 * Store buffer directly in MongoDB GridFS (permanent serverless cloud storage).
 */
export async function uploadBufferToGridFS(
  buffer: Buffer,
  originalFileName: string
): Promise<{ gridFsId: string; fileSize: number; pageCount: number }> {
  await connectToDatabase();
  const pageCount = detectPdfPageCountFromBuffer(buffer);
  const fileSize = buffer.length;
  const safeName = `${Date.now()}-${originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName: 'pdfs' });
  const uploadStream = bucket.openUploadStream(safeName, {
    metadata: {
      originalFileName,
      mimeType: 'application/pdf',
      pageCount,
      fileSize,
      uploadedAt: new Date(),
    },
  });

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer).pipe(uploadStream).on('finish', () => resolve()).on('error', reject);
  });

  return {
    gridFsId: uploadStream.id.toString(),
    fileSize,
    pageCount,
  };
}

/**
 * Retrieve buffer directly from MongoDB GridFS by ID.
 */
export async function getBufferFromGridFS(gridFsId: string): Promise<Buffer | null> {
  try {
    await connectToDatabase();
    if (!gridFsId || !mongoose.Types.ObjectId.isValid(gridFsId)) return null;

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName: 'pdfs' });
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(gridFsId));

    const chunks: Buffer[] = [];
    return await new Promise<Buffer | null>((resolve) => {
      downloadStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
      downloadStream.on('error', (err) => {
        console.warn('GridFS download error:', err);
        resolve(null);
      });
    });
  } catch (err) {
    console.warn('Could not read from GridFS:', err);
    return null;
  }
}

/**
 * Store the original raw PDF file byte-for-byte across all available persistent tiers.
 */
export async function storeOriginalPdf(
  buffer: Buffer,
  originalFileName: string
): Promise<StoredPdfResult> {
  const fileSize = buffer.length;
  const pageCount = detectPdfPageCountFromBuffer(buffer);
  const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const safeName = `${Date.now()}-${sanitizedName}`;
  const storageKey = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  let pdfPath = `/uploads/${safeName}`;
  let gridFsId: string | undefined = undefined;

  // 1. Primary: Store in MongoDB GridFS (permanent serverless storage across Vercel instances)
  try {
    const gridResult = await uploadBufferToGridFS(buffer, originalFileName);
    gridFsId = gridResult.gridFsId;
    pdfPath = `/api/notes/file?gridFsId=${gridFsId}`;
  } catch (gridErr) {
    console.warn('GridFS storage upload note:', gridErr);
  }

  // 2. Local disk persistent storage (public/uploads)
  try {
    const publicUploads = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(publicUploads)) {
      fs.mkdirSync(publicUploads, { recursive: true });
    }
    fs.writeFileSync(path.join(publicUploads, safeName), buffer);
  } catch {
    // Read-only filesystem (e.g. Vercel production)
  }

  // 3. Data directory persistent storage (data/uploads)
  try {
    const dataUploads = path.join(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(dataUploads)) {
      fs.mkdirSync(dataUploads, { recursive: true });
    }
    fs.writeFileSync(path.join(dataUploads, safeName), buffer);
  } catch {
    // Read-only filesystem
  }

  // 4. Serverless temp storage (/tmp/uploads)
  try {
    const tmpUploads = path.join('/tmp', 'uploads');
    if (!fs.existsSync(tmpUploads)) {
      fs.mkdirSync(tmpUploads, { recursive: true });
    }
    fs.writeFileSync(path.join(tmpUploads, safeName), buffer);
  } catch {
    // Temp storage failure
  }

  // 5. Supabase Storage (if configured in environment)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isRealSupabase = supabaseUrl && !supabaseUrl.includes('demo.supabase.co');

    if (isRealSupabase) {
      const supabase = createAdminClient();
      const uploadPromise = supabase.storage
        .from('notes')
        .upload(`pdfs/${safeName}`, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Supabase storage timeout') }), 2500)
      );

      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

      if (!error && data?.path) {
        const { data: publicData } = supabase.storage.from('notes').getPublicUrl(data.path);
        if (publicData?.publicUrl) {
          pdfPath = publicData.publicUrl;
        }
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload skipped or timed out:', err);
  }

  return {
    storageKey,
    pdfPath,
    gridFsId,
    fileSize,
    pageCount,
    originalFileName,
    mimeType: 'application/pdf',
  };
}

/**
 * Retrieve the original byte-for-byte PDF buffer.
 * Returns null if not found. NEVER returns a dummy template!
 */
export async function getOriginalPdfBuffer(
  requestedPath?: string | null,
  fallbackName?: string | null
): Promise<Buffer | null> {
  // 1. Check if requestedPath contains gridFsId
  if (requestedPath) {
    const gridMatch = requestedPath.match(/[?&]gridFsId=([a-f0-9]{24})/i);
    if (gridMatch && gridMatch[1]) {
      const gridBuf = await getBufferFromGridFS(gridMatch[1]);
      if (gridBuf && gridBuf.length > 0 && isValidPdfBuffer(gridBuf)) {
        return gridBuf;
      }
    }

    if (mongoose.Types.ObjectId.isValid(requestedPath)) {
      const gridBuf = await getBufferFromGridFS(requestedPath);
      if (gridBuf && gridBuf.length > 0 && isValidPdfBuffer(gridBuf)) {
        return gridBuf;
      }
    }
  }

  if (fallbackName) {
    const gridMatch = fallbackName.match(/[?&]gridFsId=([a-f0-9]{24})/i);
    if (gridMatch && gridMatch[1]) {
      const gridBuf = await getBufferFromGridFS(gridMatch[1]);
      if (gridBuf && gridBuf.length > 0 && isValidPdfBuffer(gridBuf)) {
        return gridBuf;
      }
    }
  }

  const candidatePaths: string[] = [];

  if (requestedPath) {
    // If it is a remote Supabase URL or HTTP URL, fetch it
    if (requestedPath.startsWith('http://') || requestedPath.startsWith('https://')) {
      try {
        const res = await fetch(requestedPath);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          return Buffer.from(ab);
        }
      } catch (err) {
        console.warn('Could not fetch PDF from remote URL:', err);
      }
    }

    const cleanReq = requestedPath.startsWith('/') ? requestedPath.slice(1) : requestedPath;
    const baseName = path.basename(cleanReq);

    candidatePaths.push(path.join(process.cwd(), 'public', cleanReq));
    candidatePaths.push(path.join(process.cwd(), 'public', 'uploads', baseName));
    candidatePaths.push(path.join(process.cwd(), 'data', 'uploads', baseName));
    candidatePaths.push(path.join('/tmp', cleanReq));
    candidatePaths.push(path.join('/tmp', 'uploads', baseName));
  }

  if (fallbackName) {
    const cleanFall = fallbackName.startsWith('/') ? fallbackName.slice(1) : fallbackName;
    const baseName = path.basename(cleanFall);

    candidatePaths.push(path.join(process.cwd(), 'public', cleanFall));
    candidatePaths.push(path.join(process.cwd(), 'public', 'uploads', baseName));
    candidatePaths.push(path.join(process.cwd(), 'data', 'uploads', baseName));
    candidatePaths.push(path.join('/tmp', 'uploads', baseName));
  }

  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const buf = fs.readFileSync(filePath);
        if (buf && buf.length > 0 && isValidPdfBuffer(buf)) {
          return buf;
        }
      }
    } catch {
      // Continue search
    }
  }

  return null;
}

/**
 * Delete the physical PDF file from storage tiers when a note is deleted.
 */
export async function deletePhysicalPdf(pdfPath?: string | null): Promise<boolean> {
  if (!pdfPath) return true;

  // If remote Supabase URL
  if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const isRealSupabase = supabaseUrl && !supabaseUrl.includes('demo.supabase.co');
      if (isRealSupabase) {
        const supabase = createAdminClient();
        const baseName = path.basename(pdfPath);
        await supabase.storage.from('notes').remove([`pdfs/${baseName}`]);
      }
    } catch (e) {
      console.warn('Could not delete from Supabase storage:', e);
    }
  }

  const cleanPath = pdfPath.startsWith('/') ? pdfPath.slice(1) : pdfPath;
  const baseName = path.basename(cleanPath);

  const targets = [
    path.join(process.cwd(), 'public', cleanPath),
    path.join(process.cwd(), 'public', 'uploads', baseName),
    path.join(process.cwd(), 'data', 'uploads', baseName),
    path.join('/tmp', cleanPath),
    path.join('/tmp', 'uploads', baseName),
  ];

  for (const t of targets) {
    try {
      if (fs.existsSync(t)) {
        fs.unlinkSync(t);
      }
    } catch {
      // Ignore if cannot unlink (e.g. read-only filesystem)
    }
  }
  return true;
}

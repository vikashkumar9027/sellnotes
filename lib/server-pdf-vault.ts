import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';

export interface StoredPdfResult {
  storageKey: string;
  pdfPath: string;
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
  const header = buffer.subarray(0, 5).toString('ascii');
  return header === '%PDF-';
}

/**
 * Accurately detect the real page count directly from the raw PDF binary.
 * Reads the /Pages dictionary /Count or tallies distinct /Type /Page objects.
 */
export function detectPdfPageCountFromBuffer(buffer: Buffer): number {
  try {
    if (!isValidPdfBuffer(buffer)) return 1;

    const content = buffer.toString('binary');

    // 1. Try to extract /Count N from the root /Pages object
    // Match /Type\s*/Pages.*?/Count\s+(\d+) or /Count\s+(\d+).*?/Type\s*/Pages
    const pagesMatches = content.match(/\/Type\s*\/Pages\b[\s\S]*?\/Count\s+(\d+)/);
    if (pagesMatches && pagesMatches[1]) {
      const count = parseInt(pagesMatches[1], 10);
      if (count > 0 && count < 5000) {
        return count;
      }
    }

    const countMatches = content.match(/\/Count\s+(\d+)[\s\S]*?\/Type\s*\/Pages\b/);
    if (countMatches && countMatches[1]) {
      const count = parseInt(countMatches[1], 10);
      if (count > 0 && count < 5000) {
        return count;
      }
    }

    // 2. Fallback: Count occurrences of "/Type /Page" (excluding "/Type /Pages")
    const pageObjMatches = content.match(/\/Type\s*\/Page\b(?!\s*s)/g);
    if (pageObjMatches && pageObjMatches.length > 0) {
      return pageObjMatches.length;
    }
  } catch (err) {
    console.warn('Could not detect page count from PDF buffer:', err);
  }
  return 1;
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

  // 1. Local disk persistent storage (public/uploads)
  try {
    const publicUploads = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(publicUploads)) {
      fs.mkdirSync(publicUploads, { recursive: true });
    }
    fs.writeFileSync(path.join(publicUploads, safeName), buffer);
  } catch {
    // Read-only filesystem (e.g. Vercel production)
  }

  // 2. Data directory persistent storage (data/uploads)
  try {
    const dataUploads = path.join(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(dataUploads)) {
      fs.mkdirSync(dataUploads, { recursive: true });
    }
    fs.writeFileSync(path.join(dataUploads, safeName), buffer);
  } catch {
    // Read-only filesystem
  }

  // 3. Serverless temp storage (/tmp/uploads)
  try {
    const tmpUploads = path.join('/tmp', 'uploads');
    if (!fs.existsSync(tmpUploads)) {
      fs.mkdirSync(tmpUploads, { recursive: true });
    }
    fs.writeFileSync(path.join(tmpUploads, safeName), buffer);
  } catch {
    // Temp storage failure
  }

  // 4. Supabase Storage (if configured in environment)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isRealSupabase = supabaseUrl && !supabaseUrl.includes('demo.supabase.co');

    if (isRealSupabase) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.storage
        .from('notes')
        .upload(`pdfs/${safeName}`, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (!error && data?.path) {
        const { data: publicData } = supabase.storage.from('notes').getPublicUrl(data.path);
        if (publicData?.publicUrl) {
          pdfPath = publicData.publicUrl;
        }
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload skipped or failed:', err);
  }

  return {
    storageKey,
    pdfPath,
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

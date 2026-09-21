// Client-side IndexedDB storage for full fidelity PDF files
const DB_NAME = 'notemart_pdf_db';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_files';

function openPdfDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePdfToIndexedDB(key: string | string[], blobOrFile: Blob): Promise<void> {
  if (typeof window === 'undefined' || !key || !blobOrFile) return;
  const keys = Array.isArray(key) ? key : [key];
  try {
    const db = await openPdfDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const k of keys) {
        if (k && k.trim()) {
          store.put(blobOrFile, k.trim());
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save PDF to IndexedDB:', err);
  }
}

export async function getPdfFromIndexedDB(keyOrKeys: string | string[]): Promise<Blob | null> {
  if (typeof window === 'undefined' || !keyOrKeys) return null;
  const keys = (Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys]).filter(Boolean);
  if (keys.length === 0) return null;

  try {
    const db = await openPdfDatabase();
    for (const k of keys) {
      const blob = await new Promise<Blob | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(k);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (blob && blob.size > 0) {
        return blob;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function downloadBlobAsFile(blob: Blob, fileName: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Inspect an uploaded PDF file and detect the exact page count on the client.
 */
export async function detectClientPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // 1. Check if PDF.js is available on window
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      try {
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;
        if (doc && doc.numPages > 0) {
          return doc.numPages;
        }
      } catch {
        // Fall back to binary scan
      }
    }

    // 2. Fast sampling of header and trailer bytes (linear O(1) memory, no freezing)
    const bytes = new Uint8Array(arrayBuffer);
    let sampleBytes: Uint8Array;
    if (bytes.length > 1024 * 1024) {
      const head = bytes.subarray(0, 512 * 1024);
      const tail = bytes.subarray(bytes.length - 512 * 1024);
      sampleBytes = new Uint8Array(head.length + tail.length);
      sampleBytes.set(head);
      sampleBytes.set(tail, head.length);
    } else {
      sampleBytes = bytes;
    }
    const text = new TextDecoder('latin1').decode(sampleBytes);

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
    console.warn('Could not detect page count client-side:', err);
  }
  return 1;
}

/**
 * Remove a PDF and all its cached keys from client-side IndexedDB when deleted.
 */
export async function deletePdfFromIndexedDB(
  keyOrKeys: (string | undefined | null) | (string | undefined | null)[]
): Promise<void> {
  if (typeof window === 'undefined' || !keyOrKeys) return;
  const rawList = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
  const keys = rawList.filter((k): k is string => typeof k === 'string' && k.trim().length > 0);
  if (keys.length === 0) return;

  try {
    const db = await openPdfDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const k of keys) {
        store.delete(k.trim());
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Could not delete PDF from IndexedDB:', err);
  }
}

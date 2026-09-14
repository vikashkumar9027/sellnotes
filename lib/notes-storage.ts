import fs from 'fs';
import path from 'path';
import { Note } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTES_FILE = path.join(DATA_DIR, 'uploaded-notes.json');
const DELETED_FILE = path.join(DATA_DIR, 'deleted-notes.json');

const TMP_DIR = path.join('/tmp', 'notemart-data');
const TMP_NOTES_FILE = path.join(TMP_DIR, 'uploaded-notes.json');
const TMP_DELETED_FILE = path.join(TMP_DIR, 'deleted-notes.json');

export function loadSavedNotesFromDisk(): Note[] {
  try {
    if (typeof window === 'undefined') {
      const targetFiles = [NOTES_FILE, TMP_NOTES_FILE];
      for (const f of targetFiles) {
        if (fs.existsSync(f)) {
          const fileData = fs.readFileSync(f, 'utf-8');
          const parsed = JSON.parse(fileData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not read saved notes from disk:', err);
  }
  return [];
}

export function saveNotesToDisk(notes: Note[]): void {
  try {
    if (typeof window === 'undefined') {
      let written = false;
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
        written = true;
      } catch {
        // Fallback to /tmp on serverless environments
      }

      if (!written) {
        try {
          if (!fs.existsSync(TMP_DIR)) {
            fs.mkdirSync(TMP_DIR, { recursive: true });
          }
          fs.writeFileSync(TMP_NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
        } catch (tmpErr) {
          console.warn('Could not write notes to /tmp:', tmpErr);
        }
      }
    }
  } catch (err) {
    console.warn('Could not write notes to disk:', err);
  }
}

export function loadDeletedNoteIdsFromDisk(): string[] {
  const ids: Set<string> = new Set();
  try {
    if (typeof window === 'undefined') {
      const targetFiles = [DELETED_FILE, TMP_DELETED_FILE];
      for (const f of targetFiles) {
        if (fs.existsSync(f)) {
          const fileData = fs.readFileSync(f, 'utf-8');
          const parsed = JSON.parse(fileData);
          if (Array.isArray(parsed)) {
            for (const id of parsed) {
              if (typeof id === 'string' && id.trim()) {
                ids.add(id.trim());
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not read deleted note IDs from disk:', err);
  }
  return Array.from(ids);
}

export function saveDeletedNoteIdToDisk(idOrSlug: string): void {
  if (typeof window === 'undefined' && idOrSlug && idOrSlug.trim()) {
    try {
      const current = new Set(loadDeletedNoteIdsFromDisk());
      current.add(idOrSlug.trim());
      const arr = Array.from(current);

      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DELETED_FILE, JSON.stringify(arr, null, 2), 'utf-8');
      } catch {
        // Fallback
      }

      try {
        if (!fs.existsSync(TMP_DIR)) {
          fs.mkdirSync(TMP_DIR, { recursive: true });
        }
        fs.writeFileSync(TMP_DELETED_FILE, JSON.stringify(arr, null, 2), 'utf-8');
      } catch {}
    } catch (err) {
      console.warn('Could not save deleted note ID to disk:', err);
    }
  }
}

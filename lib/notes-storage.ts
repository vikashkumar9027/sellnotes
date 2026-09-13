import fs from 'fs';
import path from 'path';
import { Note } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTES_FILE = path.join(DATA_DIR, 'uploaded-notes.json');

export function loadSavedNotesFromDisk(): Note[] {
  try {
    if (typeof window === 'undefined' && fs.existsSync(NOTES_FILE)) {
      const fileData = fs.readFileSync(NOTES_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        return parsed;
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
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Could not write notes to disk:', err);
  }
}

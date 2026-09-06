import React from 'react';
import Link from 'next/link';
import { BookOpen, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-2xl shadow-md">
        404
      </div>
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">Page Not Found</h1>
      <p className="text-xs text-slate-500 max-w-sm">
        The study notes page or resource you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
      >
        <Home className="w-4 h-4" /> Return to NoteMart Home
      </Link>
    </div>
  );
}

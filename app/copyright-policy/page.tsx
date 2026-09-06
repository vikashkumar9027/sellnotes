import React from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function CopyrightPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Copyright Protection Policy</h1>
        <p className="text-xs text-slate-500 font-medium">Protecting original author intellectual property &amp; academic integrity.</p>
      </div>

      <div className="space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm">Strict Zero-Tolerance Rule</h4>
            <p className="mt-1">NoteMart strictly prohibits uploading scanned textbooks, commercial paid course videos, leaked examination papers, or unauthorized copies of third-party publications.</p>
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. What Material Is Allowed?</h3>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li>Original handwritten lecture notes taken during class.</li>
          <li>Hand-drawn diagrams, formula cheat-sheets, and revision summaries.</li>
          <li>Personal solution steps for university past year question papers.</li>
        </ul>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white">2. Reporting Copyright Violations</h3>
        <p>If you believe a note published on NoteMart infringes your copyright or trademark rights, you can file an immediate report directly on the note page or email <span className="font-bold text-indigo-600">copyright@notemart.edu</span> with details.</p>
      </div>
    </div>
  );
}

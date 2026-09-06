import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">Terms &amp; Conditions</h1>
      <p className="text-xs text-slate-500">Effective Date: January 1, 2026</p>

      <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. Ownership &amp; User Warranties</h3>
        <p>By uploading handwritten notes to NoteMart, sellers confirm that all notes were authored by them or that they possess explicit authorization to distribute the study materials.</p>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white">2. Platform Commission &amp; Payouts</h3>
        <p>NoteMart retains a default 10% platform commission on all paid transactions. Sellers may request withdrawal of available earnings once their balance exceeds ₹100.</p>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white">3. Content Moderation &amp; Takedowns</h3>
        <p>NoteMart reserves the right to suspend accounts or remove materials that infringe third-party copyrights, contain pirated textbooks, or violate academic integrity policies.</p>
      </div>
    </div>
  );
}

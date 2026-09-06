import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">Privacy Policy</h1>
      <p className="text-xs text-slate-500">Effective Date: January 1, 2026</p>

      <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. Data We Collect</h3>
        <p>NoteMart collects minimal account details including full name, student email address, university name, and payout payment details to process transactions securely.</p>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white">2. Payment Security</h3>
        <p>Financial transactions are handled through Razorpay. NoteMart does not store credit card credentials, bank passwords, or sensitive payment tokens on our servers.</p>
      </div>
    </div>
  );
}

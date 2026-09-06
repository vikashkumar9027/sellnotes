'use client';

import React from 'react';
import UploadForm from '@/components/notes/UploadForm';
import { store } from '@/lib/store';

export default function SellerUploadPage() {
  const categories = store.getCategories();
  const sellerId = 'user-seller-1';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Sell Your Handwritten Notes</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Upload PDF notes, set your price, and earn up to 90% per sale directly into your bank account.
        </p>
      </div>

      <UploadForm categories={categories} sellerId={sellerId} />
    </div>
  );
}

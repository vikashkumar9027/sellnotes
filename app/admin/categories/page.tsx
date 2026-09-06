'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { createCategoryAction } from '@/actions/admin';
import { PlusCircle, BookOpen } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState(() => store.getCategories());
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createCategoryAction(name, desc);
    setCategories([...store.getCategories()]);
    setName('');
    setDesc('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Category Management</h1>
        <p className="text-xs text-slate-500 font-medium">Create and organize academic domain categories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <form onSubmit={handleCreate} className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Add New Category</h3>
          <div>
            <label className="text-xs font-bold text-slate-700">Category Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Artificial Intelligence"
              className="w-full py-2 px-3 rounded-xl border text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="Brief description of subjects in this category..."
              className="w-full py-2 px-3 rounded-xl border text-xs"
            />
          </div>
          <button type="submit" className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs">
            Add Category
          </button>
        </form>

        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Existing Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{cat.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
                <span className="text-[10px] text-indigo-600 font-mono">/categories/{cat.slug}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

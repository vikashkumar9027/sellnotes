'use client';

import React from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { BookOpen, ArrowRight } from 'lucide-react';

export default function CategoriesPage() {
  const categories = store.getCategories();
  const notes = store.getApprovedNotes();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">Browse Subject Categories</h1>
        <p className="text-slate-500 text-sm font-medium">
          Find handwritten study notes tailored specifically for your branch and department.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const count = notes.filter((n) => n.category_id === cat.id).length;
          return (
            <Link
              key={cat.id}
              href={`/notes?category=${cat.slug}`}
              className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-xl transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {count} {count === 1 ? 'Note' : 'Notes'}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>Browse {cat.name} Notes</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

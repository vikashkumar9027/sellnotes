'use client';

import React from 'react';
import { Filter, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Category, SearchFilterState } from '@/types';

interface FilterSidebarProps {
  categories: Category[];
  filters: SearchFilterState;
  onChange: (newFilters: Partial<SearchFilterState>) => void;
  onReset: () => void;
}

export default function FilterSidebar({ categories, filters, onChange, onReset }: FilterSidebarProps) {
  const semesters = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];
  
  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Most Downloaded', value: 'downloads' },
    { label: 'Rating (High to Low)', value: 'rating' },
    { label: 'Price: Low to High', value: 'price_low' },
    { label: 'Price: High to Low', value: 'price_high' },
  ];

  return (
    <aside className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-6 shadow-xs">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Filters &amp; Sort</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* SORT BY */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Sort Marketplace By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ sortBy: e.target.value as SearchFilterState['sortBy'] })}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* PRICING TYPE (FREE vs PAID) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Material Type
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {[
            { label: 'All', value: 'all' },
            { label: 'Free', value: 'free' },
            { label: 'Paid', value: 'paid' },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => onChange({ type: type.value as SearchFilterState['type'] })}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                filters.type === type.value
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Domain Category
        </label>
        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          <button
            onClick={() => onChange({ category: '' })}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
              !filters.category
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>All Categories</span>
            {!filters.category && <Check className="w-3.5 h-3.5" />}
          </button>
          {categories.map((cat) => {
            const isSelected = filters.category === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onChange({ category: cat.slug })}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SEMESTER */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Semester
        </label>
        <select
          value={filters.semester}
          onChange={(e) => onChange({ semester: e.target.value })}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden"
        >
          <option value="">All Semesters</option>
          {semesters.map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>
      </div>

      {/* MINIMUM RATING */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Minimum Rating
        </label>
        <div className="flex items-center gap-1 text-xs">
          {[0, 4, 4.5].map((stars) => (
            <button
              key={stars}
              onClick={() => onChange({ minRating: stars })}
              className={`flex-1 py-1.5 rounded-lg font-semibold border transition-all ${
                filters.minRating === stars
                  ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {stars === 0 ? 'Any' : `${stars}+ ★`}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

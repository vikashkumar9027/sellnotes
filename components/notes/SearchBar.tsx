'use client';

import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, BookOpen } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  defaultValue?: string;
  onToggleMobileFilters?: () => void;
}

export default function SearchBar({ onSearch, defaultValue = '', onToggleMobileFilters }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center shadow-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
        <div className="pl-4 text-indigo-500">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, subjects, universities (e.g. DSA, IIT Bombay, Chemistry)..."
          className="w-full py-4 px-3 text-slate-900 dark:text-white placeholder-slate-400 bg-transparent text-sm md:text-base focus:outline-hidden"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="pr-2 flex items-center gap-2">
          {onToggleMobileFilters && (
            <button
              type="button"
              onClick={onToggleMobileFilters}
              className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>
          )}

          <button
            type="submit"
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
}

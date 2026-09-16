'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, SlidersHorizontal, BookOpen, Loader2, ArrowRight, Sparkles, FileText } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface SuggestionNote {
  id: string;
  title: string;
  slug: string;
  subject: string;
  university: string;
  course: string;
  semester?: string;
  price: number;
  is_free: boolean;
  page_count: number;
  thumbnail_url?: string;
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
  defaultValue?: string;
  onToggleMobileFilters?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function SearchBar({
  onSearch,
  defaultValue = '',
  onToggleMobileFilters,
  placeholder = 'Search notes, subjects, universities...',
  autoFocus = false,
  className = '',
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SuggestionNote[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync defaultValue if it changes from parent
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debouncing
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setTotalMatches(0);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/notes/search?q=${encodeURIComponent(trimmed)}&limit=6&sort=relevance`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notes)) {
          setSuggestions(data.notes);
          setTotalMatches(data.total || data.notes.length);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      }
    } catch (err) {
      console.warn('Real-time notes search fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 350);
    } else {
      setSuggestions([]);
      setTotalMatches(0);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setTotalMatches(0);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  };

  const executeSearch = (targetQuery: string) => {
    setIsOpen(false);
    const clean = targetQuery.trim();
    if (onSearch) {
      onSearch(clean);
    } else {
      if (clean) {
        router.push(`/search?q=${encodeURIComponent(clean)}`);
      } else {
        router.push('/search');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      // If user selected an item with arrow keys, go directly to that note
      router.push(`/notes/${suggestions[selectedIndex].slug}`);
      setIsOpen(false);
      return;
    }
    executeSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        router.push(`/notes/${suggestions[selectedIndex].slug}`);
        setIsOpen(false);
      } else {
        executeSearch(query);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center shadow-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
          <div className="pl-4 text-indigo-500 flex items-center">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim().length >= 2 && suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            spellCheck="false"
            className="w-full py-4 px-3 text-slate-900 dark:text-white placeholder-slate-400 bg-transparent text-sm md:text-base focus:outline-hidden"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="pr-2 flex items-center gap-2">
            {onToggleMobileFilters && (
              <button
                type="button"
                onClick={onToggleMobileFilters}
                className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
            )}

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* REAL-TIME AUTO-SUGGESTIONS DROPDOWN */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2.5 max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <Link
                    key={item.id || item.slug}
                    href={`/notes/${item.slug}`}
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-3.5 p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-100'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {/* Thumbnail or Fallback Icon */}
                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-indigo-500" />
                      )}
                    </div>

                    {/* Note details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {item.subject}
                        </span>
                        {' • '}
                        <span>{item.university || item.course}</span>
                      </p>
                    </div>

                    {/* Price and page count badge */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          item.is_free
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        {item.is_free ? 'FREE' : formatPrice(item.price)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.page_count} pages
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="py-6 px-4 text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No notes found matching &ldquo;<span className="font-bold text-indigo-600 dark:text-indigo-400">{query}</span>&rdquo;
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try searching by subject name (e.g. Python, DBMS), university (AKTU, DTU), or course (B.Tech).
                </p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          {query.trim().length >= 2 && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => executeSearch(query)}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>
                  {totalMatches > 0
                    ? `View all ${totalMatches} notes for "${query}"`
                    : `Search for "${query}"`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

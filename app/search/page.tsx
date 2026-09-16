'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  FileQuestion,
  Check,
} from 'lucide-react';
import SearchBar from '@/components/notes/SearchBar';
import NoteCard from '@/components/notes/NoteCard';
import { Note } from '@/types';

interface AvailableFilters {
  subjects: string[];
  universities: string[];
  courses: string[];
}

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL search params
  const initialQuery = searchParams.get('q') || '';
  const initialSubject = searchParams.get('subject') || '';
  const initialUniversity = searchParams.get('university') || '';
  const initialCourse = searchParams.get('course') || '';
  const initialSemester = searchParams.get('semester') || '';
  const initialPrice = searchParams.get('price') || 'all';
  const initialSort = searchParams.get('sort') || 'relevance';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  // States
  const [query, setQuery] = useState(initialQuery);
  const [subject, setSubject] = useState(initialSubject);
  const [university, setUniversity] = useState(initialUniversity);
  const [course, setCourse] = useState(initialCourse);
  const [semester, setSemester] = useState(initialSemester);
  const [price, setPrice] = useState(initialPrice);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initialPage);

  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters>({
    subjects: [],
    universities: [],
    courses: [],
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync state when URL params change
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setSubject(searchParams.get('subject') || '');
    setUniversity(searchParams.get('university') || '');
    setCourse(searchParams.get('course') || '');
    setSemester(searchParams.get('semester') || '');
    setPrice(searchParams.get('price') || 'all');
    setSort(searchParams.get('sort') || 'relevance');
    setPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  // Fetch results from MongoDB search API
  const fetchSearchResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (subject) params.set('subject', subject);
      if (university) params.set('university', university);
      if (course) params.set('course', course);
      if (semester) params.set('semester', semester);
      if (price && price !== 'all') params.set('price', price);
      if (sort) params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '12');

      const res = await fetch(`/api/notes/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotes(data.notes || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          if (data.availableFilters) {
            setAvailableFilters(data.availableFilters);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch search results:', err);
    } finally {
      setIsLoading(false);
    }
  }, [query, subject, university, course, semester, price, sort, page]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // Update URL params
  const updateUrl = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === '' || val === 'all' || val === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    router.push(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
    updateUrl({ q: newQuery, page: 1 });
  };

  const handleResetFilters = () => {
    setSubject('');
    setUniversity('');
    setCourse('');
    setSemester('');
    setPrice('all');
    setSort('relevance');
    setPage(1);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/search?${params.toString()}`);
  };

  const hasActiveFilters = Boolean(subject || university || course || semester || price !== 'all' || sort !== 'relevance');

  const popularKeywords = ['Python', 'DBMS', 'Operating System', 'Computer Networks', 'DSA', 'Machine Learning', 'UPSC Polity', 'GATE CSE', 'AKTU', 'DTU'];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
      {/* HEADER WITH SEARCH BAR */}
      <section className="bg-gradient-to-b from-indigo-900/10 via-indigo-50/30 to-slate-50/50 dark:from-slate-900 dark:via-slate-900/40 dark:to-slate-950 pt-8 pb-10 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Search{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 bg-clip-text text-transparent">
                Study Notes
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
              Search by subject, university, degree, tags, or handwritten notes topic.
            </p>

            <div className="pt-2">
              <SearchBar
                defaultValue={query}
                onSearch={handleSearchSubmit}
                onToggleMobileFilters={() => setMobileFiltersOpen(true)}
                placeholder="Search notes, subjects, universities (e.g. Python, AKTU, DBMS)..."
              />
            </div>

            {/* POPULAR SEARCH CHIPS */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Popular:</span>
              {popularKeywords.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSearchSubmit(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-2xs ${
                    query.toLowerCase() === tag.toLowerCase()
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT: FILTERS SIDEBAR + RESULTS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* DESKTOP SIDEBAR FILTERS */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span>Search Filters</span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>

              {/* SORT SELECT */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                    updateUrl({ sort: e.target.value, page: 1 });
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* PRICE FILTER */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Price
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  {(['all', 'free', 'paid'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPrice(p);
                        setPage(1);
                        updateUrl({ price: p, page: 1 });
                      }}
                      className={`py-1.5 rounded-lg capitalize transition-all ${
                        price === p
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {p === 'all' ? 'All' : p === 'free' ? 'Free' : 'Paid'}
                    </button>
                  ))}
                </div>
              </div>

              {/* SUBJECT SELECTOR */}
              {availableFilters.subjects.length > 0 && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setPage(1);
                      updateUrl({ subject: e.target.value, page: 1 });
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden"
                  >
                    <option value="">All Subjects</option>
                    {availableFilters.subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* UNIVERSITY / BOARD */}
              {availableFilters.universities.length > 0 && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    University / Board
                  </label>
                  <select
                    value={university}
                    onChange={(e) => {
                      setUniversity(e.target.value);
                      setPage(1);
                      updateUrl({ university: e.target.value, page: 1 });
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden"
                  >
                    <option value="">All Universities</option>
                    {availableFilters.universities.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* COURSE */}
              {availableFilters.courses.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Course / Degree
                  </label>
                  <select
                    value={course}
                    onChange={(e) => {
                      setCourse(e.target.value);
                      setPage(1);
                      updateUrl({ course: e.target.value, page: 1 });
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden"
                  >
                    <option value="">All Courses</option>
                    {availableFilters.courses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </aside>

          {/* RESULTS AREA */}
          <main className="flex-1 min-w-0">
            {/* RESULTS HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>
                    {query
                      ? `Search Results for "${query}"`
                      : 'All Available Notes'}
                  </span>
                  {!isLoading && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {total} {total === 1 ? 'note' : 'notes'}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Real-time notes verified from university toppers and student peers.
                </p>
              </div>

              {/* ACTIVE FILTER BADGES */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {subject && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      Subject: {subject}
                      <button
                        onClick={() => {
                          setSubject('');
                          updateUrl({ subject: '' });
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {university && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      University: {university}
                      <button
                        onClick={() => {
                          setUniversity('');
                          updateUrl({ university: '' });
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {price !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {price === 'free' ? 'Free Only' : 'Paid Only'}
                      <button
                        onClick={() => {
                          setPrice('all');
                          updateUrl({ price: 'all' });
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* RESULTS GRID OR LOADING SKELETON */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notes.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.map((note) => (
                    <NoteCard key={note.id || (note as any)._id} note={note} />
                  ))}
                </div>

                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, page - 1);
                        setPage(newPage);
                        updateUrl({ page: newPage });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page <= 1}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setPage(p);
                            updateUrl({ page: p });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
                            page === p
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        const newPage = Math.min(totalPages, page + 1);
                        setPage(newPage);
                        updateUrl({ page: newPage });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page >= totalPages}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                      title="Next page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* EMPTY STATE */
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 mx-auto">
                  <FileQuestion className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    No matching notes found
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    We couldn&apos;t find any notes matching your search criteria.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Suggested Searches:
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {['Python Programming', 'DBMS', 'Operating System', 'UPSC Polity', 'AKTU', 'B.Tech'].map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearchSubmit(term)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="pt-2">
                    <button
                      onClick={handleResetFilters}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE FILTERS SLIDE-OVER MODAL */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <span>Filters &amp; Sort</span>
                </h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SORT */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    updateUrl({ sort: e.target.value, page: 1 });
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* PRICE */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Price
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  {(['all', 'free', 'paid'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPrice(p);
                        updateUrl({ price: p, page: 1 });
                      }}
                      className={`py-1.5 rounded-lg capitalize ${
                        price === p ? 'bg-white dark:bg-slate-900 text-indigo-600 font-bold shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* SUBJECT */}
              {availableFilters.subjects.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      updateUrl({ subject: e.target.value, page: 1 });
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="">All Subjects</option>
                    {availableFilters.subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* UNIVERSITY */}
              {availableFilters.universities.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    University / Board
                  </label>
                  <select
                    value={university}
                    onChange={(e) => {
                      setUniversity(e.target.value);
                      updateUrl({ university: e.target.value, page: 1 });
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="">All Universities</option>
                    {availableFilters.universities.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Apply &amp; View Results
              </button>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    handleResetFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}

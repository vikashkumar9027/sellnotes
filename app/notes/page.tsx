'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/notes/SearchBar';
import FilterSidebar from '@/components/notes/FilterSidebar';
import NoteCard from '@/components/notes/NoteCard';
import { store } from '@/lib/store';
import { SearchFilterState } from '@/types';
import { COURSES_CATALOG } from '@/lib/course-catalog';
import { BookOpen, Loader2 } from 'lucide-react';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as SearchFilterState['type']) || 'all';
  const initialLevel = searchParams.get('level') || '';
  const initialCourse = searchParams.get('course') || '';

  const [categories, setCategories] = useState(() => store.getCategories());
  const [allNotes, setAllNotes] = useState(() => store.getApprovedNotes());

  useEffect(() => {
    // 1. Immediate sync with local storage
    setAllNotes(store.getApprovedNotes());
    setCategories(store.getCategories());

    // 2. Fetch from server API to pull any newly uploaded notes
    fetch('/api/notes')
      .then((res) => res.json())
      .then((data) => {
        if (data.notes && Array.isArray(data.notes)) {
          store.syncNotes(data.notes);
          setAllNotes(store.getApprovedNotes());
          setCategories(store.getCategories());
        }
      })
      .catch((err) => console.warn('Could not sync notes from API:', err));

    // 3. Listen for local update events
    const handleNotesUpdated = () => {
      setAllNotes([...store.getApprovedNotes()]);
      setCategories([...store.getCategories()]);
    };

    window.addEventListener('notemart_notes_updated', handleNotesUpdated);
    window.addEventListener('storage', handleNotesUpdated);

    return () => {
      window.removeEventListener('notemart_notes_updated', handleNotesUpdated);
      window.removeEventListener('storage', handleNotesUpdated);
    };
  }, []);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilterState>({
    searchQuery: initialQuery,
    category: initialCategory,
    subject: '',
    university: '',
    course: initialCourse,
    semester: '',
    language: '',
    level: initialLevel,
    type: initialType,
    priceRange: [0, 2000],
    minRating: 0,
    sortBy: 'newest',
    page: 1,
  });

  const handleFilterChange = (newFilters: Partial<SearchFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      category: '',
      subject: '',
      university: '',
      course: '',
      semester: '',
      language: '',
      level: '',
      type: 'all',
      priceRange: [0, 2000],
      minRating: 0,
      sortBy: 'newest',
      page: 1,
    });
  };

  const filteredNotes = useMemo(() => {
    return allNotes.filter((note) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(q);
        const matchesSubject = note.subject.toLowerCase().includes(q);
        const matchesUni = note.university.toLowerCase().includes(q);
        const matchesCourse = note.course.toLowerCase().includes(q);
        const matchesTags = note.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSubject && !matchesUni && !matchesCourse && !matchesTags) {
          return false;
        }
      }

      // Filter by Education Level
      if (filters.level) {
        const levelCourses = COURSES_CATALOG.filter((c) => c.level === filters.level);
        const levelCourseNames = levelCourses.map((c) => c.name.toLowerCase());
        const levelCategorySlugs = new Set(levelCourses.map((c) => c.categorySlug));
        const noteCourse = note.course.toLowerCase();
        
        const matchesLevelCourse = levelCourseNames.some((cn) => noteCourse.includes(cn) || cn.includes(noteCourse));
        const noteCategory = categories.find((c) => c.id === note.category_id);
        const matchesLevelCategory = noteCategory && levelCategorySlugs.has(noteCategory.slug);
        
        const matchesKeywords =
          (filters.level === 'school-10' && (noteCourse.includes('10th') || noteCourse.includes('class 10') || note.title.toLowerCase().includes('class 10'))) ||
          (filters.level === 'school-11' && (noteCourse.includes('11th') || noteCourse.includes('class 11') || note.title.toLowerCase().includes('class 11'))) ||
          (filters.level === 'school-12' && (noteCourse.includes('12th') || noteCourse.includes('class 12') || note.title.toLowerCase().includes('class 12'))) ||
          (filters.level === 'ug' && (noteCourse.includes('b.a') || noteCourse.includes('b.sc') || noteCourse.includes('b.com') || noteCourse.includes('b.tech') || noteCourse.includes('bca') || noteCourse.includes('bba') || noteCourse.includes('ll.b') || noteCourse.includes('b.ed') || noteCourse.includes('b.pharma'))) ||
          (filters.level === 'pg' && (noteCourse.includes('m.a') || noteCourse.includes('m.sc') || noteCourse.includes('m.com') || noteCourse.includes('mba') || noteCourse.includes('mca') || noteCourse.includes('m.tech') || noteCourse.includes('ll.m') || noteCourse.includes('m.ed'))) ||
          (filters.level === 'competitive' && (noteCourse.includes('upsc') || noteCourse.includes('gate') || noteCourse.includes('ssc') || noteCourse.includes('banking') || noteCourse.includes('ugc net') || noteCourse.includes('jee') || noteCourse.includes('neet')));

        if (!matchesLevelCourse && !matchesLevelCategory && !matchesKeywords) {
          return false;
        }
      }

      // Filter by Course
      if (filters.course) {
        const cLow = filters.course.toLowerCase();
        const nCourseLow = note.course.toLowerCase();
        if (!nCourseLow.includes(cLow) && !cLow.includes(nCourseLow)) {
          return false;
        }
      }

      // Filter by Subject
      if (filters.subject) {
        const sLow = filters.subject.toLowerCase();
        const nSubLow = note.subject.toLowerCase();
        if (!nSubLow.includes(sLow) && !sLow.includes(nSubLow)) {
          return false;
        }
      }

      if (filters.category) {
        const cat = categories.find((c) => c.slug === filters.category);
        if (cat && note.category_id !== cat.id) return false;
      }

      if (filters.type === 'free' && !note.is_free) return false;
      if (filters.type === 'paid' && note.is_free) return false;

      if (filters.semester && note.semester !== filters.semester) return false;

      if (filters.minRating > 0 && note.average_rating < filters.minRating) return false;

      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'popular':
        case 'downloads':
          return b.downloads - a.downloads;
        case 'rating':
          return b.average_rating - a.average_rating;
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [allNotes, categories, filters]);

  return (
    <div className="space-y-8">
      {/* PAGE TITLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Handwritten Notes Marketplace
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Browse verified study notes from top students across universities &amp; competitive exams.
          </p>
        </div>
        <div className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full self-start md:self-auto">
          Showing {filteredNotes.length} of {allNotes.length} notes
        </div>
      </div>

      {/* SEARCH BAR */}
      <SearchBar
        defaultValue={filters.searchQuery}
        onSearch={(q) => handleFilterChange({ searchQuery: q })}
        onToggleMobileFilters={() => setMobileFilterOpen(!mobileFilterOpen)}
      />

      {/* MARKETPLACE BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* DESKTOP FILTER SIDEBAR */}
        <div className="hidden lg:block">
          <FilterSidebar
            categories={categories}
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* MOBILE FILTER MODAL */}
        {mobileFilterOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-md mx-auto space-y-4 shadow-2xl my-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Filter Notes</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-bold px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
              <FilterSidebar
                categories={categories}
                filters={filters}
                onChange={(f) => {
                  handleFilterChange(f);
                  setMobileFilterOpen(false);
                }}
                onReset={handleResetFilters}
              />
            </div>
          </div>
        )}

        {/* NOTES GRID AREA */}
        <div className="lg:col-span-3">
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                No Notes Found
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                We couldn&apos;t find any study notes matching your filter criteria. Try clearing search filters or selecting a different subject.
              </p>
              <button
                onClick={handleResetFilters}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 font-bold">Loading Marketplace Notes...</p>
          </div>
        }
      >
        <MarketplaceContent />
      </Suspense>
    </div>
  );
}

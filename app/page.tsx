'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  PlusCircle,
  BookOpen,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Award,
  Download,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Users,
  Star,
  Lock,
  Zap,
  GraduationCap,
  ChevronRight,
  Check,
  Layers,
  FileCheck,
  Shield,
  HelpCircle,
} from 'lucide-react';
import NoteCard from '@/components/notes/NoteCard';
import SearchBar from '@/components/notes/SearchBar';
import { store } from '@/lib/store';
import { formatPrice } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const categories = store.getCategories();
  const approvedNotes = store.getApprovedNotes();
  const trendingNotes = approvedNotes.slice(0, 4);
  const latestNotes = [...approvedNotes].reverse().slice(0, 4);

  const academicCategories = categories.filter((c) => !c.id.startsWith('cat-gov')).slice(0, 8);
  const govtCategories = categories.filter((c) => c.id.startsWith('cat-gov')).slice(0, 8);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/notes?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/notes');
    }
  };

  return (
    <div className="space-y-24 pb-20 bg-slate-50/50 dark:bg-slate-950">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION WITH MODERN GRADIENT & GLASSMORPHISM STATS */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-20 lg:pb-28 bg-gradient-to-b from-indigo-900/10 via-indigo-50/40 to-slate-50/50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
        {/* Background Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-indigo-500/15 dark:bg-indigo-500/25 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-amber-500/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            {/* Top Announcement Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-indigo-200 dark:border-indigo-800/60 shadow-lg shadow-indigo-500/5 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold tracking-wide uppercase">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>India&apos;s #1 Verified Student &amp; Govt Exam Notes Marketplace</span>
            </div>

            {/* Main Hero Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]">
              Study Smarter with{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 bg-clip-text text-transparent">
                Topper Notes
              </span>{' '}
              or Sell &amp; Earn 80%
            </h1>

            {/* Subheading Description */}
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-3xl mx-auto">
              Buy verified handwritten notes from IIT, DTU, AIIMS &amp; UPSC toppers. Read online in our DRM-protected secure reader or earn passive income selling your own notes.
            </p>

            {/* Search Component */}
            <div className="pt-2 max-w-2xl mx-auto">
              <SearchBar onSearch={handleSearch} />
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Popular:</span>
                {['UPSC Polity', 'GATE CSE', 'SSC CGL Maths', 'Data Structures', 'IIT Bombay', 'NEET Biology'].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-all shadow-2xs hover:scale-105"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/notes"
                className="w-full sm:w-auto py-4 px-9 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2.5 hover:scale-105"
              >
                <BookOpen className="w-5 h-5" />
                <span>Explore Notes Marketplace</span>
              </Link>
              <Link
                href="/dashboard/seller/upload"
                className="w-full sm:w-auto py-4 px-9 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 hover:scale-105"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Sell Notes &amp; Earn 90%</span>
              </Link>
            </div>

            {/* Platform Trust & Stat Badges Grid */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-slate-200/80 dark:border-slate-800">
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">15,000+</div>
                <div className="text-xs text-slate-500 font-bold mt-0.5">Active Student Aspirants</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">4,200+</div>
                <div className="text-xs text-slate-500 font-bold mt-0.5">Verified Note Modules</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">₹8.5 Lakh+</div>
                <div className="text-xs text-slate-500 font-bold mt-0.5">Earned by Toppers</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <div className="text-2xl sm:text-3xl font-black text-amber-500">4.9 ★</div>
                <div className="text-xs text-slate-500 font-bold mt-0.5">Average Topper Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. GOVERNMENT & COMPETITIVE EXAMS SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Government Exam Mastery
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Competitive &amp; Govt Exam Notes 🏛️
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Handwritten notes with solved 10-year PYQs, formulas &amp; mind maps for major entrance exams.
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline"
          >
            <span>All Exam Categories</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {govtCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/notes?category=${cat.slug}`}
              className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-xl transition-all duration-200 text-center flex flex-col items-center justify-between gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-1">
                  {cat.note_count || 30}+ notes
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. POPULAR ACADEMIC & ENGINEERING STREAMS */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" /> University Degrees
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Engineering &amp; Academic Degrees 📚
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Branch-wise handwritten notes covering B.Tech, CS, IT, Mechanical, Civil, Commerce &amp; MBA.
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>View All Streams</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {academicCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/notes?category=${cat.slug}`}
              className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-xl transition-all duration-200 text-center flex flex-col items-center justify-between gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                  {cat.note_count || 20}+ notes
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HIGHEST RATED TRENDING NOTES GRID */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" /> Highest Rated &amp; Downloaded
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Trending Topper Notes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Handwritten notes verified for accuracy, neatness, and exam syllabus coverage.
            </p>
          </div>
          <Link
            href="/notes?sortBy=downloads"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>See All Marketplace Notes</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PLATFORM VALUE PROPOSITION & SECURITY CARDS */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider border border-indigo-500/30">
              Why Students Trust NoteMart
            </span>
            <h2 className="text-3xl sm:text-4xl font-black">Built for Academic Success &amp; Seller Protection</h2>
            <p className="text-slate-400 text-sm font-medium">
              We combine modern digital rights protection with transparent 18% GST tax accounting &amp; 80% seller payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-800/80 border border-slate-700/70 hover:border-indigo-500 transition-all space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Anti-Screenshot In-Browser Reader</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Full notes are read inside our Secure In-Browser Reader with anti-screenshot overlays, disabled right-click, and disabled print controls to protect seller copyrights.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-800/80 border border-slate-700/70 hover:border-indigo-500 transition-all space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">4-Page Demo Image Preview</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Buyers get instant access to a 4-page sample image preview before buying. Complete access to all pages unlocks immediately after payment.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-800/80 border border-slate-700/70 hover:border-indigo-500 transition-all space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">80% Seller Payout + GST Compliance</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Sellers keep 80% of their base note price. 18% GST is collected separately from buyers for statutory tax accounting without double-deducting seller earnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. RECENTLY UPLOADED NOTES MARKETPLACE */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Recently Uploaded Notes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Fresh notes added by university toppers and competitive exam aspirants.
            </p>
          </div>
          <Link
            href="/notes"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>Browse All Notes</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BOTTOM CTA SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Ready to Ace Your Semester or Sell Your Notes?
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm font-medium">
              Join 15,000+ students buying verified notes or earning passive income with instant UPI payouts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/notes"
              className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-white text-indigo-600 font-black text-sm shadow-lg hover:bg-indigo-50 transition-all text-center"
            >
              Browse Notes
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-lg hover:bg-slate-800 transition-all text-center"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

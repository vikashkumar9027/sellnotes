'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Calculator, Plus, Sparkles, Loader2, ExternalLink, GraduationCap, BookOpen, Layers } from 'lucide-react';
import { Category } from '@/types';
import { uploadNoteAction } from '@/actions/notes';
import { formatFileSize } from '@/lib/utils';
import { store } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import {
  EDUCATION_LEVELS,
  COURSES_CATALOG,
  getCoursesByLevel,
  getSubjectsForCourse,
  getSemestersForLevel,
} from '@/lib/course-catalog';

interface UploadFormProps {
  categories: Category[];
  sellerId?: string;
}

export default function UploadForm({ categories, sellerId = 'user-seller-1' }: UploadFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const activeSellerId = user?.id || sellerId || 'user-seller-1';
  const [loading, setLoading] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState(49);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Education Level & Course System
  const [selectedLevel, setSelectedLevel] = useState<string>('ug');
  const [availableCourses, setAvailableCourses] = useState(() => getCoursesByLevel('ug'));
  const [selectedCourseOption, setSelectedCourseOption] = useState<string>('B.A. (Hons) English Literature');
  const [customCourse, setCustomCourse] = useState('');

  // Course-specific Subjects System
  const [availableSubjects, setAvailableSubjects] = useState(() => getSubjectsForCourse('B.A. (Hons) English Literature'));
  const [selectedSubjectOption, setSelectedSubjectOption] = useState<string>(
    () => getSubjectsForCourse('B.A. (Hons) English Literature')[0] || ''
  );
  const [customSubject, setCustomSubject] = useState('');

  // Level-specific Semesters / Phases
  const [availableSemesters, setAvailableSemesters] = useState(() => getSemestersForLevel('ug'));
  const [selectedSemester, setSelectedSemester] = useState<string>(() => getSemestersForLevel('ug')[0] || '1st Semester');

  // Category Selector
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const defaultCourse = COURSES_CATALOG.find((c) => c.name === 'B.A. (Hons) English Literature');
    const match = categories.find((cat) => cat.slug === (defaultCourse?.categorySlug || 'english-complete'));
    return match ? match.id : '';
  });
  const [customCategory, setCustomCategory] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newNoteSlug, setNewNoteSlug] = useState('');

  const settings = store.getSettings();
  const platformFee = isFree ? 0 : Math.round((price * settings.platform_commission) / 100);
  const sellerEarning = isFree ? 0 : price - platformFee;

  const handleLevelChange = (levelId: string) => {
    setSelectedLevel(levelId);
    const courses = getCoursesByLevel(levelId);
    setAvailableCourses(courses);
    const firstCourse = courses[0]?.name || '';
    setSelectedCourseOption(firstCourse);
    setCustomCourse('');

    if (firstCourse) {
      const subs = getSubjectsForCourse(firstCourse);
      setAvailableSubjects(subs);
      setSelectedSubjectOption(subs[0] || 'custom');

      const foundCourse = COURSES_CATALOG.find((c) => c.name === firstCourse);
      if (foundCourse) {
        const matchedCat = categories.find((c) => c.slug === foundCourse.categorySlug);
        if (matchedCat) setSelectedCategory(matchedCat.id);
      }
    }

    const sems = getSemestersForLevel(levelId);
    setAvailableSemesters(sems);
    setSelectedSemester(sems[0] || '');
  };

  const handleCourseChange = (courseName: string) => {
    setSelectedCourseOption(courseName);
    if (courseName !== 'custom') {
      const subs = getSubjectsForCourse(courseName);
      setAvailableSubjects(subs);
      setSelectedSubjectOption(subs[0] || 'custom');

      const foundCourse = COURSES_CATALOG.find((c) => c.name === courseName);
      if (foundCourse) {
        const matchedCat = categories.find((c) => c.slug === foundCourse.categorySlug);
        if (matchedCat) setSelectedCategory(matchedCat.id);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setErrorMsg('Only PDF files are allowed.');
        setSelectedFile(null);
        return;
      }
      if (file.size > settings.max_pdf_size_mb * 1024 * 1024) {
        setErrorMsg(`File size exceeds maximum allowed limit of ${settings.max_pdf_size_mb} MB.`);
        setSelectedFile(null);
        return;
      }
      setErrorMsg('');
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setNewNoteSlug('');

    if (!selectedFile) {
      setErrorMsg('Please select a PDF file of your handwritten notes.');
      return;
    }

    if (selectedCategory === 'custom' && !customCategory.trim()) {
      setErrorMsg('Please type your custom category name.');
      return;
    }

    const finalCourse = selectedCourseOption === 'custom' ? customCourse.trim() : selectedCourseOption;
    if (!finalCourse) {
      setErrorMsg('Please select or type a course / degree name.');
      return;
    }

    const finalSubject = selectedSubjectOption === 'custom' ? customSubject.trim() : selectedSubjectOption;
    if (!finalSubject) {
      setErrorMsg('Please type or select a subject name.');
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('pdf_file', selectedFile);
    formData.append('is_free', String(isFree));
    formData.append('price', String(isFree ? 0 : price));
    formData.append('course', finalCourse);
    formData.append('subject', finalSubject);
    formData.append('semester', selectedSemester);

    if (selectedCategory === 'custom') {
      formData.append('custom_category_name', customCategory.trim());
      formData.append('category_id', '');
    } else {
      formData.append('category_id', selectedCategory);
      formData.append('custom_category_name', '');
    }

    const res = await uploadNoteAction(formData, activeSellerId);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      if (res.note) {
        // 1. Immediately register in client store and persist to localStorage
        store.saveNoteLocally(res.note);
        // 2. Dispatch event to notify all listening components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('notemart_notes_updated'));
        }
      }
      const slug = res.note?.slug || '';
      setNewNoteSlug(slug);
      setSuccessMsg('🎉 Note published live! Your note is now visible on the main marketplace and in your seller dashboard.');
      setTimeout(() => {
        router.push(slug ? `/notes/${slug}` : '/dashboard/seller/notes');
      }, 1200);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xl space-y-8">
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          {newNoteSlug && (
            <a
              href={`/notes/${newNoteSlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-900 ml-7"
            >
              <span>View Your Live Note Page</span> <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* SECTION 1: PDF FILE UPLOAD */}
      <div className="space-y-3">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> 1. Upload Handwritten PDF File *
        </h3>
        <p className="text-xs text-slate-500">
          Upload clear, legible handwritten PDF notes. Maximum allowed file size: {settings.max_pdf_size_mb} MB (2GB).
        </p>

        <div className="relative border-2 border-dashed border-indigo-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            required
          />

          {selectedFile ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedFile.name}</p>
              <span className="text-xs font-mono text-slate-500">{formatFileSize(selectedFile.size)}</span>
              <p className="text-[11px] text-indigo-600 font-semibold">Click to change file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Drag &amp; drop your PDF here, or <span className="text-indigo-600 hover:underline">browse</span>
              </p>
              <p className="text-xs text-slate-400">PDF documents only</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: BASIC INFORMATION */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">2. Note Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Note Title *</label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. B.A. English Romantic Poetry Notes or Class 10 Science Chapterwise Summary"
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 1. EDUCATION LEVEL SELECTOR */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Select Education Level *
              </label>
              <span className="text-[11px] text-slate-400">Class 10, 11, 12, Graduation (UG) or Post Graduation (PG)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {EDUCATION_LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => handleLevelChange(lvl.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-100 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-200'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-black tracking-wider text-indigo-600 dark:text-indigo-400">
                      {lvl.badge}
                    </span>
                    <span className="text-xs font-bold mt-1 line-clamp-1">
                      {lvl.name.split(' (')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. COURSE / DEGREE SELECTOR */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Course / Degree / Stream *
            </label>
            <select
              value={selectedCourseOption}
              onChange={(e) => handleCourseChange(e.target.value)}
              required
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-hidden"
            >
              {availableCourses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
              <option value="custom">✏️ + Type Custom Course / Degree...</option>
            </select>
          </div>

          {/* 3. SEMESTER / EXAM PHASE SELECTOR */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Semester / Exam Phase *
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              required
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden"
            >
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {/* CUSTOM COURSE INPUT (IF SELECTED) */}
          {selectedCourseOption === 'custom' && (
            <div className="md:col-span-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Type Custom Course Name *
              </label>
              <input
                type="text"
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                required={selectedCourseOption === 'custom'}
                placeholder="e.g. B.Sc. Statistics / M.A. Public Administration"
                className="w-full py-2.5 px-3.5 rounded-xl border-2 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 text-sm font-bold focus:outline-hidden"
              />
            </div>
          )}

          {/* 4. DYNAMIC SUBJECT SELECTOR */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Subject / Paper Name *
            </label>
            <select
              value={selectedSubjectOption}
              onChange={(e) => setSelectedSubjectOption(e.target.value)}
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-hidden"
            >
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
              <option value="custom">✏️ + Type Custom Subject Name...</option>
            </select>
          </div>

          {/* 5. CATEGORY SELECTOR */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Domain Category / Marketplace Section *</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-hidden"
            >
              <option value="">Select Domain Category</option>
              <optgroup label="Complete English Literature & Language 📚">
                {categories.filter(c => c.slug === 'english-complete').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="School Boards (Class 10th, 11th, 12th) 🎒">
                {categories.filter(c => c.slug.startsWith('class-')).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Graduation / Undergraduate Degrees (UG) 🎓">
                {categories.filter(c => ['ba-arts-humanities', 'bsc-science-biotech', 'bcom-commerce-finance', 'bca-computer-applications', 'bba-business-management', 'computer-science', 'information-technology', 'mechanical-engineering', 'civil-engineering', 'electrical-engineering', 'electronics-comm'].includes(c.slug)).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Post Graduation & Masters (PG) 🏛️">
                {categories.filter(c => ['ma-masters-arts', 'msc-masters-science', 'mcom-masters-commerce', 'mba-management', 'law-llb-llm', 'education-bed-med'].includes(c.slug)).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Government & Competitive Exams 🏛️">
                {categories.filter(c => c.id.startsWith('cat-gov')).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <option value="custom">✏️ + Type Custom Category Name...</option>
            </select>
          </div>

          {/* CUSTOM SUBJECT INPUT FIELD */}
          {selectedSubjectOption === 'custom' && (
            <div className="md:col-span-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Type Custom Subject Name *
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                required={selectedSubjectOption === 'custom'}
                placeholder="e.g. Modernist Poetry / Molecular Genetics / Financial Derivatives"
                className="w-full py-2.5 px-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 text-sm font-bold focus:outline-hidden"
              />
            </div>
          )}

          {/* CUSTOM CATEGORY INPUT FIELD */}
          {selectedCategory === 'custom' && (
            <div className="md:col-span-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Type Custom Category Name *
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required={selectedCategory === 'custom'}
                placeholder="e.g. Paramedical / Classical Sanskrit Literature"
                className="w-full py-2.5 px-3.5 rounded-xl border-2 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 text-sm font-bold focus:outline-hidden"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">University / Board / College *</label>
            <input
              type="text"
              name="university"
              required
              placeholder={
                selectedLevel === 'school-10' || selectedLevel === 'school-11' || selectedLevel === 'school-12'
                  ? 'e.g. CBSE / ICSE / UP Board / Maharashtra State Board'
                  : 'e.g. Delhi University / IIT Bombay / BHU / JNU / Pune University'
              }
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Page Count *</label>
            <input
              type="number"
              name="page_count"
              min="1"
              defaultValue="45"
              required
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Detailed Description *</label>
            <textarea
              name="description"
              rows={4}
              required
              placeholder="Describe covered chapters, diagrams, solved PYQs, formulas, and syllabus highlights..."
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tags (Comma separated)</label>
            <input
              type="text"
              name="tags"
              placeholder="e.g. UPSC, Polity, Laxmikanth, DSA, IIT Bombay, GATE"
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: PRICING & COMMISSION CALCULATOR */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-500" /> 3. Pricing &amp; Earnings Calculator
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setIsFree(true)}
            className={`p-4 rounded-2xl border text-left font-bold transition-all ${
              isFree
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="text-base font-extrabold">Offer For FREE</div>
            <p className="text-xs font-normal text-slate-500 mt-1">Help fellow students for free &amp; gain high download karma</p>
          </button>

          <button
            type="button"
            onClick={() => setIsFree(false)}
            className={`p-4 rounded-2xl border text-left font-bold transition-all ${
              !isFree
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 ring-2 ring-indigo-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="text-base font-extrabold">Set Paid Price (₹)</div>
            <p className="text-xs font-normal text-slate-500 mt-1">Earn money whenever students purchase your notes</p>
          </button>
        </div>

        {!isFree && (
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Set Price (₹)</label>
              <input
                type="number"
                min={settings.min_note_price}
                max={settings.max_note_price}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-base focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Set Price</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">₹{price}</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Platform Fee ({settings.platform_commission}%)</span>
                <span className="text-sm font-bold text-amber-600">₹{platformFee}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block uppercase">Your Net Earning</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{sellerEarning}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: COPYRIGHT & READ-ONLY PLATFORM POLICY */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <label className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 cursor-pointer">
          <input
            type="checkbox"
            name="terms_agreed"
            value="true"
            required
            className="mt-1 w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
            <strong className="font-extrabold">Copyright &amp; In-Platform Read Protection:</strong> I confirm that these handwritten notes were created/authored by me. I agree that notes will be protected inside NoteMart&apos;s Secure In-Browser Reader to prevent unauthorized raw file sharing.
          </span>
        </label>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-base shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Note Live Now'}
      </button>
    </form>
  );
}

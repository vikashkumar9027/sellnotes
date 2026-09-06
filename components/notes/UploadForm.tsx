'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Calculator, Plus, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { Category } from '@/types';
import { uploadNoteAction } from '@/actions/notes';
import { formatFileSize } from '@/lib/utils';
import { store } from '@/lib/store';

interface UploadFormProps {
  categories: Category[];
  sellerId?: string;
}

export default function UploadForm({ categories, sellerId = 'user-seller-1' }: UploadFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState(49);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const [selectedSubjectOption, setSelectedSubjectOption] = useState('Data Structures');
  const [customSubject, setCustomSubject] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newNoteSlug, setNewNoteSlug] = useState('');

  const settings = store.getSettings();
  const platformFee = isFree ? 0 : Math.round((price * settings.platform_commission) / 100);
  const sellerEarning = isFree ? 0 : price - platformFee;

  const popularSubjects = [
    'Data Structures & Algorithms',
    'Operating Systems',
    'Database Management Systems (DBMS)',
    'Computer Networks',
    'Software Engineering',
    'Thermodynamics',
    'Fluid Mechanics',
    'Structural Analysis',
    'Circuit Theory',
    'Digital Electronics',
    'Engineering Mathematics',
    'Organic Chemistry',
    'Financial Accounting',
    'Indian Polity & Constitution',
    'Quantitative Aptitude',
  ];

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
    formData.append('subject', finalSubject);

    if (selectedCategory === 'custom') {
      formData.append('custom_category_name', customCategory.trim());
      formData.append('category_id', '');
    } else {
      formData.append('category_id', selectedCategory);
      formData.append('custom_category_name', '');
    }

    const res = await uploadNoteAction(formData, sellerId);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      const slug = res.note?.slug || '';
      setNewNoteSlug(slug);
      setSuccessMsg('🎉 Note published live! Your note is now visible on the main marketplace and in your seller dashboard.');
      setTimeout(() => {
        router.push(slug ? `/notes/${slug}` : '/dashboard/seller/notes');
      }, 1500);
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
              placeholder="e.g. Data Structures Complete Master Class Notes or UPSC Polity Mind Maps"
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* CATEGORY SELECTOR & CUSTOM WRITE-IN OPTION */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Domain Category / Exam *</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-hidden"
            >
              <option value="">Select Category or Government Exam</option>
              <optgroup label="Academic & Engineering Streams">
                {categories.filter(c => !c.id.startsWith('cat-gov')).map((c) => (
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

          {/* CUSTOM CATEGORY INPUT FIELD */}
          {selectedCategory === 'custom' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Type Custom Category Name *
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required={selectedCategory === 'custom'}
                placeholder="e.g. Aeronautical Engineering / SSC Stenographer"
                className="w-full py-2.5 px-3.5 rounded-xl border-2 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 text-sm font-bold focus:outline-hidden"
              />
            </div>
          )}

          {/* SUBJECT SELECTOR & CUSTOM SUBJECT WRITE-IN OPTION */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject Name *</label>
            <select
              value={selectedSubjectOption}
              onChange={(e) => setSelectedSubjectOption(e.target.value)}
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-hidden"
            >
              {popularSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
              <option value="custom">✏️ + Type Custom Subject Name...</option>
            </select>
          </div>

          {/* CUSTOM SUBJECT INPUT FIELD */}
          {selectedSubjectOption === 'custom' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Type Custom Subject Name *
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                required={selectedSubjectOption === 'custom'}
                placeholder="e.g. Quantum Computing / Modern Indian History"
                className="w-full py-2.5 px-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 text-sm font-bold focus:outline-hidden"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">University / College / Exam Body *</label>
            <input
              type="text"
              name="university"
              required
              placeholder="e.g. IIT Bombay / Anna University / UPSC"
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Course / Degree / Exam Name *</label>
            <input
              type="text"
              name="course"
              required
              placeholder="e.g. B.Tech Computer Science / Civil Services"
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Semester / Exam Phase *</label>
            <select
              name="semester"
              required
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden"
            >
              {['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester', 'Competitive Exam'].map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
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

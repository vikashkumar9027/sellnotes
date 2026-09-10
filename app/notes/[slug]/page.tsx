'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import PdfPreviewer from '@/components/notes/PdfPreviewer';
import PurchaseButton from '@/components/notes/PurchaseButton';
import { formatPrice, formatFileSize, formatDate } from '@/lib/utils';
import { Star, Download, Eye, GraduationCap, ShieldCheck, Heart, Flag, Share2, BookOpen, User, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { addReviewAction, reportNoteAction } from '@/actions/notes';
import { useAuth } from '@/context/AuthContext';

export default function NoteDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const currentUserId = user?.id || '';
  const note = store.getNoteBySlug(slug);

  const [isWishlisted, setIsWishlisted] = useState(() => (note && currentUserId) ? store.isInWishlist(currentUserId, note.id) : false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('copyright_violation');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Note Not Found</h2>
        <p className="text-slate-500 text-sm">The study note you are looking for does not exist or has been removed.</p>
        <Link href="/notes" className="inline-block py-2.5 px-6 rounded-xl bg-indigo-600 text-white font-bold text-sm">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const hasAccess = store.hasUserPurchased(currentUserId, note.id);
  const reviews = store.getReviewsByNote(note.id);

  const handleWishlistToggle = () => {
    const newState = store.toggleWishlist(currentUserId, note.id);
    setIsWishlisted(newState);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc.trim()) return;
    await reportNoteAction(currentUserId, note.id, reportReason, reportDesc);
    setReportSubmitted(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSubmitted(false);
    }, 1500);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    setReviewSubmitting(true);
    await addReviewAction(currentUserId, note.id, reviewRating, reviewText);
    setReviewSubmitting(false);
    setReviewText('');
    alert('Thank you! Your review has been published.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-indigo-600">Home</Link>
        <span>/</span>
        <Link href="/notes" className="hover:text-indigo-600">Marketplace</Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white truncate max-w-xs">{note.title}</span>
      </div>

      {/* TOP GRID: DETAILS & PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: PDF PREVIEW (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <PdfPreviewer
            note={note}
            hasAccess={hasAccess}
            onPurchaseClick={() => {
              const el = document.getElementById('purchase-card');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>

        {/* RIGHT COLUMN: METADATA & PURCHASE ACTION (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <div id="purchase-card" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
            {/* BADGES & RATING */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${note.is_free ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                {note.is_free ? 'FREE NOTE' : 'PAID HANDWRITTEN NOTE'}
              </span>

              <div className="flex items-center gap-1.5 text-amber-500 text-sm font-black">
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                <span>{note.average_rating > 0 ? note.average_rating : 'New'}</span>
                <span className="text-slate-400 font-normal text-xs">({reviews.length} reviews)</span>
              </div>
            </div>

            {/* TITLE */}
            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {note.title}
            </h1>

            {/* SUBJECT & UNIVERSITY */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Subject:</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{note.subject}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">University:</span>
                <span className="font-bold text-slate-900 dark:text-white">{note.university}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Course &amp; Sem:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{note.course} ({note.semester})</span>
              </div>
            </div>

            {/* PRICE CONTAINER */}
            <div className="flex items-baseline justify-between pt-2">
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">Access Price</span>
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {formatPrice(note.price, note.is_free)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Page Count</span>
                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{note.page_count} Pages</span>
              </div>
            </div>

            {/* PURCHASE BUTTON / DOWNLOAD */}
            <PurchaseButton note={note} buyerId={currentUserId} />

            {/* AUXILIARY ACTIONS */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                onClick={handleWishlistToggle}
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-rose-500 font-semibold"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{isWishlisted ? 'Wishlisted' : 'Save to Wishlist'}</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 font-semibold"
              >
                <Share2 className="w-4 h-4" /> Share Link
              </button>

              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 font-semibold"
              >
                <Flag className="w-4 h-4" /> Report
              </button>
            </div>

            {/* SELLER CARD */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={note.seller?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={note.seller?.full_name}
                  className="w-10 h-10 rounded-full object-cover border border-indigo-300"
                />
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {note.seller?.full_name || 'Aarav Sharma'}
                  </h4>
                  <p className="text-[11px] text-slate-500">{note.seller?.university || 'IIT Bombay'}</p>
                </div>
              </div>

              <Link
                href={`/sellers/${note.seller_id}`}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION & SPECIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Note Overview &amp; Syllabus</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {note.description}
          </p>

          <div className="space-y-2 pt-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* METADATA SUMMARY */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">File Information</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-500 font-semibold">Language</span>
              <span className="font-bold text-slate-900 dark:text-white">{note.language}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-500 font-semibold">File Size</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatFileSize(note.file_size)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-500 font-semibold">Upload Date</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatDate(note.created_at)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-500 font-semibold">Downloads</span>
              <span className="font-bold text-emerald-600">{note.downloads}</span>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS & RATINGS SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Verified Student Reviews ({reviews.length})
        </h3>

        {/* WRITE REVIEW FORM */}
        {hasAccess && (
          <form onSubmit={handleReviewSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 space-y-3 border">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Leave a Review</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-amber-400"
                  >
                    <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={2}
              required
              placeholder="Share how helpful these notes were for your exam prep..."
              className="w-full p-3 rounded-xl border bg-white dark:bg-slate-900 text-xs focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              Post Review
            </button>
          </form>
        )}

        {/* REVIEW LIST */}
        <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.id} className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {rev.user?.full_name?.substring(0, 2) || 'ST'}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{rev.user?.full_name || 'Verified Buyer'}</span>
                  </div>
                  <div className="flex items-center text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {rev.review}
                </p>
                <span className="text-[10px] text-slate-400 block">{formatDate(rev.created_at)}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No reviews written yet. Be the first student to review!</p>
          )}
        </div>
      </div>

      {/* REPORT MODAL */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 border shadow-2xl">
            <h3 className="font-extrabold text-slate-900 dark:text-white">Report Copyright or Quality Issue</h3>
            {reportSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Report submitted to admin for review.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border text-xs bg-slate-50 font-medium"
                  >
                    <option value="copyright_violation">Copyright Violation / Unauthorized Copy</option>
                    <option value="fake_notes">Fake or Misleading Description</option>
                    <option value="poor_quality">Unreadable / Poor Scan Quality</option>
                    <option value="spam">Spam / Inappropriate Content</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Explanation</label>
                  <textarea
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    required
                    rows={3}
                    placeholder="Provide details so our moderation team can investigate..."
                    className="w-full p-2.5 rounded-xl border text-xs"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="py-2 px-4 rounded-xl text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 text-white"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

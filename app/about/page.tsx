import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Users, Award, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">About NoteMart</h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          &quot;Share Notes. Learn Better. Earn Together.&quot; NoteMart is a student-first peer-to-peer marketplace connecting university toppers and learners across engineering, medical, business, and humanities faculties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white">Student Driven</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Built by students for students. Every note uploaded comes from real semester coursework written by top performers.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white">Watermarked Sample Previews</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our multi-page secure preview system guarantees buyers inspect note legibility before purchasing.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white">Fair Seller Earnings</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sellers keep 90% of all revenues earned from note sales with direct UPI and bank payout options.
          </p>
        </div>
      </div>
    </div>
  );
}

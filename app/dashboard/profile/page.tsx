'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, CheckCircle2, AlertCircle, Loader2, Mail, Phone, GraduationCap, Building, Calendar, Shield } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('1st Semester');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setCollege(user.college || user.university || '');
      setCourse(user.course || '');
      setSemester(user.semester || '1st Semester');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phone.trim(),
          college: college.trim(),
          course: course.trim(),
          semester: semester.trim(),
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to update profile.');
      } else {
        setSuccess('🎉 Profile settings updated successfully in MongoDB!');
        await refreshUser();
      }
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Error updating profile');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Profile Settings</h1>
        <p className="text-xs text-slate-500 font-medium">Manage your verified student account, college, and academic details.</p>
      </div>

      {/* ACCOUNT BADGE SUMMARY */}
      <div className="bg-gradient-to-r from-indigo-50 to-amber-50 dark:from-indigo-950/40 dark:to-slate-900 p-6 rounded-3xl border border-indigo-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{user.full_name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
            {user.role}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Email Verified ✓
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address (Read-only)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 text-sm font-semibold cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mobile Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">College / University Name</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. IIT Bombay / Delhi University"
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Course / Degree</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. B.Tech Computer Science / B.A. English"
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Semester / Phase</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-hidden"
              >
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="3rd Semester">3rd Semester</option>
                <option value="4th Semester">4th Semester</option>
                <option value="5th Semester">5th Semester</option>
                <option value="6th Semester">6th Semester</option>
                <option value="7th Semester">7th Semester</option>
                <option value="8th Semester">8th Semester</option>
                <option value="Annual / Complete">Annual / Complete</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-3 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}


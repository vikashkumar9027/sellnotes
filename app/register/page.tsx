'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Phone,
  Mail,
  User,
  GraduationCap,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  DollarSign,
  Award,
} from 'lucide-react';
import { sendOtpAction, verifyOtpAction } from '@/actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'seller'>('student');
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpValues, setOtpValues] = useState(['1', '2', '3', '4', '5', '6']);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const identifier = phone ? `+91 ${phone}` : email;

  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!phone && !email) {
      setErrorMsg('Please enter your Phone Number or Email address.');
      return;
    }

    setLoading(true);
    const res = await sendOtpAction(identifier);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(`OTP sent to ${identifier}! Use demo OTP: 123456`);
      setStep('otp');
    }
  };

  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const enteredOtp = otpValues.join('');
    setLoading(true);
    const res = await verifyOtpAction(identifier, enteredOtp);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('🎉 Registration & Verification Complete! Welcome to NoteMart.');
      setTimeout(() => {
        router.push(role === 'seller' ? '/dashboard/seller' : '/dashboard');
      }, 1200);
    }
  };

  return (
    <div className="min-h-[90vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: HERO SHOWCASE & SELLER / BUYER BENEFITS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden hidden sm:flex">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">
                <BookOpen className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black text-white">NoteMart</span>
            </Link>

            <div className="space-y-3 pt-4">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider border border-amber-500/30">
                Join Marketplace
              </span>
              <h2 className="text-3xl font-black leading-tight">
                {role === 'seller' ? 'Earn 80% Selling Your Study Notes' : 'Ace Your Exams with Verified Notes'}
              </h2>
              <p className="text-slate-300 text-xs font-medium leading-relaxed">
                Create your account in 30 seconds with instant mobile OTP verification.
              </p>
            </div>

            <div className="space-y-3 pt-4 text-xs font-medium">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Keep 80% Net Earnings + Transparent 18% GST</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Anti-Screenshot Reader &amp; Copyright Rights</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Direct Payouts to UPI &amp; Bank Account</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-[11px] text-slate-400 relative z-10 flex items-center justify-between">
            <span>Instant Registration</span>
            <span>Mobile OTP Authenticated</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: REGISTRATION FORM CARD */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create NoteMart Account</h2>
            <p className="text-xs text-slate-500 font-medium">
              Select your role and enter your details to get started.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleStartRegister} className="space-y-4">
              {/* ROLE SELECTOR CARDS */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    role === 'student'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 ring-2 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-white">
                    <GraduationCap className="w-4 h-4 text-indigo-600" /> Student Account
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Buy &amp; study verified topper notes</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    role === 'seller'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/50 ring-2 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-white">
                    <DollarSign className="w-4 h-4 text-amber-500" /> Topper Seller Account
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Upload notes &amp; earn 90% revenue</p>
                </button>
              </div>

              {/* INPUT FIELDS */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aarav Sharma"
                  required
                  className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">University / College *</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. IIT Bombay / DTU / Delhi University"
                  required
                  className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mobile Phone Number (+91) *</label>
                <div className="flex rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-sm border-r border-slate-200 dark:border-slate-700 flex items-center">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    placeholder="98765 43210"
                    required
                    className="w-full py-3 px-4 bg-white dark:bg-slate-900 text-sm font-black focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Mobile OTP <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION VIEW */
            <form onSubmit={handleVerifyRegisterOtp} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Enter OTP code sent to</span>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{identifier}</p>
              </div>

              {/* 6-BOX OTP INPUT GRID */}
              <div className="flex items-center justify-center gap-2">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={val}
                    onChange={(e) => {
                      const newOtp = [...otpValues];
                      newOtp[idx] = e.target.value;
                      setOtpValues(newOtp);
                    }}
                    className="w-11 h-12 text-center text-xl font-black rounded-xl border-2 border-indigo-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-all shadow-xs"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify OTP &amp; Complete Signup</>}
              </button>
            </form>
          )}

          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">
              Log in to NoteMart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

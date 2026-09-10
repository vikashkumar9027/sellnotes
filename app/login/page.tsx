'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import { sendOtpAction, verifyOtpAction } from '@/actions/auth';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('email');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const identifier = loginMethod === 'phone' ? `+91 ${phone}` : email.trim().toLowerCase();

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (loginMethod === 'phone' && (!phone || phone.length < 10)) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (loginMethod === 'email' && (!email || !email.includes('@'))) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const res = await sendOtpAction(identifier);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(res.message || `Verification code sent to ${identifier}! Valid for 5 minutes.`);
      setStep('otp');
      setTimer(60);
    }
  };

  const handleOtpInputChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const enteredOtp = otpValues.join('');
    if (enteredOtp.length < 6) {
      setErrorMsg('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    const res = await verifyOtpAction(identifier, enteredOtp);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      if (res.user) {
        setUser(res.user);
      }
      setSuccessMsg('🎉 Email verified successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push(res.user?.role === 'seller' ? '/dashboard/seller' : '/dashboard');
      }, 1000);
    }
  };

  return (
    <div className="min-h-[90vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: HERO SHOWCASE & PLATFORM TRUST */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden hidden sm:flex">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center font-black shadow-lg">
                <BookOpen className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black text-white">NoteMart</span>
            </Link>

            <div className="space-y-3 pt-4">
              <span className="px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
                Verification Portal
              </span>
              <h2 className="text-3xl font-black leading-tight">
                Unlock Verified Topper Notes Instantly
              </h2>
              <p className="text-indigo-100 text-xs font-medium leading-relaxed">
                Log in to access your purchased handwritten notes, track seller earnings, or explore government exam modules.
              </p>
            </div>

            <div className="space-y-3 pt-4 text-xs font-medium">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Anti-Screenshot DRM Reader Protection</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Transparent 18% GST &amp; 90% Seller Payouts</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                <GraduationCap className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Trusted by 15,000+ University Students</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-[11px] text-indigo-200 relative z-10 flex items-center justify-between">
            <span>256-Bit SSL Encrypted</span>
            <span>Mobile OTP Instant Login</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: AUTHENTICATION FORM CARD */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Welcome Back to NoteMart</h2>
            <p className="text-xs text-slate-500 font-medium">
              Log in with your Mobile Phone Number (+91) or Registered Email address.
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

          {step === 'input' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {/* TOGGLE METHOD: PHONE OR EMAIL */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={`py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    loginMethod === 'phone'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Phone className="w-4 h-4" /> Mobile OTP (+91)
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    loginMethod === 'email'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" /> Email Login
                </button>
              </div>

              {/* INPUT FIELDS */}
              {loginMethod === 'phone' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mobile Phone Number *</label>
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
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    required
                    className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send 6-Digit OTP Code <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION VIEW */
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Enter 6-digit OTP code sent to</span>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{identifier}</p>
              </div>

              {/* 6-BOX OTP INPUT GRID */}
              <div className="flex items-center justify-center gap-2">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpInputChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-xl font-black rounded-xl border-2 border-indigo-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-all shadow-xs"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify OTP &amp; Login</>}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="hover:underline text-indigo-600 font-bold"
                >
                  Change Number/Email
                </button>

                {timer > 0 ? (
                  <span>Resend OTP in <strong className="text-slate-900 dark:text-white font-mono">{timer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">
              Register as Student / Topper Seller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

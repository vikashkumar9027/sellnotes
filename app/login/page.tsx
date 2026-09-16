'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '';
  const { setUser } = useAuth();

  // Mode: 'password' (default) or 'otp'
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');

  // Password fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP fields
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 60-second OTP cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpStep === 'verify' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, timer]);

  // Handle standard Email + Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Login failed. Please check your email and password.');
      } else {
        if (data.user) {
          setUser({
            id: data.user.id || data.user._id,
            full_name: data.user.name,
            email: data.user.email,
            phone: data.user.phone || '',
            college: data.user.college || '',
            university: data.user.college || '',
            course: data.user.course || '',
            semester: data.user.semester || '',
            role: data.user.role || 'student',
            avatar_url: data.user.profileImage || '',
            created_at: data.user.createdAt || new Date().toISOString(),
            updated_at: data.user.updatedAt || new Date().toISOString(),
          });
        }
        setSuccessMsg(data.message || '🎉 Login successful! Redirecting...');
        const targetUrl = redirect || (data.user?.role === 'seller' ? '/dashboard/seller' : '/dashboard');
        setTimeout(() => {
          router.push(targetUrl);
        }, 800);
      }
    } catch (err: unknown) {
      setLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Network error. Please try again.');
    }
  };

  // Handle Sending Real Email OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address to receive your login code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', email: cleanEmail }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to send OTP code.');
      } else {
        setSuccessMsg(data.message || `A 6-digit verification code has been sent to ${cleanEmail}.`);
        setOtpStep('verify');
        setTimer(60);
      }
    } catch (err: unknown) {
      setLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send OTP.');
    }
  };

  // Handle 6-digit OTP Box Input
  const handleOtpInputChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle Verifying OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const enteredOtp = otpValues.join('');
    if (enteredOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', email: cleanEmail, otp: enteredOtp }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Invalid verification code.');
      } else {
        if (data.user) {
          setUser({
            id: data.user.id || data.user._id,
            full_name: data.user.name,
            email: data.user.email,
            phone: data.user.phone || '',
            college: data.user.college || '',
            university: data.user.college || '',
            course: data.user.course || '',
            semester: data.user.semester || '',
            role: data.user.role || 'student',
            avatar_url: data.user.profileImage || '',
            created_at: data.user.createdAt || new Date().toISOString(),
            updated_at: data.user.updatedAt || new Date().toISOString(),
          });
        }
        setSuccessMsg(data.message || '🎉 Email verified! Redirecting to dashboard...');
        const targetUrl = redirect || (data.user?.role === 'seller' ? '/dashboard/seller' : '/dashboard');
        setTimeout(() => {
          router.push(targetUrl);
        }, 800);
      }
    } catch (err: unknown) {
      setLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed.');
    }
  };

  const registerHref = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register';

  return (
    <div className="min-h-[90vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: HERO SHOWCASE */}
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
                Secure Student Portal
              </span>
              <h2 className="text-3xl font-black leading-tight">
                Unlock Verified Study Notes &amp; Seller Earnings
              </h2>
              <p className="text-indigo-100 text-xs font-medium leading-relaxed">
                Log in to view your purchased handwritten notes, upload your course materials, or withdraw seller earnings.
              </p>
            </div>

            <div className="space-y-3 pt-4 text-xs font-medium">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>256-Bit SSL Encrypted JWT Session</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Keep 90% Earnings on Every Note Sold</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                <GraduationCap className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Trusted by 15,000+ University Students</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-[11px] text-indigo-200 relative z-10 flex items-center justify-between">
            <span>Bcrypt Hashed Security</span>
            <span>Real Email OTP Option</span>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Welcome Back to NoteMart</h2>
            <p className="text-xs text-slate-500 font-medium">
              {redirect.includes('upload')
                ? 'Please log in to publish and sell your handwritten notes.'
                : 'Sign in to access your library, purchases, and seller dashboard.'}
            </p>
          </div>

          {/* METHOD TOGGLE: PASSWORD VS EMAIL OTP */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMode === 'password'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" /> Password Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setOtpStep('request');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMode === 'otp'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" /> Email OTP Login
            </button>
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

          {/* 1. PASSWORD LOGIN FORM */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    required
                    className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('otp');
                      setOtpStep('request');
                    }}
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    Forgot password? Use OTP
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Log In to Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* 2. EMAIL OTP LOGIN FORM */}
          {authMode === 'otp' && (
            <>
              {otpStep === 'request' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@university.edu"
                      required
                      className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500">
                      We will send a real 6-digit verification code to your email inbox (valid for 5 minutes).
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send 6-Digit Login Code <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              ) : (
                /* OTP VERIFICATION STEP */
                <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-center space-y-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">Enter 6-digit OTP sent to</span>
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{email.trim().toLowerCase()}</p>
                    <span className="text-[11px] text-slate-400 block">Check your inbox and spam folder.</span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        id={`login-otp-${idx}`}
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
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Code &amp; Log In</>}
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      className="hover:underline text-indigo-600 font-bold"
                    >
                      Change Email
                    </button>

                    {timer > 0 ? (
                      <span>Resend code in <strong className="text-slate-900 dark:text-white font-mono">{timer}s</strong></span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Resend Code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}

          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href={registerHref} className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">
              Register as Student / Topper Seller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[90vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}


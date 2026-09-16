'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Mail,
  User,
  GraduationCap,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  DollarSign,
  Award,
  Lock,
  Eye,
  EyeOff,
  Building,
  BookMarked,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '';
  const { setUser } = useAuth();

  // Registration form fields
  const [role, setRole] = useState<'student' | 'seller'>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [course, setCourse] = useState('');
  const [college, setCollege] = useState('');
  const [semester, setSemester] = useState('1st Semester');
  const [phone, setPhone] = useState('');

  // OTP step
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 60-second cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const cleanEmail = email.trim().toLowerCase();

  // STEP 1: SEND REAL EMAIL OTP FOR REGISTRATION
  const handleStartRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-check.');
      return;
    }
    if (!course.trim()) {
      setErrorMsg('Please enter your course / degree (e.g. B.Tech, B.A., Class 12).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-otp',
          name: fullName.trim(),
          email: cleanEmail,
          password,
          confirmPassword,
          phone: phone.trim(),
          college: college.trim(),
          course: course.trim(),
          semester,
          role,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to dispatch verification code.');
      } else {
        setSuccessMsg(data.message || `A 6-digit verification code has been sent to ${cleanEmail}.`);
        setStep('otp');
        setTimer(60);
      }
    } catch (err: unknown) {
      setLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Registration error. Please try again.');
    }
  };

  // STEP 2: VERIFY REAL OTP AND CREATE MONGODB ACCOUNT
  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const enteredOtp = otpValues.join('');
    if (enteredOtp.length < 6) {
      setErrorMsg('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: enteredOtp,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'OTP verification failed. Please try again.');
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
        setSuccessMsg('🎉 Account created & email verified successfully! Welcome to NoteMart.');

        // Target redirect destination
        const targetUrl = redirect || (role === 'seller' ? '/dashboard/seller/upload' : '/dashboard');
        setTimeout(() => {
          router.push(targetUrl);
        }, 1000);
      }
    } catch (err: unknown) {
      setLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to verify account.');
    }
  };

  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';

  return (
    <div className="min-h-[90vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: HERO SHOWCASE */}
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
                {role === 'seller' ? 'Earn 90% Selling Your Study Notes' : 'Ace Your Exams with Verified Notes'}
              </h2>
              <p className="text-slate-300 text-xs font-medium leading-relaxed">
                Create your verified student account in 30 seconds with real-time email OTP verification.
              </p>
            </div>

            <div className="space-y-3 pt-4 text-xs font-medium">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Keep 90% Net Earnings + Transparent 18% GST</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Anti-Screenshot DRM Reader Protection</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Direct Payouts to UPI &amp; Bank Account</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-[11px] text-slate-400 relative z-10 flex items-center justify-between">
            <span>Instant Registration</span>
            <span>Real Email OTP Verification</span>
          </div>
        </div>

        {/* RIGHT COLUMN: REGISTRATION FORM */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create NoteMart Account</h2>
            <p className="text-xs text-slate-500 font-medium">
              {redirect.includes('upload')
                ? 'Register now to publish and sell your handwritten notes.'
                : 'Select your role and enter your details to get started.'}
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
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    role === 'student'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 ring-2 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-white">
                    <GraduationCap className="w-4 h-4 text-indigo-600" /> Student Account
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Buy &amp; study verified topper notes</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    role === 'seller'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/50 ring-2 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-white">
                    <DollarSign className="w-4 h-4 text-amber-500" /> Seller Account
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Upload notes &amp; earn 90% revenue</p>
                </button>
              </div>

              {/* FULL NAME */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aarav Sharma"
                    required
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* EMAIL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address (For Real Verification Code) *</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    required
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* PASSWORD & CONFIRM PASSWORD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password (Min 6 chars) *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* COURSE & SEMESTER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Course / Degree *</label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. B.Tech / B.A. / MBBS / Class 12"
                    required
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Semester / Year</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-hidden"
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

              {/* UNIVERSITY & PHONE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">University / College</label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. IIT Bombay / DTU / Delhi University"
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mobile Phone (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    placeholder="98765 43210"
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send 6-Digit Email Code <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION VIEW */
            <form onSubmit={handleVerifyRegisterOtp} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Enter 6-digit OTP code sent to</span>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{cleanEmail}</p>
                <span className="text-[11px] text-slate-400 block">Valid for 5 minutes. Check inbox and spam folder.</span>
              </div>

              {/* 6-BOX OTP INPUT GRID */}
              <div className="flex items-center justify-center gap-2">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => {
                      const valClean = e.target.value.slice(-1);
                      const newOtp = [...otpValues];
                      newOtp[idx] = valClean;
                      setOtpValues(newOtp);
                      if (valClean && idx < 5) {
                        const nextEl = document.getElementById(`reg-otp-${idx + 1}`);
                        if (nextEl) nextEl.focus();
                      }
                    }}
                    id={`reg-otp-${idx}`}
                    className="w-11 h-12 text-center text-xl font-black rounded-xl border-2 border-indigo-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-all shadow-xs"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Code &amp; Complete Registration</>}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="hover:underline text-indigo-600 font-bold"
                >
                  Edit Registration Details
                </button>

                {timer > 0 ? (
                  <span>Resend code in <strong className="text-slate-900 dark:text-white font-mono">{timer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartRegister()}
                    className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend Code
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            Already have an account?{' '}
            <Link href={loginHref} className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">
              Log in to NoteMart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[90vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}


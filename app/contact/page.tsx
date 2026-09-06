'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Contact NoteMart Support</h1>
        <p className="text-xs text-slate-500 font-medium">Have questions regarding note uploads, Razorpay payments, or copyright claims?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border p-6 space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white">Send Us a Message</h3>
          {submitted ? (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Thank you! Our support team will reply within 24 hours.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" required placeholder="Your Full Name" className="w-full p-2.5 rounded-xl border text-xs" />
              <input type="email" required placeholder="Your Email Address" className="w-full p-2.5 rounded-xl border text-xs" />
              <textarea required rows={4} placeholder="Describe your query..." className="w-full p-2.5 rounded-xl border text-xs" />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white">Direct Channels</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>support@notemart.edu</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>+91 (022) 4890-3342</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>NoteMart Technologies Pvt Ltd, Tech Park Campus, Powai, Mumbai 400076</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { BookOpen, Github, Twitter, Instagram, Linkedin, Mail, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* BRAND COLUMN */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-amber-400 flex items-center justify-center text-white font-bold shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">NoteMart</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              &quot;Share Notes. Learn Better. Earn Together.&quot;
              The ultimate marketplace designed specifically for university students to trade, preview, and download top-rated handwritten study notes.
            </p>
            <div className="flex items-center gap-4 text-slate-400 pt-2">
              <a href="#" className="p-2 rounded-lg bg-slate-900 hover:text-indigo-400 hover:bg-slate-800 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-900 hover:text-indigo-400 hover:bg-slate-800 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-900 hover:text-indigo-400 hover:bg-slate-800 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-900 hover:text-indigo-400 hover:bg-slate-800 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* MARKETPLACE LINKS */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/notes" className="hover:text-indigo-400 transition-colors">All Handwritten Notes</Link></li>
              <li><Link href="/categories" className="hover:text-indigo-400 transition-colors">Browse Categories</Link></li>
              <li><Link href="/notes?type=free" className="hover:text-indigo-400 transition-colors">Free Study Material</Link></li>
              <li><Link href="/dashboard/seller/upload" className="hover:text-indigo-400 transition-colors">Sell Notes</Link></li>
              <li><Link href="/notes?sortBy=popular" className="hover:text-indigo-400 transition-colors">Top Downloaded Notes</Link></li>
            </ul>
          </div>

          {/* COMPANY & COMMUNITY */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-indigo-400 transition-colors">About NoteMart</Link></li>
              <li><Link href="/contact" className="hover:text-indigo-400 transition-colors">Contact Support</Link></li>
              <li><Link href="/terms" className="hover:text-indigo-400 transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/copyright-policy" className="hover:text-indigo-400 transition-colors">Copyright Policy</Link></li>
            </ul>
          </div>

          {/* SUPPORT */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Help &amp; Trust</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Refund Policy</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Seller Verification</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Anti-Piracy Guidelines</a></li>
              <li className="pt-2 text-xs text-slate-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> support@notemart.edu
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 NoteMart. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for students across universities.
          </p>
        </div>
      </div>
    </footer>
  );
}

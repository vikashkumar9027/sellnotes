'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  ArrowDownToLine,
  Receipt,
  Settings,
  ScrollText,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { superAdminLogoutAction } from '@/actions/super-admin';

const navItems = [
  { label: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/super-admin/users', icon: Users },
  { label: 'Sellers & KYC', href: '/super-admin/sellers', icon: Briefcase },
  { label: 'Notes Moderation', href: '/super-admin/notes', icon: FileText },
  { label: 'Orders & Payments', href: '/super-admin/orders', icon: CreditCard },
  { label: 'Withdrawal Payouts', href: '/super-admin/withdrawals', icon: ArrowDownToLine },
  { label: 'Wallet Ledger', href: '/super-admin/ledger', icon: Receipt },
  { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: ScrollText },
  { label: 'Platform Settings', href: '/super-admin/settings', icon: Settings },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Do not show admin chrome on login page
  if (pathname === '/super-admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await superAdminLogoutAction();
    router.push('/super-admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* MOBILE TOP BAR */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wide text-white">Super Admin</h1>
            <p className="text-[10px] text-rose-400 font-bold uppercase">NoteMart Central</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* SIDEBAR NAVIGATION (DESKTOP & MOBILE DRAWER) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between z-40 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo / Title */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Super Admin</h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/80">
                Authorized Central
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/super-admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          >
            <span>View Public Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-950/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* BACKDROP FOR MOBILE */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

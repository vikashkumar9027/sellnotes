'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Heart, Bell, PlusCircle, Search, Menu, X, Shield, ShoppingBag, LayoutDashboard, LogOut } from 'lucide-react';
import { store } from '@/lib/store';

export default function Navbar() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [activeUser, setActiveUser] = useState(() => store.getUsers()[2]); // Default demo student

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const notifications = isMounted ? store.getNotificationsByUser(activeUser.id) : [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const wishlistItems = isMounted ? store.getWishlistByUser(activeUser.id) : [];

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Browse Notes', href: '/notes' },
    { name: 'Categories', href: '/categories' },
    { name: 'Sell Notes', href: '/dashboard/seller/upload', highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-800 dark:from-indigo-400 dark:to-indigo-200 bg-clip-text text-transparent">
                NoteMart
              </span>
              <span className="hidden sm:block text-[10px] font-semibold text-amber-600 dark:text-amber-400 -mt-1 tracking-wider uppercase">
                Student Notes Market
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              if (link.highlight) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm shadow-xs transition-all duration-200 hover:shadow-md"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <Link
              href="/notes"
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Search Notes"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Wishlist */}
            <Link
              href="/dashboard/wishlist"
              className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {isMounted && wishlistItems.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <div className="relative">
              <Link
                href="/dashboard"
                className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors block"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {isMounted && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Role Switcher for Demo */}
            <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              <button
                onClick={() => setActiveUser(store.getUsers()[2])}
                className={`px-2 py-1 rounded-md transition-all ${
                  activeUser.role === 'student' ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 font-bold' : ''
                }`}
              >
                Student
              </button>
              <button
                onClick={() => setActiveUser(store.getUsers()[0])}
                className={`px-2 py-1 rounded-md transition-all ${
                  activeUser.role === 'seller' ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 font-bold' : ''
                }`}
              >
                Seller
              </button>
              <button
                onClick={() => setActiveUser(store.getUsers()[3])}
                className={`px-2 py-1 rounded-md transition-all ${
                  activeUser.role === 'admin' ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 font-bold' : ''
                }`}
              >
                Admin
              </button>
            </div>

            {/* USER PROFILE DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden"
              >
                <img
                  src={activeUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={activeUser.full_name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500"
                />
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{activeUser.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{activeUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {activeUser.role}
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                    Buyer Dashboard
                  </Link>

                  <Link
                    href="/dashboard/purchases"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                    My Purchases
                  </Link>

                  <Link
                    href="/dashboard/seller"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-500" />
                    Seller Dashboard
                  </Link>

                  {activeUser.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    >
                      <Shield className="w-4 h-4 text-rose-500" />
                      Admin Panel
                    </Link>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                    <Link
                      href="/login"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* MOBILE MENU TOGGLE */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                pathname === link.href
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

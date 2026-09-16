'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, BookOpen } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'seller' | 'admin')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login preserving intended target URL
        const redirectParam = encodeURIComponent(pathname || '/dashboard');
        router.replace(`/login?redirect=${redirectParam}`);
      } else if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role as 'student' | 'seller' | 'admin')) {
        // Redirect if role is not permitted
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router, pathname, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
          <BookOpen className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Verifying secure student session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

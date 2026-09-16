import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export const metadata = {
  title: 'Dashboard - NoteMart',
  description: 'Manage your study notes, purchases, earnings, and account profile.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

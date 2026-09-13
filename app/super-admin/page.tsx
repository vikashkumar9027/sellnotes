import { redirect } from 'next/navigation';
import { verifySuperAdminSession } from '@/lib/super-admin-auth';

export default async function SuperAdminRootPage() {
  const session = await verifySuperAdminSession();
  if (session.authenticated) {
    redirect('/super-admin/dashboard');
  } else {
    redirect('/super-admin/login');
  }
}

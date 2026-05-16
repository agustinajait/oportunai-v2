export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import EmpresaDashboardClient from './EmpresaDashboardClient';

export default async function EmpresaDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'empleador') {
    redirect('/login');
  }
  return <EmpresaDashboardClient />;
}
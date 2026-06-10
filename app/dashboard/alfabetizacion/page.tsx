export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AlfaPage from './AlfaPage';

export default async function AlfabetizacionPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return <AlfaPage />;
}

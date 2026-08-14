export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import GobiernoClient from './GobiernoClient';

export default async function GobiernoDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar session={{ nombre: session.nombre, role: session.role, slug: '' }} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-light text-ink-900">
            Dashboard de <span className="font-semibold italic">gobierno</span>
          </h1>
          <p className="text-ink-400 mt-1 text-sm">
            Semáforo de bienestar agregado · Korai × OportunAI
          </p>
        </div>
        <GobiernoClient />
      </main>
    </div>
  );
}

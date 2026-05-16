export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/dashboard');

  const [usuarios, config] = await Promise.all([
    prisma.usuario.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true, nombre_completo: true, email: true,
        dni: true, role: true, slug: true, created_at: true,
        _count: { select: { videos: true, archivos: true } },
      },
    }),
    prisma.configuracionVideo.findMany({
      orderBy: [{ tipo_video: 'asc' }, { orden: 'asc' }],
    }),
  ]);

  return <AdminClient usuarios={usuarios as any} config={config as any} session={session} />;
}

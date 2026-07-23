export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import FlyerClient from './FlyerClient';

export default async function FlyerPage() {
  const session = await getSession();
  if (!session || session.role === 'empleador') redirect('/login');

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      nombre_completo: true,
      telefono: true,
      bio: true,
      foto_url: true,
      slug: true,
      alfa_digital: true,
      alfa_score: true,
      cv_datos: true,
      videos: {
        where: { tipo: 'video_cv', es_fragmento: false },
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { video_url: true },
      },
    },
  });

  if (!usuario) redirect('/login');

  return <FlyerClient usuario={usuario as any} />;
}

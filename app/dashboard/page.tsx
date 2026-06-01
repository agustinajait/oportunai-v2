export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [usuario, tallersAsignados] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        nombre_completo: true,
        email: true,
        telefono: true,
        bio: true,
        slug: true,
        role: true,
        cv_datos: true,
        created_at: true,
        videos: {
          where: { es_fragmento: false },
          orderBy: { created_at: 'desc' },
          include: { taller: { select: { id: true, nombre: true } } },
        },
        archivos: { orderBy: { created_at: 'desc' } },
      },
    }),
    prisma.tallerUsuario.findMany({
      where: { usuario_id: session.userId },
      include: {
        taller: {
          include: {
            modulos: { orderBy: [{ tipo_video: 'asc' }, { orden: 'asc' }] },
          },
        },
      },
      orderBy: { asignado_en: 'desc' },
    }),
  ]);

  if (!usuario) redirect('/login');

  return <DashboardClient usuario={usuario as any} tallersAsignados={tallersAsignados as any} />;
}

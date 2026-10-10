export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AmarCVClient from './AmarCVClient';

export default async function AmarCVPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [usuario, ultimoVideo] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { nombre_completo: true, cv_datos: true },
    }),
    prisma.video.findFirst({
      where: { user_id: session.userId, tipo: 'video_cv' },
      orderBy: { created_at: 'desc' },
      select: { id: true, analisis_ia: true, section_attempts: true },
    }),
  ]);

  if (!usuario) redirect('/login');

  const cvDatos = (usuario.cv_datos as Record<string, unknown>) ?? {};
  const tieneCv = !!(cvDatos.resumen || (cvDatos.experiencia as unknown[])?.length > 0);

  return (
    <AmarCVClient
      nombre={usuario.nombre_completo ?? ''}
      cvExistente={tieneCv}
      cvResumenActual={(cvDatos.resumen as string) ?? null}
      videoAnalisis={(ultimoVideo?.analisis_ia as any) ?? null}
      videoSecciones={(ultimoVideo?.section_attempts as any) ?? null}
    />
  );
}

export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import GrabarCVClient from './GrabarCVClient';

export default async function GrabarCVPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [modulos, usuario] = await Promise.all([
    prisma.configuracionVideo.findMany({
      where:   { tipo_video: 'video_cv' },
      orderBy: { orden: 'asc' },
    }),
    prisma.usuario.findUnique({
      where:  { id: session.userId },
      select: { korai_semaforo: true },
    }),
  ]);

  // Si ya tiene empleo + ingresos + educacion en el semáforo, no repreguntamos
  const semaforo = (usuario?.korai_semaforo as Record<string, unknown>) ?? {};
  const tienePreDiagnostico =
    !!semaforo.empleo && !!semaforo.ingresos && !!semaforo.educacion;

  return (
    <GrabarCVClient
      modulos={modulos}
      session={session}
      tienePreDiagnostico={tienePreDiagnostico}
    />
  );
}

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import VideoRecorder from '@/components/ui/VideoRecorder';

export default async function GrabarTallerPage({
  searchParams,
}: {
  searchParams: { taller_id?: string; tipo?: string };
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const tallerId = searchParams.taller_id;
  const tipo = (searchParams.tipo as 'video_cv' | 'video_pitch') ?? 'video_cv';

  if (!tallerId) redirect('/dashboard');

  const tallerUsuario = await prisma.tallerUsuario.findFirst({
    where: { usuario_id: session.userId, taller_id: tallerId },
    include: {
      taller: {
        include: {
          modulos: { orderBy: { orden: 'asc' } },
        },
      },
    },
  });

  if (!tallerUsuario) redirect('/dashboard');

  const taller = tallerUsuario.taller;
  const modulos = taller.modulos.filter(m => m.tipo_video === tipo);

  if (modulos.length === 0) redirect('/dashboard');

  return (
    <VideoRecorder
      modulos={modulos}
      session={session}
      tipo={tipo}
      tallerId={tallerId}
      tallerNombre={taller.nombre}
    />
  );
}

import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import VideoRecorder from '@/components/ui/VideoRecorder';

interface Props {
  searchParams: { taller_id?: string; tipo?: string };
}

export default async function GrabarTallerPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { taller_id, tipo } = searchParams;

  if (!taller_id || !tipo || !['video_cv', 'video_pitch'].includes(tipo)) {
    redirect('/dashboard');
  }

  // Verify user is assigned to this taller
  const relacion = await prisma.tallerUsuario.findUnique({
    where: { usuario_id_taller_id: { usuario_id: session.userId, taller_id } },
    include: { taller: true },
  });

  if (!relacion) redirect('/dashboard');

  // Load taller-specific modulos for the requested tipo
  const modulos = await prisma.tallerModulo.findMany({
    where: { taller_id, tipo_video: tipo as 'video_cv' | 'video_pitch' },
    orderBy: { orden: 'asc' },
  });

  if (modulos.length === 0) notFound();

  return (
    <VideoRecorder
      modulos={modulos}
      session={session}
      tipo={tipo as 'video_cv' | 'video_pitch'}
      tallerId={taller_id}
      tallerNombre={relacion.taller.nombre}
    />
  );
}

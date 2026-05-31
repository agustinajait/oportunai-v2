export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import VideoRecorder from '@/components/ui/VideoRecorder';

export default async function GrabarOfertaPage({
  searchParams,
}: {
  searchParams: { oferta_id?: string };
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const ofertaId = searchParams.oferta_id;
  if (!ofertaId) redirect('/dashboard');

  const oferta = await prisma.oferta.findUnique({
    where: { id: ofertaId },
    select: {
      titulo: true,
      preguntas_videocv: true,
      empresa: { select: { nombre: true } },
    },
  });

  if (!oferta || oferta.preguntas_videocv.length === 0) redirect('/dashboard');

  const modulos = oferta.preguntas_videocv.map((pregunta, i) => ({
    id: `${ofertaId}-q${i}`,
    nombre_modulo: `Pregunta ${i + 1}`,
    duracion_base: 60,
    texto_guia: pregunta,
    orden: i + 1,
  }));

  return (
    <VideoRecorder
      modulos={modulos}
      session={session}
      tipo="video_cv"
      ofertaId={ofertaId}
      ofertaNombre={`${oferta.empresa.nombre} — ${oferta.titulo}`}
    />
  );
}

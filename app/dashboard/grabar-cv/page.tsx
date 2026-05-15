import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import VideoRecorder from '@/components/ui/VideoRecorder';

export default async function GrabarCVPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const modulos = await prisma.configuracionVideo.findMany({
    where: { tipo_video: 'video_cv' },
    orderBy: { orden: 'asc' },
  });

  return <VideoRecorder modulos={modulos} session={session} tipo="video_cv" />;
}

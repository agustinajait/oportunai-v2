export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PublicProfileClient from '@/components/ui/PublicProfileClient';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const usuario = await prisma.usuario.findUnique({
    where: { slug: params.slug },
    select: { nombre_completo: true },
  });

  if (!usuario) return { title: 'Perfil no encontrado' };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const ogImage = `${appUrl}/og-default.png`;
  return {
    title: `Video CV de ${usuario.nombre_completo} | Oportunai`,
    description: `Mirá el Video CV de ${usuario.nombre_completo} en Oportunai.`,
    openGraph: {
      title: `Conocé a ${usuario.nombre_completo}`,
      description: `Mirá el Video CV de ${usuario.nombre_completo} en Oportunai.`,
      url: `${appUrl}/u/${params.slug}/cv`,
      siteName: 'Oportunai',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Video CV de ${usuario.nombre_completo}` }],
      type: 'video.other',
      videos: [{ url: `${appUrl}/u/${params.slug}/cv`, type: 'text/html' }],
    },
    twitter: { card: 'summary_large_image', title: `Conocé a ${usuario.nombre_completo}`, description: `Mirá el Video CV de ${usuario.nombre_completo} en Oportunai.`, images: [ogImage] },
  };
}

export default async function VideoCVPage({ params }: Props) {
  const usuario = await prisma.usuario.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      nombre_completo: true,
      bio: true,
      slug: true,
      foto_url: true,
      alfa_digital: true,
      alfa_score: true,
      fecha_nacimiento: true,
      email: true,
      telefono: true,
      direccion: true,
      cv_datos: true,
      videos: {
        where: { tipo: 'video_cv', es_fragmento: false, oferta_id: null },
        orderBy: { created_at: 'desc' },
        take: 1,
      },
      archivos: {
        where: { file_type: { in: ['pdf', 'docx', 'doc'] } },
        orderBy: { created_at: 'desc' },
        take: 1,
      },
      documentos: {
        select: { tipo: true, file_url: true },
      },
    },
  });

  if (!usuario) notFound();

  return (
    <PublicProfileClient
      usuario={usuario as any}
      tipo="cv"
    />
  );
}

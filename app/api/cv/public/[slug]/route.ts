/**
 * GET /api/cv/public/[slug]
 * Descarga el CV generado por Oportunai (ATS-optimizado) de cualquier candidato.
 * Endpoint público — lo usan empleadores desde el perfil público del candidato.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildCvBuffer, cvFilename, CvDatosInput } from '@/lib/cv-generator';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const usuario = await prisma.usuario.findUnique({
    where: { slug: params.slug },
    select: { nombre_completo: true, email: true, telefono: true, cv_datos: true },
  });

  if (!usuario) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const cv = usuario.cv_datos as CvDatosInput | null;
  const tieneDatos = cv?.resumen || (cv?.experiencia?.length ?? 0) > 0 || (cv?.habilidades?.length ?? 0) > 0;
  if (!tieneDatos) return NextResponse.json({ error: 'Este candidato aún no completó su CV' }, { status: 404 });

  const buffer = await buildCvBuffer(usuario as any);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${cvFilename(usuario.nombre_completo, 'cv-oportunai')}"`,
    },
  });
}

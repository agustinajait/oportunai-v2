export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public profile data — no auth required.
// Contact details are intentionally excluded; use /api/users/[slug]/contact for those.
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const usuario = await prisma.usuario.findUnique({
    where: { slug: params.slug },
    select: {
      nombre_completo: true,
      bio: true,
      slug: true,
      alfa_digital: true,
      alfa_score: true,
      fecha_nacimiento: true,
      cv_datos: true,
      // Only return final (merged) videos, not intermediate fragments
      videos: {
        where: { es_fragmento: false },
        orderBy: { created_at: 'desc' },
        select: { id: true, tipo: true, video_url: true, created_at: true },
      },
      archivos: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { id: true, file_url: true, file_type: true },
      },
      referencias: {
        where: { estado: 'validada' },
        orderBy: { fecha_validada: 'desc' },
        select: { id: true, empresa_nombre: true, referidor_nombre: true, referidor_cargo: true, referidor_email: true, mensaje: true, fecha_validada: true },
      },
    },
  });

  if (!usuario) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
  return NextResponse.json(usuario);
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Contacto público visible sólo al hacer clic explícito
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const usuario = await prisma.usuario.findUnique({
    where: { slug: params.slug },
    select: {
      telefono: true,
      email: true,
      direccion: true,
    },
  });

  if (!usuario) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
  return NextResponse.json(usuario);
}

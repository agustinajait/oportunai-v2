export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      nombre_completo: true,
      email: true,
      telefono: true,
      direccion: true,
      dni: true,
      role: true,
      bio: true,
      slug: true,
      created_at: true,
      videos: { orderBy: { created_at: 'desc' } },
      archivos: { orderBy: { created_at: 'desc' } },
    },
  });

  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  return NextResponse.json(usuario);
}


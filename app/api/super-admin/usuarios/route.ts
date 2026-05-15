import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const usuarios = await prisma.usuario.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      nombre_completo: true,
      email: true,
      dni: true,
      role: true,
      slug: true,
      created_at: true,
      taller_usuarios: {
        include: {
          taller: { select: { id: true, nombre: true, habilita_cv: true, habilita_pitch: true } },
        },
        orderBy: { asignado_en: 'desc' },
      },
      _count: { select: { videos: true } },
    },
  });

  return NextResponse.json(usuarios);
}

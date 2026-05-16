export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
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
      _count: { select: { videos: true, archivos: true } },
    },
  });

  return NextResponse.json(usuarios);
}


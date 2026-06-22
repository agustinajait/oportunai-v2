export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rubro = searchParams.get('rubro');

  const [capacitaciones, completadas] = await Promise.all([
    prisma.capacitacion.findMany({
      where: { activa: true, ...(rubro ? { rubro } : {}) },
      include: {
        empresa: { select: { nombre: true, logo_url: true } },
        _count: { select: { completadas: true } },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.capacitacionUsuario.findMany({
      where: { usuario_id: session.userId },
      select: { capacitacion_id: true },
    }),
  ]);

  const completadasIds = new Set(completadas.map(c => c.capacitacion_id));

  return NextResponse.json({
    capacitaciones: capacitaciones.map(c => ({
      ...c,
      completada: completadasIds.has(c.id),
    })),
  });
}

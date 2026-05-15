import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const miembro = await prisma.empresaMiembro.findFirst({
      where: { usuario_id: session.userId },
    });

    if (!miembro) {
      return NextResponse.json({ ofertas: [] });
    }

    const ofertas = await prisma.oferta.findMany({
      where: { empresa_id: miembro.empresa_id },
      include: { _count: { select: { postulaciones: true } } },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ ofertas });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
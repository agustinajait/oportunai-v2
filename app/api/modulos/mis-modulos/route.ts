export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/modulos/mis-modulos — módulos asignados al candidato
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const modulos = await prisma.moduloAsignado.findMany({
      where: { usuario_id: session.userId },
      include: {
        servicio: { select: { id: true, titulo: true, descripcion: true, frecuencia: true } },
        empresa: { select: { id: true, nombre: true, logo_url: true } },
        evidencias: { orderBy: { item_index: 'asc' } },
        remito: { select: { id: true, numero_remito: true, pdf_url: true, created_at: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ modulos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

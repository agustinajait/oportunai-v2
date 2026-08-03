export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getEmpresaId(userId: string) {
  const miembro = await prisma.empresaMiembro.findFirst({
    where: { usuario_id: userId, activo: true },
    select: { empresa_id: true },
  });
  return miembro?.empresa_id ?? null;
}

// GET /api/empresa/servicios/[id]/modulos — módulos asignados para este servicio
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const empresa_id = await getEmpresaId(session.userId);
    if (!empresa_id) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

    const servicio = await prisma.servicio.findUnique({ where: { id: params.id } });
    if (!servicio || servicio.empresa_id !== empresa_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const modulos = await prisma.moduloAsignado.findMany({
      where: { servicio_id: params.id, empresa_id },
      include: {
        usuario: { select: { id: true, nombre_completo: true, email: true, telefono: true, slug: true, foto_url: true } },
        evidencias: { orderBy: { item_index: 'asc' } },
        remito: { select: { id: true, numero_remito: true, pdf_url: true, created_at: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    return NextResponse.json({ modulos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

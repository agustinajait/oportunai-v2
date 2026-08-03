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

// PATCH /api/modulos/[id]/aprobar-item — empresa aprueba o rechaza un item de evidencia
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const empresa_id = await getEmpresaId(session.userId);
    if (!empresa_id) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

    const modulo = await prisma.moduloAsignado.findUnique({ where: { id: params.id } });
    if (!modulo || modulo.empresa_id !== empresa_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { item_index, estado } = body;

    if (typeof item_index !== 'number' || !['aprobado', 'rechazado', 'pendiente'].includes(estado)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const evidencia = await prisma.evidenciaItem.update({
      where: { modulo_id_item_index: { modulo_id: params.id, item_index } },
      data: { estado },
    });

    // Si todos los items tienen evidencia aprobada, marcar módulo como completado
    const protocolo = modulo.protocolo as { item: string; descripcion: string }[];
    if (protocolo.length > 0) {
      const todasLasEvidencias = await prisma.evidenciaItem.findMany({
        where: { modulo_id: params.id },
      });
      const todosAprobados = protocolo.every((_, idx) => {
        const ev = todasLasEvidencias.find(e => e.item_index === idx);
        return ev?.estado === 'aprobado';
      });
      if (todosAprobados && modulo.estado !== 'completado' && modulo.estado !== 'aprobado') {
        await prisma.moduloAsignado.update({
          where: { id: params.id },
          data: { estado: 'completado' },
        });
      }
    }

    return NextResponse.json({ ok: true, evidencia });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

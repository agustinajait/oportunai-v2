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

// PATCH /api/modulos/[id]/estado — empresa cambia el estado general del módulo
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
    const { estado, contrato_url } = body;

    const ESTADOS_VALIDOS = ['en_progreso', 'en_riesgo', 'completado', 'aprobado'];
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const updated = await prisma.moduloAsignado.update({
      where: { id: params.id },
      data: {
        ...(estado !== undefined && { estado }),
        ...(contrato_url !== undefined && { contrato_url }),
      },
    });

    return NextResponse.json({ ok: true, modulo: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

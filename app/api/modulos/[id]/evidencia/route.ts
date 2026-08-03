export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// POST /api/modulos/[id]/evidencia — candidato sube evidencia para un item del protocolo
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role === 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const modulo = await prisma.moduloAsignado.findUnique({ where: { id: params.id } });
    if (!modulo || modulo.usuario_id !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    if (modulo.estado === 'aprobado') {
      return NextResponse.json({ error: 'El módulo ya está aprobado' }, { status: 400 });
    }

    const body = await req.json();
    const { item_index, texto, archivo_url } = body;

    if (typeof item_index !== 'number') {
      return NextResponse.json({ error: 'Falta item_index' }, { status: 400 });
    }

    const evidencia = await prisma.evidenciaItem.upsert({
      where: { modulo_id_item_index: { modulo_id: params.id, item_index } },
      create: {
        modulo_id: params.id,
        item_index,
        texto: texto?.trim() || null,
        archivo_url: archivo_url || null,
        estado: 'pendiente',
      },
      update: {
        texto: texto?.trim() || null,
        archivo_url: archivo_url || null,
        estado: 'pendiente',
      },
    });

    // Actualizar estado del módulo a en_progreso si estaba en riesgo
    if (modulo.estado === 'en_riesgo') {
      await prisma.moduloAsignado.update({
        where: { id: params.id },
        data: { estado: 'en_progreso' },
      });
    }

    return NextResponse.json({ ok: true, evidencia });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

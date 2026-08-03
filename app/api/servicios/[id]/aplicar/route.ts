export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// POST /api/servicios/[id]/aplicar — candidato aplica al servicio
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role === 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const servicio = await prisma.servicio.findUnique({ where: { id: params.id } });
    if (!servicio || servicio.estado !== 'activo') {
      return NextResponse.json({ error: 'Servicio no disponible' }, { status: 400 });
    }

    const existente = await prisma.postulacionServicio.findUnique({
      where: { servicio_id_usuario_id: { servicio_id: params.id, usuario_id: session.userId } },
    });
    if (existente) {
      return NextResponse.json({ error: 'Ya aplicaste a este servicio' }, { status: 400 });
    }

    const postulacion = await prisma.postulacionServicio.create({
      data: {
        servicio_id: params.id,
        usuario_id: session.userId,
        estado: 'pendiente',
      },
    });

    return NextResponse.json({ ok: true, postulacion }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

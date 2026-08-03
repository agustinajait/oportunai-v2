export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/servicios/[id] — detalle del servicio
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);

    const servicio = await prisma.servicio.findUnique({
      where: { id: params.id },
      include: {
        empresa: { select: { id: true, nombre: true, logo_url: true, slug: true, descripcion: true } },
        capacitacion: { select: { id: true, titulo: true, descripcion: true, video_url: true } },
        _count: { select: { postulaciones: true } },
      },
    });

    if (!servicio) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    // Si hay sesión, agregar estado de postulación del usuario
    let miPostulacion = null;
    if (session) {
      miPostulacion = await prisma.postulacionServicio.findUnique({
        where: { servicio_id_usuario_id: { servicio_id: params.id, usuario_id: session.userId } },
      });
    }

    return NextResponse.json({ servicio, miPostulacion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH /api/servicios/[id] — empresa actualiza el servicio
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const miembro = await prisma.empresaMiembro.findFirst({
      where: { usuario_id: session.userId, activo: true },
      select: { empresa_id: true },
    });
    if (!miembro) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

    const servicio = await prisma.servicio.findUnique({ where: { id: params.id } });
    if (!servicio || servicio.empresa_id !== miembro.empresa_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { titulo, descripcion, frecuencia, duracion_jornada, horas_modulo, precio_hora, deadline, capacitacion_id, contrato_template, protocolo, estado, docs_requeridos } = body;

    const updated = await prisma.servicio.update({
      where: { id: params.id },
      data: {
        ...(titulo !== undefined && { titulo: titulo.trim() }),
        ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
        ...(frecuencia !== undefined && { frecuencia }),
        ...(duracion_jornada !== undefined && { duracion_jornada: duracion_jornada?.trim() || null }),
        ...(horas_modulo !== undefined && { horas_modulo: horas_modulo ? parseInt(horas_modulo) : null }),
        ...(precio_hora !== undefined && { precio_hora: precio_hora ? parseFloat(precio_hora) : null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(capacitacion_id !== undefined && { capacitacion_id: capacitacion_id || null }),
        ...(contrato_template !== undefined && { contrato_template: contrato_template?.trim() || null }),
        ...(protocolo !== undefined && { protocolo }),
        ...(estado !== undefined && { estado }),
        ...(docs_requeridos !== undefined && { docs_requeridos: Array.isArray(docs_requeridos) ? docs_requeridos : [] }),
      },
    });

    return NextResponse.json({ ok: true, servicio: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

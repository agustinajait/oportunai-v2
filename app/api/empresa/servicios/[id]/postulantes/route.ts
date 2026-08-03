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

// GET /api/empresa/servicios/[id]/postulantes — lista de postulantes al servicio
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

    const postulaciones = await prisma.postulacionServicio.findMany({
      where: { servicio_id: params.id },
      include: {
        usuario: {
          select: {
            id: true, nombre_completo: true, email: true, telefono: true,
            slug: true, bio: true, direccion: true, foto_url: true,
            cv_datos: true, alfa_digital: true, alfa_score: true,
            videos: {
              where: { es_fragmento: false },
              select: { id: true, video_url: true, tipo: true, created_at: true },
              orderBy: { created_at: 'desc' },
              take: 2,
            },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return NextResponse.json({ postulaciones });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH /api/empresa/servicios/[id]/postulantes — aceptar o rechazar postulante
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await req.json();
    const { postulacion_id, estado, deadline } = body;

    if (!postulacion_id || !['aceptado', 'rechazado'].includes(estado)) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const postulacion = await prisma.postulacionServicio.update({
      where: { id: postulacion_id },
      data: { estado },
    });

    // Si se acepta, crear modulo asignado
    if (estado === 'aceptado') {
      const moduloExistente = await prisma.moduloAsignado.findFirst({
        where: { servicio_id: params.id, usuario_id: postulacion.usuario_id },
      });

      if (!moduloExistente) {
        await prisma.moduloAsignado.create({
          data: {
            servicio_id: params.id,
            usuario_id: postulacion.usuario_id,
            empresa_id,
            protocolo: servicio.protocolo,
            estado: 'en_progreso',
            deadline: deadline ? new Date(deadline) : (servicio.deadline ?? null),
          },
        });
      }
    }

    return NextResponse.json({ ok: true, postulacion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

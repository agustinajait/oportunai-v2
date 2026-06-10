export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const miembro = await prisma.empresaMiembro.findFirst({
      where: { usuario_id: session.userId },
    });

    const oferta = await prisma.oferta.findFirst({
      where: { id: params.id, empresa_id: miembro?.empresa_id },
    });

    if (!oferta) {
      return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 });
    }

    const postulaciones = await prisma.postulacion.findMany({
      where: { oferta_id: params.id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true,
            slug: true,
            bio: true,
            direccion: true,
            fecha_nacimiento: true,
            cv_datos: true,
            alfa_digital: true,
            alfa_score: true,
            videos: {
              where: { oferta_id: params.id, es_fragmento: false },
              select: { id: true, video_url: true, tipo: true, created_at: true },
              take: 1,
            },
          },
        },
        video: { select: { id: true, video_url: true, tipo: true, created_at: true, section_attempts: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ postulaciones });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { postulacion_id, estado } = body;

    const estadosValidos = ['pendiente', 'visto', 'interesado', 'contactar', 'en_proceso', 'contratado', 'bolsa_talentos', 'descartado'];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const postulacion = await prisma.postulacion.update({
      where: { id: postulacion_id },
      data: { estado },
    });

    return NextResponse.json({ ok: true, postulacion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

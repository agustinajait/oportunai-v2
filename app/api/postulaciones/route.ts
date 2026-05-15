import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// POST /api/postulaciones — candidato aplica con su video
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'user') {
      return NextResponse.json({ error: 'Solo candidatos pueden postularse' }, { status: 401 });
    }

    const body = await req.json();
    const { oferta_id, video_id, nota } = body;

    if (!oferta_id || !video_id) {
      return NextResponse.json({ error: 'Faltan oferta_id o video_id' }, { status: 400 });
    }

    // Verificar que el video pertenece al usuario
    const video = await prisma.video.findFirst({
      where: { id: video_id, user_id: session.userId, es_fragmento: false },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video no válido' }, { status: 400 });
    }

    // Verificar que no aplicó antes
    const existente = await prisma.postulacion.findUnique({
      where: { oferta_id_usuario_id: { oferta_id, usuario_id: session.userId } },
    });

    if (existente) {
      return NextResponse.json({ error: 'Ya aplicaste a esta oferta' }, { status: 400 });
    }

    const postulacion = await prisma.postulacion.create({
      data: {
        oferta_id,
        usuario_id: session.userId,
        video_id,
        nota: nota || null,
        estado: 'pendiente',
      },
    });

    return NextResponse.json({ ok: true, postulacion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// GET /api/postulaciones — candidato ve sus postulaciones
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const postulaciones = await prisma.postulacion.findMany({
      where: { usuario_id: session.userId },
      include: {
        oferta: {
          include: { empresa: { select: { nombre: true, logo_url: true } } },
        },
        video: { select: { id: true, video_url: true, tipo: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ postulaciones });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
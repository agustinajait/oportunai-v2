export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const area = searchParams.get('area');
    const ciudad = searchParams.get('ciudad');
    const ofertas = await prisma.oferta.findMany({
      where: {
        estado: 'activa',
        ...(area ? { area } : {}),
        ...(ciudad ? { ciudad: { contains: ciudad, mode: 'insensitive' } } : {}),
      },
      include: {
        empresa: { select: { nombre: true, logo_url: true, slug: true } },
        _count: { select: { postulaciones: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ ofertas });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await req.json();
    const { titulo, descripcion, requisitos, area, modalidad, ciudad, mensaje_whatsapp, docs_requeridos, preguntas_videocv } = body;
    if (!titulo || !descripcion) {
      return NextResponse.json({ error: 'Titulo y descripcion son requeridos' }, { status: 400 });
    }
    const miembro = await prisma.empresaMiembro.findFirst({
      where: { usuario_id: session.userId },
      include: { empresa: true },
    });
    if (!miembro) {
      return NextResponse.json({ error: 'No tenes empresa asociada' }, { status: 400 });
    }
    const oferta = await prisma.oferta.create({
      data: {
        empresa_id: miembro.empresa_id,
        titulo,
        descripcion,
        requisitos: requisitos || null,
        area: area || null,
        modalidad: modalidad || 'presencial',
        ciudad: ciudad || null,
        estado: 'activa',
        mensaje_whatsapp: mensaje_whatsapp || null,
        docs_requeridos: docs_requeridos || [],
        preguntas_videocv: preguntas_videocv || [],
      },
    });
    return NextResponse.json({ ok: true, oferta });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/ofertas — lista ofertas activas (público, para candidatos)
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

// POST /api/ofertas — crear oferta (solo empleador)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { titulo, descripcion, requisitos, area, modalidad, ciudad } = body;

    if (!titulo || !descripcion) {
      return NextResponse.json({ error: 'Título y descripción son requeridos' }, { status: 400 });
    }

    // Obtener empresa del usuario
    const miembro = await prisma.empresaMiembro.findFirst({
      where: { usuario_id: session.userId },
      include: { empresa: true },
    });

    if (!miembro) {
      return NextResponse.json({ error: 'No tenés empresa asociada' }, { status: 400 });
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
      },
    });

    return NextResponse.json({ ok: true, oferta });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
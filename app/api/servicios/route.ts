export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/servicios — lista pública de servicios activos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresa_id = searchParams.get('empresa_id');

    const servicios = await prisma.servicio.findMany({
      where: {
        estado: 'activo',
        ...(empresa_id ? { empresa_id } : {}),
      },
      include: {
        empresa: { select: { id: true, nombre: true, logo_url: true, slug: true } },
        capacitacion: { select: { id: true, titulo: true } },
        _count: { select: { postulaciones: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ servicios });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST /api/servicios — empresa crea un servicio
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { titulo, descripcion, frecuencia, duracion_jornada, deadline, capacitacion_id, contrato_template, protocolo } = body;

    if (!titulo?.trim() || !descripcion?.trim() || !Array.isArray(protocolo) || protocolo.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos (titulo, descripcion, protocolo)' }, { status: 400 });
    }

    const servicio = await prisma.servicio.create({
      data: {
        empresa_id: miembro.empresa_id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        frecuencia: frecuencia || 'mensual',
        duracion_jornada: duracion_jornada?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        capacitacion_id: capacitacion_id || null,
        contrato_template: contrato_template?.trim() || null,
        protocolo,
      },
    });

    return NextResponse.json({ ok: true, servicio }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getEmpresaId(userId: string) {
  const miembro = await prisma.empresaMiembro.findFirst({
    where: { usuario_id: userId, activo: true },
    select: { empresa_id: true },
  });
  return miembro?.empresa_id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const empresa_id = await getEmpresaId(session.userId);
  if (!empresa_id) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

  const caps = await prisma.capacitacion.findMany({
    where: { empresa_id },
    include: { _count: { select: { completadas: true } } },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ capacitaciones: caps });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const empresa_id = await getEmpresaId(session.userId);
  if (!empresa_id) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

  const body = await req.json();
  const { titulo, descripcion, video_url, rubro, pregunta, opciones, respuesta_correcta } = body;

  if (!titulo?.trim() || !video_url?.trim() || !pregunta?.trim() ||
      !Array.isArray(opciones) || opciones.length < 2 ||
      typeof respuesta_correcta !== 'number') {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const cap = await prisma.capacitacion.create({
    data: {
      empresa_id,
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      video_url: video_url.trim(),
      rubro: rubro?.trim() || null,
      pregunta: pregunta.trim(),
      opciones,
      respuesta_correcta,
    },
  });

  return NextResponse.json({ ok: true, capacitacion: cap });
}

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const empresa_id = await getEmpresaId(session.userId);
  if (!empresa_id) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

  const cap = await prisma.capacitacion.findUnique({ where: { id: params.id } });
  if (!cap || cap.empresa_id !== empresa_id) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.capacitacion.update({
    where: { id: params.id },
    data: {
      ...(body.titulo && { titulo: body.titulo.trim() }),
      ...(body.descripcion !== undefined && { descripcion: body.descripcion?.trim() || null }),
      ...(body.video_url && { video_url: body.video_url.trim() }),
      ...(body.rubro !== undefined && { rubro: body.rubro?.trim() || null }),
      ...(body.pregunta && { pregunta: body.pregunta.trim() }),
      ...(body.opciones && { opciones: body.opciones }),
      ...(typeof body.respuesta_correcta === 'number' && { respuesta_correcta: body.respuesta_correcta }),
      ...(typeof body.activa === 'boolean' && { activa: body.activa }),
    },
  });

  return NextResponse.json({ ok: true, capacitacion: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const empresa_id = await getEmpresaId(session.userId);
  if (!empresa_id) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

  const cap = await prisma.capacitacion.findUnique({ where: { id: params.id } });
  if (!cap || cap.empresa_id !== empresa_id) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  await prisma.capacitacion.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

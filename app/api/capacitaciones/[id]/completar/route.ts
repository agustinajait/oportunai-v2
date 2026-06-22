export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const cap = await prisma.capacitacion.findUnique({ where: { id: params.id } });
  if (!cap || !cap.activa) return NextResponse.json({ error: 'Capacitación no encontrada' }, { status: 404 });

  const body = await req.json();
  const { respuesta } = body;

  if (typeof respuesta !== 'number' || respuesta !== cap.respuesta_correcta) {
    return NextResponse.json({ ok: false, error: 'Respuesta incorrecta' }, { status: 400 });
  }

  await prisma.capacitacionUsuario.upsert({
    where: { usuario_id_capacitacion_id: { usuario_id: session.userId, capacitacion_id: params.id } },
    create: { usuario_id: session.userId, capacitacion_id: params.id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

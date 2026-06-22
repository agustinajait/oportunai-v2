export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { estado } = await req.json();
    if (!['confirmada', 'rechazada'].includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const invitado = await prisma.citaInvitado.findFirst({
      where: { id: params.id, postulacion: { usuario_id: session.userId } },
    });
    if (!invitado) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const actualizado = await prisma.citaInvitado.update({
      where: { id: invitado.id },
      data: { estado, respondido_en: new Date() },
    });

    return NextResponse.json({ ok: true, invitado: actualizado });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

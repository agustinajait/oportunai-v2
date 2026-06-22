export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const ref = await prisma.referencia.findUnique({ where: { id: params.id } });
  if (!ref || ref.usuario_id !== session.userId) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  }

  await prisma.referencia.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const archivo = await prisma.archivo.findUnique({ where: { id: params.id } });
  if (!archivo || archivo.user_id !== session.userId) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  await prisma.archivo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { score, badge } = body;

  if (typeof badge !== 'string' || typeof score !== 'number') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  await prisma.usuario.update({
    where: { id: session.userId },
    data: { alfa_digital: badge, alfa_score: score },
  });

  return NextResponse.json({ ok: true });
}

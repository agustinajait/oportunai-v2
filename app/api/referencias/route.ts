export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const referencias = await prisma.referencia.findMany({
    where: { usuario_id: session.userId },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ referencias });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { empresa_nombre, referidor_nombre } = body;

  if (!empresa_nombre?.trim() || !referidor_nombre?.trim()) {
    return NextResponse.json({ error: 'Empresa y nombre del referente son requeridos' }, { status: 400 });
  }

  const referencia = await prisma.referencia.create({
    data: {
      usuario_id: session.userId,
      empresa_nombre: empresa_nombre.trim(),
      referidor_nombre: referidor_nombre.trim(),
    },
  });

  return NextResponse.json({ ok: true, referencia });
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { fecha_nacimiento, cv_datos } = body;

  const data: Record<string, any> = {};
  if (fecha_nacimiento !== undefined) {
    data.fecha_nacimiento = fecha_nacimiento ? new Date(fecha_nacimiento) : null;
  }
  if (cv_datos !== undefined) {
    data.cv_datos = cv_datos;
  }

  const usuario = await prisma.usuario.update({
    where: { id: session.userId },
    data,
    select: { fecha_nacimiento: true, cv_datos: true },
  });

  return NextResponse.json({ ok: true, ...usuario });
}

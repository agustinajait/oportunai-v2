/**
 * POST /api/admin/activate-premium
 * Activa plan premium para el usuario logueado (testing only).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const usuario = await prisma.usuario.update({
    where: { id: session.userId },
    data: { pagado: true },
    select: { id: true, email: true, nombre_completo: true, pagado: true },
  });

  return NextResponse.json({ ok: true, usuario });
}

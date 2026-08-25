/**
 * POST /api/push/subscribe   — registra una suscripción web push
 * DELETE /api/push/subscribe — elimina una suscripción
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { endpoint, keys } = body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Datos de suscripción incompletos' }, { status: 400 });
  }

  await prisma.pushSuscripcion.upsert({
    where:  { endpoint },
    create: {
      usuario_id: session.userId,
      endpoint,
      p256dh:     keys.p256dh,
      auth:       keys.auth,
      user_agent: req.headers.get('user-agent') ?? undefined,
    },
    update: {
      usuario_id: session.userId,
      p256dh:     keys.p256dh,
      auth:       keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { endpoint } = await req.json() as { endpoint: string };
  if (!endpoint) return NextResponse.json({ error: 'Falta endpoint' }, { status: 400 });

  await prisma.pushSuscripcion.deleteMany({
    where: { endpoint, usuario_id: session.userId },
  });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mp } from '@/lib/mercadopago';
import { Preference } from 'mercadopago';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, nombre_completo: true, pagado: true },
  });
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  if (usuario.pagado) {
    return NextResponse.json({ error: 'Ya tenés el plan premium activo' }, { status: 400 });
  }

  const preference = new Preference(mp);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000';
  const precio = Number(process.env.MP_PRECIO ?? '10');

  const result = await preference.create({
    body: {
      items: [
        {
          id: 'premium-oportunai',
          title: 'OportunAI Premium — CV + Análisis + Adaptación al puesto',
          quantity: 1,
          unit_price: precio,
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: usuario.email,
        name: usuario.nombre_completo ?? undefined,
      },
      back_urls: {
        success: `${appUrl}/dashboard?pago=ok`,
        failure: `${appUrl}/dashboard?pago=error`,
        pending: `${appUrl}/dashboard?pago=pendiente`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/pagos/webhook`,
      metadata: { userId: usuario.id },
      external_reference: usuario.id,
    },
  });

  return NextResponse.json({ url: result.init_point });
}

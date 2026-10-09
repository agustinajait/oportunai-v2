import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mp } from '@/lib/mercadopago';
import { Payment } from 'mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(req.nextUrl.search);

  // MP envía IPN con query param "id" y "topic", o JSON con "data.id"
  let paymentId: string | null = params.get('id');
  const topic = params.get('topic') ?? params.get('type');

  if (!paymentId) {
    try {
      const json = JSON.parse(body);
      paymentId = json?.data?.id ?? null;
    } catch {
      // no JSON body
    }
  }

  // Solo procesamos pagos, ignoramos otros topics
  if (topic && topic !== 'payment' && topic !== 'merchant_order') {
    return NextResponse.json({ ok: true });
  }

  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
  }

  try {
    const payment = new Payment(mp);
    const data = await payment.get({ id: paymentId });

    if (data.status !== 'approved') {
      return NextResponse.json({ ok: true, status: data.status });
    }

    const userId = (data.metadata as any)?.user_id ?? data.external_reference;
    if (!userId) {
      return NextResponse.json({ error: 'No userId in payment' }, { status: 400 });
    }

    await prisma.usuario.update({
      where: { id: userId },
      data: {
        pagado: true,
        stripe_session_id: String(paymentId),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error procesando webhook MP:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

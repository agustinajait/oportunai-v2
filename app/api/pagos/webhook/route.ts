import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as any;
    const userId = checkoutSession.metadata?.userId;

    if (userId) {
      try {
        await prisma.usuario.update({
          where: { id: userId },
          data: {
            pagado: true,
            stripe_session_id: checkoutSession.id,
          },
        });
        console.log(`Usuario ${userId} marcado como pagado (sesión ${checkoutSession.id})`);
      } catch (err) {
        console.error('Error actualizando usuario en webhook:', err);
        return NextResponse.json({ error: 'Error procesando pago' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * PATCH /api/whatsapp/opt-in
 * El candidato activa o desactiva el acompañamiento por WhatsApp.
 * Al activar: bot se presenta, comparte link del perfil e invita al diagnóstico de Korai.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oportunai.korai.lat';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role === 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { activo } = await req.json();
    if (typeof activo !== 'boolean') {
      return NextResponse.json({ error: 'activo debe ser boolean' }, { status: 400 });
    }

    const usuario = await prisma.usuario.update({
      where: { id: session.userId },
      data: {
        korai_opt_in:    activo,
        whatsapp_activo: activo,
      },
      select: {
        id: true,
        korai_opt_in: true,
        whatsapp_activo: true,
        telefono: true,
        nombre_completo: true,
        slug: true,
        cv_datos: true,
      },
    });

    // Al activar el bot: enviar mensaje de bienvenida
    if (activo && process.env.SUPABASE_FUNCTIONS_URL) {
      const primer_nombre = usuario.nombre_completo.split(' ')[0];
      const perfilUrl = `${APP_URL}/u/${usuario.slug}`;

      const bienvenida =
        `¡Hola ${primer_nombre}! 👋 Somos el equipo de OportunAI.\n\n` +
        `Estamos acá para acompañarte en tu búsqueda de trabajo: ayudarte a mejorar tu perfil, ` +
        `avisarte cuando haya oportunidades que encajen con vos y prepararte para entrevistas.\n\n` +
        `Tu perfil laboral ya está disponible:\n` +
        `🔗 ${perfilUrl}\n\n` +
        `Para poder recomendarte oportunidades según tus habilidades y tu situación, ` +
        `te invitamos a hacer el diagnóstico gratuito de Korai:\n` +
        `📋 app.korai.lat\n\n` +
        `Son solo unos minutos y nos da el punto de partida para acompañarte mejor. ¡Cuando lo hagas, seguimos acá!`;

      await fetch(`${process.env.SUPABASE_FUNCTIONS_URL}/send_whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
        },
        body: JSON.stringify({
          telefono:   usuario.telefono,
          mensaje:    bienvenida,
          usuario_id: usuario.id,
        }),
      }).catch(err => console.error('Error enviando bienvenida WA:', err));
    }

    return NextResponse.json({ ok: true, whatsapp_activo: usuario.whatsapp_activo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/whatsapp/opt-in
 * El candidato activa o desactiva el acompañamiento por WhatsApp.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

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
      select: { id: true, korai_opt_in: true, whatsapp_activo: true, telefono: true, nombre_completo: true },
    });

    // Si activa el bot, enviar mensaje de bienvenida
    if (activo && process.env.SUPABASE_FUNCTIONS_URL) {
      const primer_nombre = usuario.nombre_completo.split(' ')[0];
      const bienvenida =
        `¡Hola ${primer_nombre}! 👋 Soy el asistente de OportunAI. ` +
        `A partir de ahora podés escribirnos por acá cuando tengas dudas sobre tu búsqueda de trabajo, tu perfil o los servicios disponibles. ` +
        `¿En qué sector estás buscando trabajo?`;

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

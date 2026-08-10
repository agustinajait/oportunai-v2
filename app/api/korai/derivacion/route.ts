/**
 * POST /api/korai/derivacion
 *
 * Webhook que Korai llama cuando deriva a un usuario a OportunAI.
 * Recibe el semáforo del usuario y activa el bot de WhatsApp si corresponde.
 *
 * Body esperado:
 * {
 *   korai_user_id: string      // ID interno de Korai (para referencia)
 *   telefono: string           // número del usuario
 *   nombre: string
 *   semaforo: {                // estado por dimensión
 *     empleo: 'verde' | 'amarillo' | 'rojo'
 *     educacion?: string
 *     ingresos?: string
 *     salud?: string
 *     vivienda?: string
 *     red?: string
 *   }
 *   motivo: string             // por qué lo derivan ("necesidad_laboral", "busca_empleo", etc.)
 *   secret: string             // token compartido para autenticar la llamada
 * }
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const KORAI_WEBHOOK_SECRET = process.env.KORAI_WEBHOOK_SECRET ?? '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { telefono, nombre, semaforo, motivo, secret } = body;

    // Autenticación básica con shared secret
    if (!KORAI_WEBHOOK_SECRET || secret !== KORAI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!telefono) {
      return NextResponse.json({ error: 'telefono requerido' }, { status: 400 });
    }

    // Buscar usuario por teléfono (normalizando formatos argentinos)
    const digits = telefono.replace(/\D/g, '');
    const variantes = new Set<string>([digits]);
    if (digits.startsWith('549')) variantes.add(digits.slice(3));
    if (digits.startsWith('54'))  variantes.add(digits.slice(2));

    let usuario = null;
    for (const v of variantes) {
      usuario = await prisma.usuario.findFirst({
        where: { telefono: { contains: v } },
      });
      if (usuario) break;
    }

    if (!usuario) {
      // Usuario no registrado en Oportunai — registrar para seguimiento futuro
      console.log(`[Korai derivacion] Usuario no encontrado en Oportunai: ${telefono} (${nombre})`);
      return NextResponse.json({
        ok: false,
        message: 'Usuario no registrado en Oportunai',
        telefono,
      });
    }

    // Actualizar semáforo y activar opt-in si corresponde
    const datosSemaforo = {
      ...semaforo,
      motivo,
      derivado_at: new Date().toISOString(),
    };

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        korai_semaforo: datosSemaforo,
        // Si el usuario no tiene opt-in activo, activarlo automáticamente
        // solo cuando tiene necesidad laboral urgente (rojo o amarillo)
        ...(
          (semaforo?.empleo === 'rojo' || semaforo?.empleo === 'amarillo') && !usuario.korai_opt_in
            ? { korai_opt_in: true }
            : {}
        ),
      },
    });

    // Si el usuario ya tiene whatsapp activo, enviar mensaje proactivo
    if (usuario.whatsapp_activo && process.env.SUPABASE_FUNCTIONS_URL) {
      const mensaje = motivo === 'necesidad_laboral'
        ? `Hola ${usuario.nombre_completo.split(' ')[0]} 👋 Recibimos tu consulta sobre búsqueda laboral. ¿Querés contarnos qué tipo de trabajo estás buscando para orientarte mejor?`
        : `Hola ${usuario.nombre_completo.split(' ')[0]} 👋 Te escribimos desde OportunAI. Tenemos oportunidades que pueden interesarte. ¿Cuándo podemos hablar?`;

      await fetch(`${process.env.SUPABASE_FUNCTIONS_URL}/send_whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY ?? ''}`,
        },
        body: JSON.stringify({
          telefono: usuario.telefono,
          mensaje,
          usuario_id: usuario.id,
        }),
      }).catch(err => console.error('Error enviando WA:', err));
    }

    return NextResponse.json({
      ok: true,
      usuario_id: usuario.id,
      whatsapp_activo: usuario.whatsapp_activo,
    });
  } catch (error) {
    console.error('[Korai derivacion]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

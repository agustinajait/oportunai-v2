/**
 * POST /api/korai/semaforo-resultado
 *
 * Korai llama este endpoint al terminar el survey cuando el usuario
 * vino desde OportunAI (tiene oportunai_user_id en localStorage).
 *
 * No requiere KORAI_WEBHOOK_SECRET (no hay servidor en Korai — es SPA).
 * La autenticación es: oportunai_user_id válido + Origin de app.korai.lat.
 *
 * Body:
 * {
 *   oportunai_user_id: string
 *   semaforo: {
 *     empleo?:    'verde' | 'amarillo' | 'rojo'
 *     educacion?: 'verde' | 'amarillo' | 'rojo'
 *     ingresos?:  'verde' | 'amarillo' | 'rojo'
 *     salud?:     'verde' | 'amarillo' | 'rojo'
 *     vivienda?:  'verde' | 'amarillo' | 'rojo'
 *     red?:       'verde' | 'amarillo' | 'rojo'
 *   }
 *   // Campos adicionales del diagnóstico Korai (opcionales)
 *   situacion_laboral?: 'con_trabajo' | 'buscando' | 'sin_trabajo'
 *   ingreso_hogar?:     '<700k' | '700k-1.3m' | '1.3m-2m' | '>2m' | 'prefiere_no_decir'
 *   tipo_vivienda?:     'propia' | 'alquilada' | 'prestada' | 'inestable'
 *   barrio?:            string
 *   motivo?:            string   // "Voces del territorio"
 * }
 *
 * Returns: { ok: true, whatsapp_activo: boolean }
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ALLOWED_ORIGINS = [
  'https://app.korai.lat',
  'http://localhost:5173',  // dev local de Korai
  'http://localhost:3000',
];

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin ?? '') ? (origin ?? '*') : 'null',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await req.json();
    const {
      oportunai_user_id, semaforo,
      situacion_laboral, ingreso_hogar, tipo_vivienda, barrio, motivo,
    } = body;

    if (!oportunai_user_id) {
      return NextResponse.json({ error: 'oportunai_user_id requerido' }, { status: 400, headers });
    }

    if (!semaforo || typeof semaforo !== 'object') {
      return NextResponse.json({ error: 'semaforo requerido' }, { status: 400, headers });
    }

    // Buscar usuario directamente por ID
    const usuario = await prisma.usuario.findUnique({
      where: { id: oportunai_user_id },
      select: {
        id: true,
        nombre_completo: true,
        telefono: true,
        whatsapp_activo: true,
        korai_opt_in: true,
        korai_semaforo: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404, headers });
    }

    const COLORES = ['verde', 'amarillo', 'rojo'];
    const DIMS = ['empleo', 'educacion', 'ingresos', 'salud', 'vivienda', 'red'];

    // Merge: no pisamos datos anteriores, solo actualizamos las dimensiones que llegan
    const semaforoActual = (usuario.korai_semaforo as Record<string, unknown>) ?? {};
    const semaforoNuevo: Record<string, unknown> = { ...semaforoActual };

    for (const dim of DIMS) {
      if (semaforo[dim] && COLORES.includes(semaforo[dim])) {
        semaforoNuevo[dim] = semaforo[dim];
      }
    }
    // Campos sociodemográficos opcionales del diagnóstico
    if (situacion_laboral) semaforoNuevo.situacion_laboral = situacion_laboral;
    if (ingreso_hogar)     semaforoNuevo.ingreso_hogar     = ingreso_hogar;
    if (tipo_vivienda)     semaforoNuevo.tipo_vivienda     = tipo_vivienda;
    if (barrio)            semaforoNuevo.barrio            = barrio;
    if (motivo)            semaforoNuevo.motivo            = motivo;

    semaforoNuevo.ultima_actualizacion = new Date().toISOString();
    semaforoNuevo.fuente = 'korai_survey';

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { korai_semaforo: semaforoNuevo },
    });

    // Si tiene WhatsApp activo, enviar mensaje con el resultado
    if (usuario.whatsapp_activo && process.env.SUPABASE_FUNCTIONS_URL) {
      const primer_nombre = usuario.nombre_completo.split(' ')[0];

      const dimRojas = DIMS.filter(d => semaforoNuevo[d] === 'rojo');
      const dimAmarillas = DIMS.filter(d => semaforoNuevo[d] === 'amarillo');

      let mensaje = `¡Listo ${primer_nombre}! 🚦 Ya recibimos tu diagnóstico de Korai.\n\n`;

      if (dimRojas.length > 0) {
        mensaje += `Tus áreas prioritarias son: ${dimRojas.join(', ')}. Vamos a enfocarnos en esas.\n\n`;
      } else if (dimAmarillas.length > 0) {
        mensaje += `Tu situación está encaminada. Hay algunas áreas para mejorar: ${dimAmarillas.join(', ')}.\n\n`;
      } else {
        mensaje += `¡Tu diagnóstico está en verde en todas las dimensiones! 🌟\n\n`;
      }

      mensaje += `Entrá a tu perfil para ver el detalle y las oportunidades recomendadas:\n🔗 ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://oportunai.korai.lat'}/dashboard`;

      await fetch(`${process.env.SUPABASE_FUNCTIONS_URL}/send_whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
        },
        body: JSON.stringify({
          telefono:   usuario.telefono,
          mensaje,
          usuario_id: usuario.id,
        }),
      }).catch(err => console.error('[semaforo-resultado] Error WA:', err));
    }

    return NextResponse.json({
      ok: true,
      whatsapp_activo: usuario.whatsapp_activo,
    }, { headers });

  } catch (error) {
    console.error('[semaforo-resultado]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500, headers });
  }
}

/**
 * POST /api/korai/reenganche
 *
 * Cron endpoint — evalúa qué usuarios necesitan re-engagement y envía push notifications.
 * Debe ser llamado periódicamente (ej: cada hora) por Supabase cron o un scheduler externo.
 *
 * Autenticación: Bearer CRON_SECRET
 *
 * Prioridad de push:
 *   1. Acción pendiente con proximo_seguimiento vencido
 *   2. Continuidad (hay un próximo paso definido y venció el seguimiento)
 *   3. Re-diagnóstico (última interacción > 45 días)
 *   4. Sin diagnóstico Korai (usuarios con korai_opt_in pero sin semáforo)
 *
 * Regla de frecuencia: mínimo 48hs entre pushes al mismo usuario.
 * Si no hay motivo concreto → no se envía nada.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enviarPush, type PushPayload, type TipoPush } from '@/lib/push';
import Anthropic from '@anthropic-ai/sdk';

const CRON_SECRET = process.env.CRON_SECRET ?? '';
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oportunai.com.ar';

const anthropic = new Anthropic();

function autenticado(req: NextRequest): boolean {
  if (!CRON_SECRET) return false;
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${CRON_SECRET}`;
}

// ── Genera el contenido del push con Claude ───────────────────────────────────

async function generarPushPayload(
  nombre: string,
  tipo: TipoPush,
  contexto: {
    accion_pendiente?: string;
    proximo_paso?: string;
    situacion_actual?: string;
    dias_sin_contacto?: number;
  },
): Promise<{ title: string; body: string }> {
  const tipoDesc: Record<TipoPush, string> = {
    accion_pendiente:  'la persona tiene una acción pendiente concreta',
    continuidad:       'quedó un próximo paso acordado y hay que retomar',
    nueva_oportunidad: 'hay una nueva oportunidad disponible',
    seguimiento:       'hay que hacer seguimiento de la situación',
    cambio_situacion:  'la situación puede haber cambiado',
    re_diagnostico:    'pasó tiempo desde el último diagnóstico',
  };

  const prompt = `Generá una notificación push para "${nombre}" en el contexto de acompañamiento de inserción laboral.

Tipo de reenganche: ${tipo} — ${tipoDesc[tipo]}
${contexto.accion_pendiente  ? `Acción pendiente: "${contexto.accion_pendiente}"` : ''}
${contexto.proximo_paso      ? `Próximo paso: "${contexto.proximo_paso}"` : ''}
${contexto.situacion_actual  ? `Situación: "${contexto.situacion_actual}"` : ''}
${contexto.dias_sin_contacto ? `Días sin contacto: ${contexto.dias_sin_contacto}` : ''}

Reglas:
- El título debe ser corto (máx 6 palabras), concreto, NO genérico.
- El cuerpo debe tener 1-2 oraciones, en español rioplatense, cálido, con motivo real.
- NUNCA usar: "Hola, hace mucho que no hablamos", "Tenemos novedades", "Recordá ingresar".
- El motivo debe ser específico al contexto dado.
- Usá "nosotros" natural: "Quedamos en...", "Estuvimos viendo...", "¿Pudiste avanzar con...?"

Respondé SOLO con JSON: {"title": "...", "body": "..."}`;

  const msg = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages:   [{ role: 'user', content: prompt }],
  });

  const text = (msg.content[0] as { type: string; text: string }).text.trim();
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return { title: parsed.title ?? 'Korai', body: parsed.body ?? '' };
  } catch {
    return { title: 'Korai', body: text.slice(0, 120) };
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!autenticado(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ahora    = new Date();
  const hace48hs = new Date(ahora.getTime() - 48 * 60 * 60 * 1000);
  const hace45d  = new Date(ahora.getTime() - 45 * 24 * 60 * 60 * 1000);

  // Usuarios con push habilitado, opt-in y suscripciones activas
  const candidatos = await prisma.usuario.findMany({
    where: {
      korai_opt_in: true,
      push_suscripciones: { some: {} },
    },
    select: {
      id:              true,
      nombre_completo: true,
      korai_semaforo:  true,
      push_suscripciones: { select: { id: true, endpoint: true, p256dh: true, auth: true } },
      korai_acompanamiento: {
        select: {
          situacion_actual:    true,
          acciones_pendientes: true,
          proximo_paso:        true,
          ultima_interaccion:  true,
          proximo_seguimiento: true,
        },
      },
    },
  });

  const resultados = { enviados: 0, omitidos: 0, errores: 0 };

  type EstadoRow = {
    situacion_actual:    string | null;
    acciones_pendientes: unknown;
    proximo_paso:        string | null;
    ultima_interaccion:  Date | null;
    proximo_seguimiento: Date | null;
  } | null;

  for (const u of candidatos) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const estado = u.korai_acompanamiento as EstadoRow;

    // Respetar mínimo 48hs entre pushes
    if (estado?.ultima_interaccion && estado.ultima_interaccion > hace48hs) {
      resultados.omitidos++;
      continue;
    }

    // Determinar tipo y motivo del push
    let tipo: TipoPush | null = null;
    let urlDestino = '/dashboard?korai=1';
    const accionesPendientes = (estado?.acciones_pendientes as Array<{ descripcion: string; contexto?: string }> | null) ?? [];
    const diasSinContacto = estado?.ultima_interaccion
      ? Math.floor((ahora.getTime() - estado.ultima_interaccion.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Prioridad 1: acción pendiente con seguimiento vencido
    if (
      accionesPendientes.length > 0 &&
      estado?.proximo_seguimiento &&
      estado.proximo_seguimiento <= ahora
    ) {
      tipo = 'accion_pendiente';
      urlDestino = '/dashboard?korai=accion';
    }
    // Prioridad 2: continuidad — hay próximo paso y venció el seguimiento
    else if (estado?.proximo_paso && estado.proximo_seguimiento && estado.proximo_seguimiento <= ahora) {
      tipo = 'continuidad';
      urlDestino = '/dashboard?korai=continuidad';
    }
    // Prioridad 3: re-diagnóstico — más de 45 días sin contacto
    else if (diasSinContacto !== null && diasSinContacto >= 45) {
      tipo = 're_diagnostico';
      urlDestino = '/dashboard?korai=rediagnostico';
    }
    // Prioridad 4: sin diagnóstico Korai
    else if (!u.korai_semaforo) {
      tipo = 'seguimiento';
      urlDestino = '/api/korai/redirect';
    }

    if (!tipo) {
      resultados.omitidos++;
      continue;
    }

    // Generar contenido específico con Claude
    let pushContent: { title: string; body: string };
    try {
      pushContent = await generarPushPayload(
        u.nombre_completo.split(' ')[0], // primer nombre
        tipo,
        {
          accion_pendiente: accionesPendientes[0]?.descripcion,
          proximo_paso:     estado?.proximo_paso ?? undefined,
          situacion_actual: estado?.situacion_actual ?? undefined,
          dias_sin_contacto: diasSinContacto ?? undefined,
        },
      );
    } catch {
      resultados.errores++;
      continue;
    }

    const payload: PushPayload = {
      ...pushContent,
      url:  `${APP_URL}${urlDestino}`,
      tipo,
    };

    // Enviar a todas las suscripciones del usuario
    const endpointsExpirados: string[] = [];
    for (const sub of u.push_suscripciones) {
      try {
        const enviado = await enviarPush(sub, payload);
        if (!enviado) endpointsExpirados.push(sub.endpoint);
        else resultados.enviados++;
      } catch {
        resultados.errores++;
      }
    }

    // Limpiar suscripciones expiradas
    if (endpointsExpirados.length > 0) {
      await prisma.pushSuscripcion.deleteMany({
        where: { endpoint: { in: endpointsExpirados } },
      });
    }

    // Actualizar ultima_interaccion para respetar la regla de 48hs
    if (estado) {
      await prisma.koraiAcompanamiento.update({
        where: { usuario_id: u.id },
        data:  { ultima_interaccion: ahora },
      });
    }
  }

  return NextResponse.json({ ok: true, candidatos: candidatos.length, ...resultados });
}

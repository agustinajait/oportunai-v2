/**
 * GET  /api/korai/acompanamiento?usuario_id=XXX  — estado de acompañamiento (interno, bot)
 * PATCH /api/korai/acompanamiento                — actualiza estado post-conversación (interno, bot)
 *
 * Autenticación: header x-bot-key = BOT_INTERNAL_KEY
 * (mismo mecanismo que /api/bot/semaforo existente)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BOT_KEY = process.env.BOT_INTERNAL_KEY ?? '';

function autenticado(req: NextRequest): boolean {
  if (!BOT_KEY) return false;
  return req.headers.get('x-bot-key') === BOT_KEY;
}

// ── GET — leer estado ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!autenticado(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  if (!usuario_id) return NextResponse.json({ error: 'Falta usuario_id' }, { status: 400 });

  const estado = await prisma.koraiAcompanamiento.findUnique({
    where: { usuario_id },
  });

  return NextResponse.json({ estado: estado ?? null });
}

// ── PATCH — actualizar estado ─────────────────────────────────────────────────

export interface ActualizarEstadoBody {
  usuario_id:           string;
  situacion_actual?:    string;
  prioridades?:         string[];
  objetivos?:           string[];
  acciones_pendientes?: Array<{ descripcion: string; contexto?: string; fecha_propuesta?: string }>;
  acciones_realizadas?: Array<{ descripcion: string; fecha: string; resultado?: string }>;
  proximo_paso?:        string;
  proximo_seguimiento_dias?: number; // días desde ahora para el próximo contacto
  // Si viene del diagnóstico, guardar snapshot
  semaforo_snapshot?:   Record<string, unknown>;
}

export async function PATCH(req: NextRequest) {
  if (!autenticado(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as ActualizarEstadoBody;
  const { usuario_id, proximo_seguimiento_dias, semaforo_snapshot, ...campos } = body;

  if (!usuario_id) return NextResponse.json({ error: 'Falta usuario_id' }, { status: 400 });

  const ahora = new Date();

  // Calcular proximo_seguimiento si se indicaron días
  let proximo_seguimiento: Date | undefined;
  if (typeof proximo_seguimiento_dias === 'number' && proximo_seguimiento_dias > 0) {
    proximo_seguimiento = new Date(ahora.getTime() + proximo_seguimiento_dias * 24 * 60 * 60 * 1000);
  }

  // Si hay snapshot de semáforo, rotar el actual al historial
  let diagnosticoUpdate: { ultimo_diagnostico?: unknown; diagnostico_anterior?: unknown } = {};
  if (semaforo_snapshot) {
    const actual = await prisma.koraiAcompanamiento.findUnique({
      where: { usuario_id },
      select: { ultimo_diagnostico: true },
    });
    diagnosticoUpdate = {
      diagnostico_anterior: actual?.ultimo_diagnostico ?? undefined,
      ultimo_diagnostico:   semaforo_snapshot,
    };
  }

  const data = {
    ...(campos.situacion_actual    !== undefined && { situacion_actual:    campos.situacion_actual }),
    ...(campos.prioridades         !== undefined && { prioridades:         campos.prioridades }),
    ...(campos.objetivos           !== undefined && { objetivos:           campos.objetivos }),
    ...(campos.acciones_pendientes !== undefined && { acciones_pendientes: campos.acciones_pendientes }),
    ...(campos.acciones_realizadas !== undefined && { acciones_realizadas: campos.acciones_realizadas }),
    ...(campos.proximo_paso        !== undefined && { proximo_paso:        campos.proximo_paso }),
    ...(proximo_seguimiento                      && { proximo_seguimiento }),
    ...diagnosticoUpdate,
    ultima_interaccion: ahora,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataAny = data as any;
  const estado = await prisma.koraiAcompanamiento.upsert({
    where:  { usuario_id },
    create: { usuario_id, ...dataAny },
    update: dataAny,
  });

  return NextResponse.json({ ok: true, estado });
}

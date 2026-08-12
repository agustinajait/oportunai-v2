/**
 * PATCH /api/bot/semaforo
 * El bot de WhatsApp actualiza el semáforo del usuario según lo que aprendió en conversación.
 * Solo accesible con BOT_INTERNAL_KEY (secret compartido con la Edge Function).
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BOT_INTERNAL_KEY = process.env.BOT_INTERNAL_KEY ?? '';

type SemaforoColor = 'verde' | 'amarillo' | 'rojo';

interface SemaforoUpdate {
  usuario_id: string;
  dimension: 'empleo' | 'educacion' | 'ingresos' | 'salud' | 'vivienda' | 'red';
  valor: SemaforoColor;
  fuente?: string; // 'bot_conversacion' | 'korai' | 'admin'
}

export async function PATCH(req: NextRequest) {
  try {
    const botKey = req.headers.get('x-bot-key') ?? '';
    if (!BOT_INTERNAL_KEY || botKey !== BOT_INTERNAL_KEY) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json() as SemaforoUpdate;
    const { usuario_id, dimension, valor, fuente } = body;

    if (!usuario_id || !dimension || !valor) {
      return NextResponse.json({ error: 'usuario_id, dimension y valor son requeridos' }, { status: 400 });
    }

    const DIMENSIONES_VALIDAS = ['empleo', 'educacion', 'ingresos', 'salud', 'vivienda', 'red'];
    const COLORES_VALIDOS = ['verde', 'amarillo', 'rojo'];

    if (!DIMENSIONES_VALIDAS.includes(dimension) || !COLORES_VALIDOS.includes(valor)) {
      return NextResponse.json({ error: 'dimension o valor inválidos' }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuario_id },
      select: { id: true, korai_semaforo: true },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const semaforoActual = (usuario.korai_semaforo as Record<string, unknown>) ?? {};

    const nuevoSemaforo = {
      ...semaforoActual,
      [dimension]: valor,
      ultima_actualizacion: new Date().toISOString(),
      fuente_ultima: fuente ?? 'bot_conversacion',
    };

    await prisma.usuario.update({
      where: { id: usuario_id },
      data: { korai_semaforo: nuevoSemaforo as object },
    });

    return NextResponse.json({ ok: true, semaforo: nuevoSemaforo });
  } catch (error) {
    console.error('[bot/semaforo]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

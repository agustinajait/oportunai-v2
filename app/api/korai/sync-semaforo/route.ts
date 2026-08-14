/**
 * POST /api/korai/sync-semaforo
 * Permite al candidato logueado cargar manualmente su resultado de Korai.
 * Se usa cuando el usuario hizo el test en Korai sin pasar por el magic link
 * (y por lo tanto Korai no pudo llamar automáticamente a semaforo-resultado).
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const COLORES = ['verde', 'amarillo', 'rojo'];
const DIMS = ['empleo', 'educacion', 'ingresos', 'salud', 'vivienda', 'red'];

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role === 'empleador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { semaforo } = await req.json();

    if (!semaforo || typeof semaforo !== 'object') {
      return NextResponse.json({ error: 'semaforo requerido' }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { korai_semaforo: true },
    });

    const semaforoActual = (usuario?.korai_semaforo as Record<string, unknown>) ?? {};
    const semaforoNuevo: Record<string, unknown> = { ...semaforoActual };

    for (const dim of DIMS) {
      if (semaforo[dim] && COLORES.includes(semaforo[dim])) {
        semaforoNuevo[dim] = semaforo[dim];
      }
    }
    semaforoNuevo.ultima_actualizacion = new Date().toISOString();
    semaforoNuevo.fuente = 'korai_survey';

    await prisma.usuario.update({
      where: { id: session.userId },
      data: { korai_semaforo: semaforoNuevo },
    });

    return NextResponse.json({ ok: true, semaforo: semaforoNuevo });
  } catch (error) {
    console.error('[sync-semaforo]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

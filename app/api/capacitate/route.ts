/**
 * GET /api/capacitate
 * Lista todas las capacitaciones activas con el progreso del usuario autenticado.
 * Agrupa por categoría. No requiere auth (sin sesión, progreso = null).
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  const [contenidos, progresos] = await Promise.all([
    prisma.capacitateContenido.findMany({
      where:   { activa: true },
      orderBy: [{ categoria: 'asc' }, { orden: 'asc' }],
      select: {
        id: true, slug: true, titulo: true, categoria: true,
        descripcion: true, nivel: true, duracion_min: true,
        objetivo: true, competencias: true, icono: true, orden: true,
        _count: { select: { modulos: true } },
      },
    }),
    session
      ? prisma.capacitateProgreso.findMany({
          where:  { usuario_id: session.userId },
          select: {
            contenido_id: true, estado: true, modulo_actual: true,
            puntaje_final: true, competencias_ok: true, aprobada_en: true,
          },
        })
      : [],
  ]);

  const progresoMap = Object.fromEntries(
    progresos.map(p => [p.contenido_id, p])
  );

  const data = contenidos.map(c => ({
    ...c,
    total_modulos: c._count.modulos,
    progreso: progresoMap[c.id] ?? null,
  }));

  return NextResponse.json({ contenidos: data });
}

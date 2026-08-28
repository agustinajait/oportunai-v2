/**
 * GET /api/capacitate/[slug]
 * Detalle completo de una capacitación (contenido + módulos + progreso del usuario).
 * Los módulos se devuelven SIN las respuestas correctas embebidas
 * (se validan server-side en /responder).
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getSessionFromRequest(req);

  const contenido = await prisma.capacitateContenido.findUnique({
    where: { slug: params.slug, activa: true },
    include: {
      modulos: {
        orderBy: { orden: 'asc' },
        select: {
          id: true, orden: true, titulo: true, tipo: true,
          es_desafio_final: true,
          // Nunca exponer respuesta_correcta al cliente
          contenido: true,
        },
      },
    },
  });

  if (!contenido) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  }

  // Remover respuestas correctas de los módulos antes de enviar al cliente
  const modulosSeguros = contenido.modulos.map(m => {
    const c = m.contenido as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { respuesta_correcta, competencias_criticas, ...restoContenido } = c;
    // Para desafio_final también limpiar respuestas de cada tarea
    if (m.tipo === 'desafio_final' && Array.isArray(restoContenido.tareas)) {
      restoContenido.tareas = (restoContenido.tareas as Array<Record<string, unknown>>).map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ respuesta_correcta: _rc, ...resto }) => resto
      );
    }
    return { ...m, contenido: restoContenido };
  });

  const progreso = session
    ? await prisma.capacitateProgreso.findUnique({
        where: {
          usuario_id_contenido_id: {
            usuario_id:   session.userId,
            contenido_id: contenido.id,
          },
        },
      })
    : null;

  return NextResponse.json({
    contenido: { ...contenido, modulos: modulosSeguros },
    progreso,
  });
}

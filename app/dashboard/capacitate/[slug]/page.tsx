export const dynamic = 'force-dynamic';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CapacitatePlayer from './CapacitatePlayer';

export default async function CapacitateDetallePagee({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const contenido = await prisma.capacitateContenido.findUnique({
    where: { slug: params.slug, activa: true },
    include: {
      modulos: { orderBy: { orden: 'asc' } },
    },
  });
  if (!contenido) notFound();

  const progreso = await prisma.capacitateProgreso.findUnique({
    where: {
      usuario_id_contenido_id: {
        usuario_id:   session.userId,
        contenido_id: contenido.id,
      },
    },
  });

  // Remover respuestas correctas antes de enviar al cliente
  const modulosSeguros = contenido.modulos.map(m => {
    const c = { ...(m.contenido as Record<string, unknown>) };
    delete c.respuesta_correcta;
    delete c.competencias_criticas;
    if (Array.isArray(c.tareas)) {
      c.tareas = (c.tareas as Array<Record<string, unknown>>).map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ respuesta_correcta: _rc, ...resto }) => resto
      );
    }
    return { ...m, contenido: c };
  });

  return (
    <CapacitatePlayer
      contenido={{
        id:           contenido.id,
        slug:         contenido.slug,
        titulo:       contenido.titulo,
        descripcion:  contenido.descripcion,
        nivel:        contenido.nivel,
        duracion_min: contenido.duracion_min,
        objetivo:     contenido.objetivo,
        competencias: contenido.competencias as string[],
        icono:        contenido.icono ?? '📚',
      }}
      modulos={modulosSeguros.map(m => ({
        id:               m.id,
        orden:            m.orden,
        titulo:           m.titulo,
        tipo:             m.tipo as 'lectura' | 'pregunta' | 'situacion' | 'actividad' | 'desafio_final',
        contenido:        m.contenido as Record<string, unknown>,
        es_desafio_final: m.es_desafio_final,
      }))}
      progresoInicial={{
        modulo_actual: progreso?.modulo_actual ?? 0,
        estado:        (progreso?.estado ?? 'no_iniciada') as 'no_iniciada' | 'en_progreso' | 'completada' | 'aprobada',
        respuestas:    (progreso?.respuestas as Record<string, unknown>) ?? {},
        puntaje_final: progreso?.puntaje_final ?? null,
      }}
    />
  );
}

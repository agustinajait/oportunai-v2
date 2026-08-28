/**
 * POST /api/capacitate/[slug]/completar
 *
 * Cierra la capacitación: calcula el puntaje final, determina si aprueba,
 * lista las competencias demostradas, y registra estrella en el perfil.
 *
 * Body: { respuestas_desafio?: { [tarea_idx]: number } }
 * Returns: { aprobada, puntaje, competencias_ok, competencias_faltantes, mensaje }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json() as {
    respuestas_desafio?: Record<string, number>;
  };

  const contenido = await prisma.capacitateContenido.findUnique({
    where: { slug: params.slug },
    include: { modulos: { orderBy: { orden: 'asc' } } },
  });
  if (!contenido) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const progreso = await prisma.capacitateProgreso.findUnique({
    where: {
      usuario_id_contenido_id: {
        usuario_id:   session.userId,
        contenido_id: contenido.id,
      },
    },
  });
  if (!progreso) return NextResponse.json({ error: 'Sin progreso iniciado' }, { status: 400 });

  const respuestasGuardadas = (progreso.respuestas as Record<string, {
    correcta: boolean; puntaje: number;
  }>) ?? {};

  // ── Calcular puntaje ──────────────────────────────────────────────────────
  // Módulos evaluables (preguntas + situaciones + tareas del desafío)
  let puntajeTotal  = 0;
  let puntajeMax    = 0;
  const competenciasOk   = new Set<string>();
  const competenciasFalt = new Set<string>();

  for (const modulo of contenido.modulos) {
    const c = modulo.contenido as Record<string, unknown>;

    if (modulo.tipo === 'pregunta' || modulo.tipo === 'situacion') {
      puntajeMax += 100;
      const resp = respuestasGuardadas[modulo.orden];
      if (resp?.correcta) {
        puntajeTotal += 100;
        if (c.competencia) competenciasOk.add(c.competencia as string);
      } else {
        if (c.competencia) competenciasFalt.add(c.competencia as string);
      }
    }

    if (modulo.tipo === 'desafio_final' && Array.isArray(c.tareas)) {
      const tareas = c.tareas as Array<{
        respuesta_correcta: number;
        competencia: string;
        peso: number;
      }>;
      const respDesafio = body.respuestas_desafio ?? {};

      for (let i = 0; i < tareas.length; i++) {
        const tarea = tareas[i];
        puntajeMax += tarea.peso ?? 10;
        if (Number(respDesafio[i]) === tarea.respuesta_correcta) {
          puntajeTotal += tarea.peso ?? 10;
          if (tarea.competencia) competenciasOk.add(tarea.competencia);
        } else {
          if (tarea.competencia) competenciasFalt.add(tarea.competencia);
        }
      }
    }
  }

  // Puntaje 0-100
  const puntaje = puntajeMax > 0 ? Math.round((puntajeTotal / puntajeMax) * 100) : 100;

  // ── Determinar aprobación ────────────────────────────────────────────────
  const PUNTAJE_MINIMO = 80;
  const desafioFinal   = contenido.modulos.find(m => m.tipo === 'desafio_final');
  const competenciasCriticas: string[] = desafioFinal
    ? ((desafioFinal.contenido as Record<string, unknown>).competencias_criticas as string[] ?? [])
    : [];

  const faltaCritica = competenciasCriticas.some(c => !competenciasOk.has(c));
  const aprobada     = puntaje >= PUNTAJE_MINIMO && !faltaCritica;

  // ── Guardar resultado ────────────────────────────────────────────────────
  const ahora = new Date();
  await prisma.capacitateProgreso.update({
    where: {
      usuario_id_contenido_id: {
        usuario_id:   session.userId,
        contenido_id: contenido.id,
      },
    },
    data: {
      estado:         aprobada ? 'aprobada' : 'completada',
      puntaje_final:  puntaje,
      competencias_ok: [...competenciasOk],
      completada_en:  ahora,
      aprobada_en:    aprobada ? ahora : null,
      intentos:       { increment: 1 },
      // Guardar también respuestas del desafío final si vinieron
      ...(body.respuestas_desafio && {
        respuestas: {
          ...(progreso.respuestas as object ?? {}),
          desafio_final: body.respuestas_desafio,
        },
      }),
    },
  });

  // ── Mensaje de feedback ──────────────────────────────────────────────────
  let mensaje: string;
  if (aprobada) {
    mensaje = `¡Capacitación aprobada con ${puntaje}%! Ya podés ver tu logro en el perfil.`;
  } else if (faltaCritica) {
    const faltantes = competenciasCriticas.filter(c => !competenciasOk.has(c));
    mensaje = `Casi. Necesitás reforzar: ${faltantes.join(', ')}. Volvé a practicar esa parte.`;
  } else {
    mensaje = `Obtuviste ${puntaje}%. Necesitás 80% para aprobar. ¡Volvé a intentarlo!`;
  }

  return NextResponse.json({
    aprobada,
    puntaje,
    competencias_ok:       [...competenciasOk],
    competencias_faltantes: [...competenciasFalt],
    mensaje,
  });
}

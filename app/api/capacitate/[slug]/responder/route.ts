/**
 * POST /api/capacitate/[slug]/responder
 *
 * Valida la respuesta de un módulo (pregunta, situación, o tarea del desafío final).
 * La respuesta correcta NUNCA sale del servidor.
 * Guarda el progreso y avanza modulo_actual.
 *
 * Body: { modulo_orden: number, respuesta: number | string }
 * Returns: { correcta: boolean, feedback: string, puntaje_modulo: number }
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

  const { modulo_orden, respuesta } = await req.json() as {
    modulo_orden: number;
    respuesta:    number | string;
  };

  // Cargar módulo completo (con respuesta correcta — solo server side)
  const contenido = await prisma.capacitateContenido.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      modulos: {
        where:   { orden: modulo_orden },
        select:  { id: true, tipo: true, contenido: true, orden: true },
      },
    },
  });

  if (!contenido || contenido.modulos.length === 0) {
    return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
  }

  const modulo = contenido.modulos[0];
  const c = modulo.contenido as Record<string, unknown>;

  let correcta       = false;
  let feedback       = '';
  let puntaje_modulo = 0;

  if (modulo.tipo === 'pregunta' || modulo.tipo === 'situacion') {
    const respuestaCorrecta = c.respuesta_correcta as number;
    correcta = Number(respuesta) === respuestaCorrecta;
    feedback = correcta
      ? (c.feedback_correcto as string)
      : (c.feedback_incorrecto as string);
    puntaje_modulo = correcta ? 100 : 0;
  } else if (modulo.tipo === 'lectura' || modulo.tipo === 'actividad') {
    // Módulos sin evaluación — siempre pasan
    correcta       = true;
    feedback       = '¡Bien! Continuá al siguiente paso.';
    puntaje_modulo = 100;
  }

  // Actualizar o crear progreso
  const progresoActual = await prisma.capacitateProgreso.findUnique({
    where: {
      usuario_id_contenido_id: {
        usuario_id:   session.userId,
        contenido_id: contenido.id,
      },
    },
  });

  const respuestasActuales = (progresoActual?.respuestas as Record<string, unknown>) ?? {};
  const nuevasRespuestas   = {
    ...respuestasActuales,
    [modulo_orden]: {
      respuesta,
      correcta,
      puntaje: puntaje_modulo,
      timestamp: new Date().toISOString(),
    },
  };

  // Avanzar al siguiente módulo si respondió correctamente (o es lectura/actividad)
  const nuevoModuloActual = correcta
    ? Math.max(progresoActual?.modulo_actual ?? 0, modulo_orden + 1)
    : (progresoActual?.modulo_actual ?? 0);

  await prisma.capacitateProgreso.upsert({
    where: {
      usuario_id_contenido_id: {
        usuario_id:   session.userId,
        contenido_id: contenido.id,
      },
    },
    create: {
      usuario_id:    session.userId,
      contenido_id:  contenido.id,
      estado:        'en_progreso',
      modulo_actual: nuevoModuloActual,
      respuestas:    nuevasRespuestas,
      intentos:      1,
      iniciada_en:   new Date(),
    },
    update: {
      estado:        'en_progreso',
      modulo_actual: nuevoModuloActual,
      respuestas:    nuevasRespuestas,
    },
  });

  return NextResponse.json({ correcta, feedback, puntaje_modulo });
}

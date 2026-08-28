/**
 * POST /api/user/pre-diagnostico
 *
 * Guarda las respuestas del formulario pre-grabación (empleo, ingresos, educación)
 * como semáforo parcial en korai_semaforo. Korai lo recibe como semaforo_previo
 * y acorta el diagnóstico de 6 a ~3 preguntas.
 *
 * Requiere sesión activa.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type SemaforoColor = 'verde' | 'amarillo' | 'rojo';

interface PreDiagnosticoBody {
  semaforo: {
    empleo:    SemaforoColor;
    ingresos:  SemaforoColor;
    educacion: SemaforoColor;
  };
  respuestas: {
    empleo_situacion: string;
    ingresos_rango:   string;
    educacion_nivel:  string;
  };
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json() as PreDiagnosticoBody;

  if (!body.semaforo?.empleo || !body.semaforo?.ingresos || !body.semaforo?.educacion) {
    return NextResponse.json({ error: 'Faltan dimensiones' }, { status: 400 });
  }

  // Leer semáforo existente para no pisar dimensiones ya cargadas por Korai
  const usuario = await prisma.usuario.findUnique({
    where:  { id: session.userId },
    select: { korai_semaforo: true, cv_datos: true },
  });

  const semaforoActual = (usuario?.korai_semaforo as Record<string, unknown>) ?? {};
  const cvActual       = (usuario?.cv_datos       as Record<string, unknown>) ?? {};

  // Merge: las respuestas del pre-diagnóstico llenan solo las 3 dimensiones conocidas.
  // Si Korai ya cargó un valor más preciso (post diagnóstico completo), no lo pisamos.
  const semaforoMergeado = {
    empleo:    body.semaforo.empleo,
    ingresos:  body.semaforo.ingresos,
    educacion: body.semaforo.educacion,
    // Preservar lo que ya tenga Korai para las otras dimensiones
    ...(semaforoActual.salud     ? { salud:      semaforoActual.salud }     : {}),
    ...(semaforoActual.vivienda  ? { vivienda:   semaforoActual.vivienda }  : {}),
    ...(semaforoActual.red_social ? { red_social: semaforoActual.red_social } : {}),
  };

  await prisma.usuario.update({
    where: { id: session.userId },
    data: {
      korai_semaforo: semaforoMergeado,
      // Guardar también las respuestas textuales en cv_datos para historial
      cv_datos: {
        ...cvActual,
        pre_diagnostico: {
          empleo_situacion: body.respuestas.empleo_situacion,
          ingresos_rango:   body.respuestas.ingresos_rango,
          educacion_nivel:  body.respuestas.educacion_nivel,
          respondido_en:    new Date().toISOString(),
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}

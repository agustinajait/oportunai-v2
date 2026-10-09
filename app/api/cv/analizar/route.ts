/**
 * POST /api/cv/analizar
 * Analiza el CV del candidato. Cachea el resultado en cv_analisis.
 * ?forzar=true para ignorar el caché y regenerar.
 */
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { CvDatosInput } from '@/lib/cv-generator';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const forzar = searchParams.get('forzar') === 'true';

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { nombre_completo: true, cv_datos: true, cv_analisis: true, pagado: true },
  });
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  if (!usuario.pagado) {
    return NextResponse.json({ error: 'Se requiere plan premium', code: 'PAYMENT_REQUIRED' }, { status: 402 });
  }

  // Devolver caché si existe y no se forzó
  if (usuario.cv_analisis && !forzar) {
    return NextResponse.json({ analisis: usuario.cv_analisis, cached: true });
  }

  const cv = (usuario.cv_datos as CvDatosInput) ?? {};

  const resumen = [
    cv.resumen ? `Resumen: ${cv.resumen}` : 'Sin resumen profesional',
    `Experiencias: ${cv.experiencia?.length ?? 0}`,
    cv.experiencia?.map(e => `  - ${e.cargo} en ${e.empresa} (${e.periodo ?? 'sin fecha'}): ${e.descripcion ?? 'sin descripción'}`).join('\n') ?? '',
    `Educación: ${cv.educacion?.length ? cv.educacion.map(e => `${e.titulo} en ${e.institucion}`).join(', ') : cv.nivel_estudios ?? 'no especificada'}`,
    `Habilidades (${cv.habilidades?.length ?? 0}): ${cv.habilidades?.join(', ') ?? 'ninguna'}`,
    `Herramientas digitales (${cv.herramientas_digitales?.length ?? 0}): ${cv.herramientas_digitales?.join(', ') ?? 'ninguna'}`,
    `Idiomas: ${cv.idiomas?.join(', ') ?? 'no especificados'}`,
    `Localidad: ${cv.localidad ?? 'no especificada'}`,
    `Disponibilidad: ${cv.disponibilidad ?? 'no especificada'}`,
  ].filter(Boolean).join('\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Eres un experto en recursos humanos y optimización de CVs para el mercado laboral argentino. Analiza el siguiente CV y devuelve un diagnóstico en JSON.

CV de ${usuario.nombre_completo}:
${resumen}

Devuelve EXACTAMENTE este JSON (sin markdown, sin texto extra):
{
  "puntaje": <número del 0 al 100>,
  "nivel": <"bajo" | "medio" | "alto">,
  "resumen_rapido": "<1 oración sobre el perfil>",
  "faltan": ["<campo faltante>", ...],
  "fortalezas": ["<punto fuerte>", ...],
  "mejoras": [{"titulo": "<problema corto>", "consejo": "<acción concreta>"}, ...],
  "tip_ats": "<1 tip específico para pasar filtros ATS>"
}

Criterios:
- puntaje: basado en completitud (resumen, exp, edu, habilidades, contacto) y calidad del contenido
- nivel bajo = <40, medio = 40-70, alto = >70
- faltan: hasta 4 campos importantes que no están completados
- fortalezas: 2-3 puntos reales del perfil
- mejoras: 2-3 sugerencias accionables y específicas
- tip_ats: consejo concreto sobre palabras clave, formato o estructura`,
    }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  let analisis: Record<string, unknown>;
  try {
    analisis = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Error procesando análisis' }, { status: 500 });
  }

  // Guardar en caché
  await prisma.usuario.update({
    where: { id: session.userId },
    data: { cv_analisis: analisis as any },
  });

  return NextResponse.json({ analisis, cached: false });
}

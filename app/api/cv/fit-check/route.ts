/**
 * POST /api/cv/fit-check
 * Compara el perfil del candidato con una descripción de puesto.
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

  const { descripcion_puesto } = await req.json() as { descripcion_puesto: string };
  if (!descripcion_puesto?.trim()) {
    return NextResponse.json({ error: 'Falta descripción del puesto' }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { nombre_completo: true, cv_datos: true },
  });
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const cv = (usuario.cv_datos as CvDatosInput) ?? {};

  const perfilResumen = [
    cv.resumen ? `Resumen: ${cv.resumen}` : '',
    cv.experiencia?.length
      ? `Experiencia: ${cv.experiencia.map(e => `${e.cargo} en ${e.empresa}`).join(', ')}`
      : 'Sin experiencia registrada',
    cv.habilidades?.length ? `Habilidades: ${cv.habilidades.join(', ')}` : '',
    cv.herramientas_digitales?.length ? `Herramientas: ${cv.herramientas_digitales.join(', ')}` : '',
    cv.idiomas?.length ? `Idiomas: ${cv.idiomas.join(', ')}` : '',
    cv.nivel_estudios ? `Estudios: ${cv.nivel_estudios}` : '',
    cv.disponibilidad ? `Disponibilidad: ${cv.disponibilidad}` : '',
  ].filter(Boolean).join('\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Eres un experto en selección de personal del mercado laboral argentino. Compará el perfil del candidato con la oferta laboral y devuelve un análisis de compatibilidad en JSON.

PERFIL DEL CANDIDATO:
${perfilResumen}

OFERTA LABORAL:
${descripcion_puesto.substring(0, 3000)}

Devuelve EXACTAMENTE este JSON (sin markdown, sin texto extra):
{
  "match_score": <número del 0 al 100>,
  "nivel_match": <"bajo" | "medio" | "alto">,
  "resumen": "<1-2 oraciones sobre la compatibilidad>",
  "cumple": ["<requisito que cumple>", ...],
  "falta": ["<requisito que no cumple o falta fortalecer>", ...],
  "consejo_postulacion": "<1 consejo concreto para mejorar la postulación a este puesto específico>"
}

Criterios:
- match_score: qué tan bien encaja el perfil con lo pedido (0-100)
- nivel_match: bajo <40, medio 40-70, alto >70
- cumple: 2-4 puntos donde el candidato encaja con el puesto
- falta: 2-4 brechas reales entre el perfil y los requisitos del puesto
- consejo_postulacion: sugerencia práctica y específica`,
    }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  let resultado: Record<string, unknown>;
  try {
    resultado = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Error procesando análisis' }, { status: 500 });
  }

  return NextResponse.json({ resultado });
}

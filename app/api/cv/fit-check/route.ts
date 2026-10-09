/**
 * POST /api/cv/fit-check
 * Compara el perfil con una oferta y genera:
 *   - resultado: análisis de compatibilidad
 *   - cv_adaptado: cv_datos reescrito para esa oferta
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
  const oferta = descripcion_puesto.substring(0, 3000);

  const cvJson = JSON.stringify(cv);

  // Llamada 1: análisis de compatibilidad
  // Llamada 2: CV adaptado
  // Las lanzamos en paralelo para reducir latencia
  const [fitMsg, adaptMsg] = await Promise.all([
    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Eres un experto en selección de personal del mercado laboral argentino. Compará el perfil del candidato con la oferta laboral y devuelve un análisis de compatibilidad en JSON.

PERFIL:
${[
  cv.resumen ? `Resumen: ${cv.resumen}` : '',
  cv.experiencia?.length ? `Experiencia: ${cv.experiencia.map(e => `${e.cargo} en ${e.empresa}`).join(', ')}` : 'Sin experiencia registrada',
  cv.habilidades?.length ? `Habilidades: ${cv.habilidades.join(', ')}` : '',
  cv.herramientas_digitales?.length ? `Herramientas: ${cv.herramientas_digitales.join(', ')}` : '',
  cv.idiomas?.length ? `Idiomas: ${cv.idiomas.join(', ')}` : '',
  cv.nivel_estudios ? `Estudios: ${cv.nivel_estudios}` : '',
  cv.disponibilidad ? `Disponibilidad: ${cv.disponibilidad}` : '',
].filter(Boolean).join('\n')}

OFERTA:
${oferta}

Devuelve EXACTAMENTE este JSON (sin markdown):
{
  "match_score": <0-100>,
  "nivel_match": <"bajo"|"medio"|"alto">,
  "resumen": "<1-2 oraciones>",
  "cumple": ["<requisito cumplido>", ...],
  "falta": ["<brecha>", ...],
  "consejo_postulacion": "<consejo concreto>"
}`,
      }],
    }),

    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Eres un experto redactor de CVs para el mercado laboral argentino. Adaptá el siguiente CV para que destaque las habilidades y experiencias más relevantes para la oferta laboral.

CV ORIGINAL (JSON):
${cvJson}

OFERTA LABORAL:
${oferta}

Instrucciones:
- Reescribí el campo "resumen" para que destaque lo más relevante para este puesto (máx 3 oraciones, primera persona)
- Reorganizá "habilidades" poniendo primero las que más coinciden con la oferta; podés agregar hasta 3 habilidades relevantes que el candidato pueda tener implícitamente según su experiencia
- Reorganizá "herramientas_digitales" de la misma manera
- NO inventés experiencias ni títulos que no existen en el original
- Mantené todos los demás campos exactamente igual
- Devuelve EXACTAMENTE el mismo objeto JSON con los campos modificados (sin markdown, sin texto extra)`,
      }],
    }),
  ]);

  const rawFit = (fitMsg.content[0] as { type: string; text: string }).text.trim();
  const rawAdapt = (adaptMsg.content[0] as { type: string; text: string }).text.trim();

  let resultado: Record<string, unknown>;
  let cv_adaptado: CvDatosInput;

  try {
    resultado = JSON.parse(rawFit);
  } catch {
    return NextResponse.json({ error: 'Error procesando análisis' }, { status: 500 });
  }

  try {
    cv_adaptado = JSON.parse(rawAdapt);
  } catch {
    // Si falla el CV adaptado, igual devolvemos el análisis
    cv_adaptado = cv;
  }

  return NextResponse.json({ resultado, cv_adaptado });
}

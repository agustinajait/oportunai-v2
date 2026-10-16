/**
 * POST /api/cv/mejorar
 * Aplica las sugerencias del análisis al cv_datos del usuario.
 * Body: { mejoras: { titulo: string; consejo: string }[] }
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

  const { mejoras } = await req.json() as { mejoras: { titulo: string; consejo: string }[] };
  if (!mejoras?.length) return NextResponse.json({ error: 'Faltan mejoras' }, { status: 400 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { cv_datos: true },
  });
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const cv = (usuario.cv_datos as CvDatosInput) ?? {};
  const mejorasList = mejoras.map((m, i) => `${i + 1}. ${m.titulo}: ${m.consejo}`).join('\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Eres un experto en redacción de CVs para el mercado laboral argentino. Mejorá el siguiente CV aplicando exactamente las sugerencias indicadas.

CV ACTUAL (JSON):
${JSON.stringify(cv)}

MEJORAS A APLICAR:
${mejorasList}

Instrucciones:
- Aplicá cada mejora de forma concreta al contenido del CV
- Reescribí el "resumen" si hay sugerencias relacionadas (primera persona, máx 3 oraciones)
- Reorganizá o completá "habilidades" y "herramientas_digitales" según las sugerencias
- NO inventés experiencias, empresas, ni títulos educativos que no existen en el original
- Mantené todos los campos estructurales (experiencia, educacion, idiomas, etc.) igual, solo mejorá el texto y la organización
- Devuelve EXACTAMENTE el mismo objeto JSON con los campos mejorados (sin markdown, sin texto extra)`,
    }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let cvMejorado: CvDatosInput;
  try {
    cvMejorado = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Error procesando mejoras' }, { status: 500 });
  }

  await prisma.usuario.update({
    where: { id: session.userId },
    data: {
      cv_datos: cvMejorado as any,
      cv_analisis: null, // Invalidar caché de análisis
    },
  });

  return NextResponse.json({ ok: true, cv_datos: cvMejorado });
}

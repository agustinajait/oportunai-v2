export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(
  _req: NextRequest,
  { params }: { params: { videoId: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { videoId } = params;

  const video = await prisma.video.findUnique({
    where: { id: videoId, user_id: session.userId },
    select: { id: true, tipo: true, section_attempts: true, analisis_ia: true },
  });

  if (!video) return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 });

  if (video.analisis_ia) {
    return NextResponse.json({ analisis: video.analisis_ia });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { cv_datos: true },
  });
  const cvDatos     = usuario?.cv_datos as Record<string, unknown> | null;
  const areaLaboral = (cvDatos?.area_laboral as string) ?? null;
  const nombre      = (cvDatos?.nombre as string) ?? null;

  const sections = Array.isArray(video.section_attempts)
    ? (video.section_attempts as any[])
        .map(s => `- "${s.nombre}" (${s.intentos} intento${s.intentos > 1 ? 's' : ''})`)
        .join('\n')
    : '- Sección única (1 intento)';

  const tipoLabel = video.tipo === 'video_cv' ? 'Video CV' : 'Video Pitch';

  const prompt = `Sos un coach de comunicación y RR.HH. experto en el mercado laboral argentino.
Un candidato acaba de grabar su ${tipoLabel}. Analizá la estructura de grabación y generá feedback constructivo y práctico.

Datos del candidato:
- Nombre: ${nombre ?? 'No disponible'}
- Área laboral: ${areaLaboral ?? 'No especificada'}

Secciones grabadas:
${sections}

Interpretación: más intentos por sección pueden indicar dificultad para expresarse o perfeccionismo. Una sección con muchos intentos merece un consejo específico.

Reglas del buen Video CV para el mercado argentino:
- Duración total ideal: 60-90 segundos
- Mirar directamente a la cámara (no leer)
- Fondo limpio, buena iluminación, audio claro
- Introducción: nombre + rol + propuesta de valor en 15 segundos
- Para ${areaLaboral ?? 'cualquier área'}: mencionar habilidades y logros concretos del rubro

Respondé SOLO con un JSON válido, sin markdown ni texto adicional:
{
  "puntaje": <número 1-5>,
  "titulo": "<frase de evaluación en 4-6 palabras>",
  "fortalezas": ["<punto positivo 1>", "<punto positivo 2>"],
  "mejoras": [
    { "titulo": "<nombre corto>", "consejo": "<consejo específico y accionable en 1-2 oraciones>" },
    { "titulo": "<nombre corto>", "consejo": "<consejo específico y accionable en 1-2 oraciones>" }
  ],
  "tip_estrella": "<el consejo más importante, en 1-2 oraciones directas y motivadoras>"
}

Incluí exactamente 2 fortalezas y 2-3 mejoras. Usá tuteo informal argentino (vos/tuyo).`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw  = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}';
    const analisis = JSON.parse(raw);

    await prisma.video.update({
      where: { id: videoId },
      data:  { analisis_ia: analisis },
    });

    return NextResponse.json({ analisis });
  } catch (err: any) {
    console.error('[videos/analisis]', err);
    return NextResponse.json({ error: 'No se pudo generar el análisis' }, { status: 500 });
  }
}

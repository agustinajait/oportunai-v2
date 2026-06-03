export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const u = await prisma.usuario.findUnique({ where: { id: session.userId }, select: { cv_datos: true } });
  return NextResponse.json({ cv_datos: u?.cv_datos ?? null });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.userId },
      include: {
        archivos: {
          where: { file_type: { in: ['pdf', 'PDF'] } },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    const archivo = usuario?.archivos[0];
    if (!archivo) {
      return NextResponse.json({ error: 'No tenés un CV en PDF subido. Subí tu CV primero.' }, { status: 400 });
    }

    const fileRes = await fetch(archivo.file_url);
    if (!fileRes.ok) throw new Error('No se pudo descargar el archivo');
    const buffer = await fileRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const message = await (anthropic.beta.messages as any).create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      betas: ['pdfs-2024-09-25'],
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          {
            type: 'text',
            text: `Extraé la información de este CV y devolvé ÚNICAMENTE un JSON válido con esta estructura exacta (sin texto adicional, sin markdown):
{
  "resumen": "resumen profesional de 2-3 oraciones",
  "experiencia": [{"empresa": "nombre empresa", "cargo": "puesto", "periodo": "ej: 2020-2023", "descripcion": "descripción breve"}],
  "educacion": [{"institucion": "nombre institución", "titulo": "título o carrera", "periodo": "ej: 2015-2020"}],
  "habilidades": ["habilidad1", "habilidad2"],
  "idiomas": ["Español", "Inglés"]
}`,
          },
        ],
      }],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('La IA no pudo extraer el CV correctamente');

    const cvDatos = JSON.parse(jsonMatch[0]);

    await prisma.usuario.update({
      where: { id: session.userId },
      data: { cv_datos: cvDatos },
    });

    return NextResponse.json({ ok: true, cv_datos: cvDatos });
  } catch (err: any) {
    console.error('[user/cv]', err);
    return NextResponse.json({ error: err.message ?? 'Error al analizar el CV' }, { status: 500 });
  }
}

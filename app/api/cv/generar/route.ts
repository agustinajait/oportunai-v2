/**
 * POST /api/cv/generar
 * Toma texto libre del usuario (sin estructura) y genera cv_datos completo con IA.
 * Guarda el resultado en cv_datos y borra el cache de cv_analisis.
 */
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { texto_libre } = await req.json() as { texto_libre: string };
  if (!texto_libre?.trim() || texto_libre.trim().length < 20) {
    return NextResponse.json({ error: 'Contanos un poco más sobre vos' }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { nombre_completo: true, cv_datos: true },
  });
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const cvActual = (usuario.cv_datos as Record<string, unknown>) ?? {};

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Sos un experto en recursos humanos argentino. Un usuario te va a contar en sus propias palabras sobre su experiencia laboral, estudios y habilidades — sin estructura, tal como le sale. Tu trabajo es convertir eso en un CV profesional estructurado.

NOMBRE: ${usuario.nombre_completo}

LO QUE CONTÓ EL USUARIO:
${texto_libre.substring(0, 3000)}

Generá un JSON con esta estructura exacta (sin markdown, sin texto extra):
{
  "resumen": "<2-3 oraciones profesionales en primera persona que describan su perfil. Si no hay suficiente info, generá algo genérico pero positivo basado en lo que contó>",
  "experiencia": [
    {
      "cargo": "<puesto o rol, inferilo si no lo dijo explícitamente>",
      "empresa": "<nombre de empresa o lugar, o 'Emprendimiento propio' / 'Trabajo informal' si corresponde>",
      "periodo": "<fechas aproximadas si las mencionó, si no dejá vacío>",
      "descripcion": "<qué hacía, en 1-2 líneas>"
    }
  ],
  "educacion": [
    {
      "titulo": "<nivel o título>",
      "institucion": "<nombre del colegio/instituto/universidad si lo mencionó, si no: 'No especificada'>",
      "periodo": "<año o período si lo mencionó>"
    }
  ],
  "habilidades": ["<habilidad concreta>", ...],
  "herramientas_digitales": ["<herramienta o app>", ...],
  "idiomas": ["<idioma nivel si lo mencionó>"],
  "nivel_estudios": "<nivel más alto: Primario / Secundario / Terciario / Universitario / Posgrado>",
  "area_laboral": "<área principal de trabajo en 2-3 palabras>"
}

Reglas importantes:
- Si no mencionó experiencia formal, poné trabajos informales, changas, cuidado de personas, limpieza, construcción, etc. como experiencia válida
- Inferí habilidades razonables de lo que contó (ej: si cuidó personas → "Cuidado de adultos mayores", "Primeros auxilios básicos")
- Si solo hay estudios primarios o secundarios, es válido — ponélo sin vergüenza
- Nunca inventés datos concretos que no mencionó (nombres de empresas, títulos específicos)
- El array experiencia puede estar vacío [] si no mencionó nada laboral
- El array habilidades debe tener AL MENOS 3 items inferidos del contexto`,
    }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  let cvGenerado: Record<string, unknown>;
  try {
    cvGenerado = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Error generando el CV. Intentá de nuevo.' }, { status: 500 });
  }

  // Merge con datos existentes para no pisar campos ya cargados (ej: localidad, disponibilidad)
  const cvFinal = {
    ...cvActual,
    ...cvGenerado,
    // Preservar localidad y disponibilidad si ya existen
    ...(cvActual.localidad    ? { localidad:     cvActual.localidad }    : {}),
    ...(cvActual.disponibilidad ? { disponibilidad: cvActual.disponibilidad } : {}),
  };

  await prisma.usuario.update({
    where: { id: session.userId },
    data: {
      cv_datos:   cvFinal as any,
      cv_analisis: null, // invalida el cache del analizador
    },
  });

  return NextResponse.json({ cv_datos: cvFinal });
}

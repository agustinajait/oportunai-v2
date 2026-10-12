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
      content: `Sos un especialista en redacción de CVs para el mercado laboral argentino, con foco en que los CVs pasen filtros ATS (sistemas de seguimiento de candidatos) de empresas como Mercado Libre, Walmart, McDonald's, Carrefour, y demás empleadores masivos.

Tu tarea: convertir lo que contó el usuario en texto libre en un CV estructurado, con lenguaje concreto y palabras clave que los ATS reconozcan.

NOMBRE: ${usuario.nombre_completo}

LO QUE CONTÓ EL USUARIO:
${texto_libre.substring(0, 3000)}

Generá un JSON con esta estructura exacta (sin markdown, sin texto extra, sin comillas especiales):
{
  "resumen": "<perfil profesional de 2-3 oraciones. REGLAS ESTRICTAS: (1) Empezá con el rol/sector concreto, ej: 'Vendedora con X años de experiencia en comercio minorista' o 'Operario de limpieza con experiencia en mantenimiento de espacios comerciales'. (2) Incluí 2-3 habilidades o tareas específicas del sector que los ATS buscan. (3) Cerrá con disponibilidad o zona si la mencionó. PROHIBIDO: frases genéricas como 'soy responsable', 'soy proactivo/a', 'me adapto fácilmente', 'busco crecer profesionalmente' — esas frases bajan el score ATS.>",
  "experiencia": [
    {
      "cargo": "<título estándar del puesto que los ATS reconocen, ej: 'Vendedor/a', 'Operario/a de limpieza', 'Repositor/a', 'Cajero/a', 'Cuidador/a de adultos mayores'>",
      "empresa": "<nombre real si lo mencionó, si no: tipo de lugar, ej: 'Comercio minorista', 'Domicilio particular', 'Empresa de construcción'>",
      "periodo": "<fechas si las mencionó, ej: '2020 – 2023', si no: ''>",
      "descripcion": "<2-3 tareas concretas con verbos de acción en pasado: 'Atendí clientes', 'Gestioné cobros en efectivo y con tarjeta', 'Realicé reposición de mercadería'. Sin 'Responsable de', sin infinitivos, sin gerundios.>"
    }
  ],
  "educacion": [
    {
      "titulo": "<nivel exacto: 'Primario completo', 'Secundario completo', 'Secundario incompleto', 'Terciario en X', 'Universitario en X'>",
      "institucion": "<nombre si lo mencionó, si no: ''>",
      "periodo": "<año o período si lo mencionó, si no: ''>"
    }
  ],
  "habilidades": ["<habilidades específicas del sector, ej: 'Atención al cliente presencial', 'Manejo de caja registradora', 'Cobro con POS', 'Reposición de góndolas', 'Limpieza de pisos y superficies', 'Cuidado de adultos mayores', 'Conducción de moto'. Mínimo 5, máximo 10. Solo habilidades reales y verificables, no actitudes.>"],
  "herramientas_digitales": ["<solo si las mencionó: apps, sistemas, herramientas. Si no mencionó nada digital, array vacío []>"],
  "idiomas": ["<solo si los mencionó, ej: 'Inglés básico'. Si no mencionó: []>"],
  "nivel_estudios": "<exactamente uno de: Primario / Secundario / Terciario / Universitario / Posgrado>",
  "area_laboral": "<sector en 2-3 palabras que los ATS usen, ej: 'Ventas y comercio', 'Limpieza y mantenimiento', 'Cuidado de personas', 'Logística y depósito', 'Gastronomía y cocina', 'Construcción y obras'>"
}

Reglas de contenido:
- Trabajos informales, changas, cuidado de familiares, construcción en negro — todo cuenta como experiencia válida
- Inferí habilidades del contexto: si cuidó personas mayores → "Asistencia en higiene personal", "Preparación de alimentos", "Acompañamiento y contención"
- Si no mencionó experiencia laboral, dejá experiencia como [] sin inventar
- Nunca inventés nombres de empresas, fechas ni títulos que no mencionó
- El resumen tiene que sonar como lo escribió un humano profesional, no una IA`,
    }],
  });

  const rawText = (message.content[0] as { type: string; text: string }).text.trim();
  // Strip markdown code fences if Claude wraps the JSON
  const raw = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
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

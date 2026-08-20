/**
 * POST /api/buscar
 * Buscador de ofertas con lenguaje natural.
 * Usa Claude para parsear la consulta y extrae filtros estructurados,
 * luego busca en Oferta (interna) + OfertaExterna (scrapeadas).
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ParsedQuery {
  keywords: string[];         // palabras clave del puesto
  area: string | null;        // área / rubro
  ciudad: string | null;      // ciudad o zona
  modalidad: 'presencial' | 'remoto' | 'hibrido' | null;
  empresa: string | null;     // empresa específica buscada
  salario_min: number | null;
  jornada: 'full' | 'part' | null;
  resumen: string;            // resumen de lo que entiende el sistema
}

/** Usa Claude para parsear la consulta en lenguaje natural → filtros estructurados */
async function parseQuery(query: string): Promise<ParsedQuery> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Sos un asistente de búsqueda de empleo en Argentina. Parseá la consulta del usuario en filtros estructurados.

El usuario buscó: "${query}"

IMPORTANTE sobre ciudad/zona:
- "San Isidro", "Tigre", "La Plata", "Rosario", "Córdoba", "Mendoza" → son ciudades concretas → van en "ciudad"
- "zona norte", "GBA", "CABA", "Capital Federal", "conurbano" → van en "ciudad"
- NO pongas la ciudad en keywords, solo en "ciudad"

IMPORTANTE sobre keywords:
- Solo palabras del PUESTO de trabajo (cargo/rol/actividad)
- Expandí con sinónimos argentinos del rubro
- "mozo" → ["mozo", "camarero", "mozos", "atención mesas"]
- "cajero" → ["cajero", "caja", "cajera", "atención al cliente"]
- "seguridad" → ["seguridad", "vigilador", "portero", "guardia"]
- "operario" → ["operario", "producción", "manufactura", "operaria"]
- "limpieza" → ["limpieza", "maestranza", "mucama", "ordenanza"]

Respondé SOLO con un JSON válido (sin markdown, sin texto extra):
{
  "keywords": ["palabra1", "palabra2"],
  "area": "área o rubro o null",
  "ciudad": "ciudad o zona geográfica (solo si está en la consulta, sino null)",
  "modalidad": "presencial|remoto|hibrido|null",
  "empresa": "nombre de empresa específica o null",
  "salario_min": numero_o_null,
  "jornada": "full|part|null",
  "resumen": "Una frase corta en español de qué buscó el usuario"
}`,
      },
    ],
  });

  const text = (message.content[0] as { text: string }).text.trim();
  try {
    return JSON.parse(text);
  } catch {
    return {
      keywords: query.split(' ').filter(Boolean),
      area: null,
      ciudad: null,
      modalidad: null,
      empresa: null,
      salario_min: null,
      jornada: null,
      resumen: query,
    };
  }
}

/** Condición OR solo en título (para búsqueda de alta precisión en externas) */
function buildTitleCondition(keywords: string[]) {
  return {
    OR: keywords.map((kw) => ({
      titulo: { contains: kw, mode: 'insensitive' as const },
    })),
  };
}

/** Condición OR en múltiples campos (para internas con más datos estructurados) */
function buildKeywordCondition(keywords: string[], extraFields: string[] = []) {
  const fields = ['titulo', 'descripcion', 'area', ...extraFields];
  return {
    OR: keywords.flatMap((kw) =>
      fields.map((f) => ({
        [f]: { contains: kw, mode: 'insensitive' as const },
      })),
    ),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = (body.query || '').trim();
    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Consulta vacía' }, { status: 400 });
    }

    const limit = Math.min(Number(body.limit) || 20, 50);

    // 1. Parsear con Claude
    const parsed = await parseQuery(query);
    const { keywords, area, ciudad, modalidad, empresa } = parsed;

    // 2. Buscar en Ofertas internas (multi-campo, tenemos datos limpios)
    const whereInternal: Record<string, unknown> = { estado: 'activa' };
    if (keywords.length > 0) {
      Object.assign(whereInternal, buildKeywordCondition(keywords, ['titulo_hero', 'nombre_marca']));
    }
    if (area) whereInternal.area = { contains: area, mode: 'insensitive' };
    if (ciudad) whereInternal.ciudad = { contains: ciudad, mode: 'insensitive' };
    if (modalidad) whereInternal.modalidad = modalidad;

    const ofertasInternas = await prisma.oferta.findMany({
      where: whereInternal as Parameters<typeof prisma.oferta.findMany>[0]['where'],
      include: {
        empresa: { select: { nombre: true, logo_url: true, slug: true } },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    // 3. Buscar en Ofertas externas — estrategia en dos capas para relevancia + cobertura geográfica
    //    Capa A: título match + ciudad match (más relevantes, van primero)
    //    Capa B: título match sin filtro de ciudad (para cuando ciudad no hay datos exactos)
    const titleCond =
      keywords.length > 0
        ? buildTitleCondition(keywords).OR
        : undefined;

    // También intentamos con área si no hay keywords o para mayor cobertura
    const companyNameCond =
      empresa
        ? [{ empresa_nombre: { contains: empresa, mode: 'insensitive' as const } }]
        : [];

    const baseOrConditions = [
      ...(titleCond ?? []),
      ...companyNameCond,
    ];

    let ofertasExternas: Awaited<ReturnType<typeof prisma.ofertaExterna.findMany>> = [];

    if (baseOrConditions.length > 0) {
      // Capa A: con ciudad (si fue especificada)
      const whereA: Record<string, unknown> = { activa: true, OR: baseOrConditions };
      if (ciudad) whereA.ciudad = { contains: ciudad, mode: 'insensitive' };
      if (modalidad) whereA.modalidad = modalidad;

      const capA = await prisma.ofertaExterna.findMany({
        where: whereA as Parameters<typeof prisma.ofertaExterna.findMany>[0]['where'],
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      // Capa B: sin filtro de ciudad, para completar si no alcanzamos el límite
      const hayQueCompletar = ciudad && capA.length < limit;
      let capB: typeof capA = [];

      if (hayQueCompletar) {
        const whereB: Record<string, unknown> = { activa: true, OR: baseOrConditions };
        if (modalidad) whereB.modalidad = modalidad;
        capB = await prisma.ofertaExterna.findMany({
          where: whereB as Parameters<typeof prisma.ofertaExterna.findMany>[0]['where'],
          orderBy: { created_at: 'desc' },
          take: limit,
        });
      }

      // Merge: primero los de la ciudad, luego el resto sin repetir
      const capAIds = new Set(capA.map((o) => o.id));
      ofertasExternas = [...capA, ...capB.filter((o) => !capAIds.has(o.id))].slice(0, limit);
    } else {
      // Sin keywords ni empresa: mostrar más recientes filtradas por ciudad/modalidad
      const whereSimple: Record<string, unknown> = { activa: true };
      if (ciudad) whereSimple.ciudad = { contains: ciudad, mode: 'insensitive' };
      if (modalidad) whereSimple.modalidad = modalidad;
      ofertasExternas = await prisma.ofertaExterna.findMany({
        where: whereSimple as Parameters<typeof prisma.ofertaExterna.findMany>[0]['where'],
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    }

    // 4. Normalizar resultados a formato unificado
    const resultadosInternos = ofertasInternas.map((o) => ({
      id: o.id,
      tipo: 'interna' as const,
      titulo: o.titulo,
      empresa_nombre: o.nombre_marca || o.empresa.nombre,
      logo_url: o.logo_url || o.empresa.logo_url,
      ciudad: o.ciudad,
      area: o.area,
      modalidad: o.modalidad,
      descripcion: o.descripcion?.slice(0, 200),
      url: `/ofertas/${o.id}`,
      fuente: 'oportunai',
      fecha: o.created_at,
    }));

    const resultadosExternos = ofertasExternas.map((o) => ({
      id: o.id,
      tipo: 'externa' as const,
      titulo: o.titulo,
      empresa_nombre: o.empresa_nombre,
      logo_url: o.logo_url,
      ciudad: o.ciudad,
      area: o.area,
      modalidad: o.modalidad,
      descripcion: o.descripcion?.slice(0, 200),
      url: o.url_original,
      fuente: o.fuente,
      salario: o.salario,
      fecha: o.created_at,
    }));

    // Mezclar: primero internas (son de la plataforma), luego externas
    const resultados = [...resultadosInternos, ...resultadosExternos].slice(0, limit);

    return NextResponse.json({
      ok: true,
      query,
      parsed,
      total: resultados.length,
      internos: resultadosInternos.length,
      externos: resultadosExternos.length,
      resultados,
    });
  } catch (err) {
    console.error('[buscar] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/** GET /api/buscar?q=... para uso simple sin body */
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') || '';
  if (!q) return NextResponse.json({ resultados: [], total: 0 });
  const fakeReq = new Request(req.url, {
    method: 'POST',
    body: JSON.stringify({ query: q }),
    headers: { 'content-type': 'application/json' },
  });
  return POST(fakeReq as NextRequest);
}

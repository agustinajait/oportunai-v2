/**
 * POST /api/buscar
 * Buscador de ofertas con lenguaje natural.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Sinonimia de puestos laborales en Argentina ──────────────────────────────

const SINONIMOS: Record<string, string[]> = {
  mozo:        ['mozo', 'mozos', 'camarero', 'camarera', 'camareros', 'moza', 'mesero', 'mesera', 'salon', 'gastronomia'],
  cajero:      ['cajero', 'cajera', 'caja', 'cajeros'],
  repositor:   ['repositor', 'repositora', 'reposicion', 'repositores', 'gondola'],
  operario:    ['operario', 'operaria', 'operarios', 'produccion', 'manufactura', 'planta'],
  limpieza:    ['limpieza', 'mucama', 'maestranza', 'ordenanza', 'portero', 'higiene', 'aseo'],
  seguridad:   ['seguridad', 'vigilador', 'guardia', 'vigilancia', 'porteria'],
  cocinero:    ['cocinero', 'cocinera', 'cocina', 'chef', 'pastelero', 'panadero', 'pasteleria'],
  logistica:   ['logistica', 'deposito', 'almacen', 'distribucion', 'repartidor', 'chofer', 'delivery'],
  ventas:      ['ventas', 'vendedor', 'vendedora', 'comercial', 'local', 'promotor', 'promotora'],
  atencion:    ['atencion', 'cliente', 'recepcion', 'call center', 'telemarketing', 'recepcionista'],
  encargado:   ['encargado', 'encargada', 'supervisor', 'jefe', 'responsable', 'lider'],
  rrhh:        ['recursos humanos', 'rrhh', 'seleccion', 'personal'],
  administrativo: ['administrativo', 'administrativa', 'secretaria', 'oficina', 'back office'],
  mecanico:    ['mecanico', 'mecanica', 'automotriz', 'taller', 'automotor'],
  electricista: ['electricista', 'electrico', 'instalaciones', 'electromecanico'],
  enfermero:   ['enfermero', 'enfermera', 'salud', 'cuidador', 'cuidadora', 'medico', 'clinica'],
  niñera:      ['niñera', 'cuidado', 'jardin', 'kindergarten', 'docente', 'maestra'],
  peluquero:   ['peluquero', 'peluquera', 'estetica', 'cosmetica', 'belleza'],
  informatica: ['informatica', 'sistemas', 'programador', 'desarrollador', 'soporte', 'tecnico'],
  playero:     ['playero', 'playa', 'nafta', 'estacion de servicio', 'combustible'],
};

// Palabras de intención / conectores — se descartan siempre
const STOP_WORDS = new Set([
  'en', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'del', 'al', 'y', 'o',
  'con', 'sin', 'por', 'para', 'que', 'se', 'es', 'a', 'me', 'mi', 'su', 'sus',
  'busco', 'busca', 'buscamos', 'quiero', 'quiera', 'necesito', 'necesita',
  'hay', 'tiene', 'tengo', 'cerca', 'zona', 'puesto', 'puestos',
  'oferta', 'ofertas', 'turno', 'horario', 'jornada', 'cargo', 'rol',
]);

// Zonas de Argentina para detección de ciudad
const ZONAS_ARGENTINA = [
  // GBA Norte
  'san isidro', 'tigre', 'pilar', 'escobar', 'zona norte', 'vicente lopez',
  'san fernando', 'benavides', 'nordelta', 'beccar', 'martinez', 'boulogne',
  // GBA Sur
  'quilmes', 'avellaneda', 'lanus', 'zona sur', 'florencio varela',
  'berazategui', 'almirante brown', 'lomas de zamora', 'banfield',
  // GBA Oeste
  'merlo', 'moreno', 'laferrere', 'zona oeste', 'ituzaingo', 'moron',
  'san martin', 'tres de febrero', 'hurlingham', 'ramos mejia',
  // La Matanza
  'la tablada', 'casanova', 'distrito casanova', 'gonzalez catan',
  'ciudad evita', 'san justo', 'tapiales',
  // CABA barrios
  'palermo', 'belgrano', 'flores', 'once', 'barracas', 'caba',
  'almagro', 'caballito', 'recoleta', 'san telmo', 'retiro', 'microcentro',
  'villa urquiza', 'villa del parque', 'villa crespo', 'balvanera',
  'puerto madero', 'chacarita', 'parque patricios', 'parque chacabuco',
  // Capital genérico
  'capital federal', 'buenos aires', 'gran buenos aires', 'gba', 'conurbano',
  // Interior
  'cordoba', 'rosario', 'mendoza', 'tucuman', 'salta', 'mar del plata',
  'la plata', 'bahia blanca', 'santa fe', 'corrientes', 'resistencia',
];

interface ParseResult {
  keywords: string[];
  ciudad: string | null;
  modalidad: 'presencial' | 'remoto' | 'hibrido' | null;
  resumen: string;
}

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Extrae la palabra principal de frases conversacionales como:
 *   "busco trabajo de limpieza" → "limpieza"
 *   "quiero empleo como cajero" → "cajero"
 *   "necesito trabajo en seguridad" → "seguridad"
 */
function extractMainJob(query: string): string | null {
  const lq = norm(query);
  // Patrones: "de X", "como X", "de X en ciudad", "de X y Y"
  const m = lq.match(/(?:trabajo de|empleo de|laburo de|trabajo como|empleo como|laburo como|puesto de|cargo de|rol de)\s+([a-záéíóúñü]+)/);
  return m ? m[1] : null;
}

/** Extrae keywords y ciudad directamente de la consulta (rápido, sin IA) */
function parseQueryLocal(query: string): ParseResult {
  const lq = norm(query);

  // Detectar ciudad (primero los nombres más largos para evitar ambigüedad)
  let ciudad: string | null = null;
  const sortedZonas = [...ZONAS_ARGENTINA].sort((a, b) => b.length - a.length);
  for (const zona of sortedZonas) {
    const zonaNorm = norm(zona);
    if (lq.includes(zonaNorm)) {
      ciudad = zona;
      break;
    }
  }

  // Detectar modalidad
  let modalidad: ParseResult['modalidad'] = null;
  if (lq.includes('remoto') || lq.includes('remote') || lq.includes('teletrabajo')) modalidad = 'remoto';
  else if (lq.includes('hibrido') || lq.includes('hybrid')) modalidad = 'hibrido';

  // Expandir sinonimia: si la consulta incluye una keyword, agregar su grupo completo
  const expandedKeywords = new Set<string>();
  for (const synonyms of Object.values(SINONIMOS)) {
    if (synonyms.some(s => lq.includes(norm(s)))) {
      synonyms.forEach(s => expandedKeywords.add(s));
    }
  }

  // Si no matcheó sinonimia directa, intentar extraer el puesto de frases conversacionales
  if (expandedKeywords.size === 0) {
    const mainJob = extractMainJob(query);
    if (mainJob) {
      // Buscar ese puesto en la tabla de sinónimos
      for (const synonyms of Object.values(SINONIMOS)) {
        if (synonyms.some(s => norm(s).includes(mainJob) || mainJob.includes(norm(s)))) {
          synonyms.forEach(s => expandedKeywords.add(s));
          break;
        }
      }
      // Si no está en sinónimos, usar la palabra directamente
      if (expandedKeywords.size === 0) expandedKeywords.add(mainJob);
    }
  }

  // Última opción: extraer palabras relevantes de la query descartando stop words y ciudad
  if (expandedKeywords.size === 0) {
    const cityWords = new Set(norm(ciudad ?? '').split(' ').filter(Boolean));
    lq.split(/\s+/).forEach(w => {
      if (w.length > 2 && !STOP_WORDS.has(w) && !cityWords.has(w)) {
        expandedKeywords.add(w);
      }
    });
  }

  const keywords = Array.from(expandedKeywords).slice(0, 8);
  return { keywords, ciudad, modalidad, resumen: query };
}

/**
 * Elimina de las keywords cualquier palabra que forme parte del nombre de ciudad.
 * Evita que "isidro" (parte de "San Isidro") genere matches de título en otras zonas.
 */
function stripCityFromKeywords(keywords: string[], ciudad: string | null): string[] {
  if (!ciudad) return keywords;
  const ciudadNorm = norm(ciudad);
  const cityTokens = new Set(ciudadNorm.split(/\s+/).filter(t => t.length > 2));
  return keywords.filter(kw => {
    const kwn = norm(kw);
    return !cityTokens.has(kwn) && !ciudadNorm.includes(kwn);
  });
}

/**
 * Filtro de ciudad con word-boundary — evita que "San Isidro" matchee "Isidro Casanova".
 */
function buildCiudadFilter(ciudad: string) {
  return [
    { ciudad: { equals:     ciudad,           mode: 'insensitive' as const } },
    { ciudad: { startsWith: `${ciudad} `,     mode: 'insensitive' as const } },
    { ciudad: { startsWith: `${ciudad},`,     mode: 'insensitive' as const } },
    { ciudad: { endsWith:   ` ${ciudad}`,     mode: 'insensitive' as const } },
    { ciudad: { endsWith:   `, ${ciudad}`,    mode: 'insensitive' as const } },
    { ciudad: { contains:   `(${ciudad})`,    mode: 'insensitive' as const } },
  ];
}

/** Enriquece con Claude — opcional, falla con gracia */
async function enrichWithClaude(query: string, local: ParseResult): Promise<ParseResult> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Extrae filtros de búsqueda de empleo en Argentina. Responde SOLO JSON válido sin markdown.

Query: "${query}"

REGLAS ESTRICTAS:
- "keywords": SOLO sinónimos del PUESTO o actividad laboral. Máximo 6 palabras. NUNCA ciudades, barrios ni zonas geográficas.
- "ciudad": nombre exacto de ciudad/zona si aparece, sino null.
- "modalidad": "presencial"|"remoto"|"hibrido"|null

{"keywords":["..."],"ciudad":"..."|null,"modalidad":"presencial"|"remoto"|"hibrido"|null}`,
      }],
    });

    const text = (msg.content[0] as { text: string }).text.trim();
    const parsed = JSON.parse(text);

    const ciudad = local.ciudad ?? (typeof parsed.ciudad === 'string' ? parsed.ciudad : null);
    const allKw = new Set([...local.keywords, ...(Array.isArray(parsed.keywords) ? parsed.keywords : [])]);
    const keywords = stripCityFromKeywords(Array.from(allKw).slice(0, 10), ciudad);

    return { ...local, keywords, ciudad, modalidad: parsed.modalidad ?? local.modalidad };
  } catch {
    return local;
  }
}

// ─── Helpers de query ───────────────────────────────────────────────────────

type OfertaInterna = Awaited<ReturnType<typeof prisma.oferta.findMany>>[number] & {
  empresa: { nombre: string; logo_url: string | null; slug: string };
};
type OfertaExternaRow = Awaited<ReturnType<typeof prisma.ofertaExterna.findMany>>[number];

function mapInternas(rows: OfertaInterna[]) {
  return rows.map(o => ({
    id: o.id, tipo: 'interna' as const,
    titulo: o.titulo,
    empresa_nombre: o.nombre_marca || o.empresa.nombre,
    logo_url: o.logo_url || o.empresa.logo_url,
    ciudad: o.ciudad, area: o.area, modalidad: o.modalidad,
    descripcion: o.descripcion?.slice(0, 200),
    url: `/ofertas/${o.id}`, fuente: 'oportunai', fecha: o.created_at,
  }));
}

function mapExternas(rows: OfertaExternaRow[]) {
  return rows.map(o => ({
    id: o.id, tipo: 'externa' as const,
    titulo: o.titulo, empresa_nombre: o.empresa_nombre,
    logo_url: o.logo_url, ciudad: o.ciudad, area: o.area, modalidad: o.modalidad,
    descripcion: o.descripcion?.slice(0, 200),
    url: o.url_original, fuente: o.fuente, salario: o.salario, fecha: o.created_at,
  }));
}

async function queryInternas(keywords: string[], ciudad: string | null, modalidad: string | null, limit: number) {
  const and: object[] = [{ estado: 'activa' }];
  if (keywords.length > 0) {
    and.push({
      OR: keywords.flatMap(kw => [
        { titulo:      { contains: kw, mode: 'insensitive' as const } },
        { descripcion: { contains: kw, mode: 'insensitive' as const } },
        { area:        { contains: kw, mode: 'insensitive' as const } },
      ]),
    });
  }
  if (ciudad) and.push({ OR: buildCiudadFilter(ciudad) });
  if (modalidad) and.push({ modalidad });

  return prisma.oferta.findMany({
    where: { AND: and } as Parameters<typeof prisma.oferta.findMany>[0]['where'],
    include: { empresa: { select: { nombre: true, logo_url: true, slug: true } } },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

async function queryExternas(keywords: string[], ciudad: string | null, modalidad: string | null, limit: number) {
  const and: object[] = [{ activa: true }];
  if (keywords.length > 0) {
    and.push({
      OR: keywords.map(kw => ({
        titulo: { contains: kw, mode: 'insensitive' as const },
      })),
    });
  }
  if (ciudad) and.push({ OR: buildCiudadFilter(ciudad) });
  if (modalidad) and.push({ modalidad });

  return prisma.ofertaExterna.findMany({
    where: { AND: and } as Parameters<typeof prisma.ofertaExterna.findMany>[0]['where'],
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = (body.query || '').trim();
    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Consulta vacía' }, { status: 400 });
    }

    const limit = Math.min(Number(body.limit) || 20, 50);

    // 1. Parsear consulta
    const local = parseQueryLocal(query);
    const parsed = await enrichWithClaude(query, local);
    const { keywords, ciudad, modalidad } = parsed;

    // Sin ningún filtro → pedir consulta más específica
    if (keywords.length === 0 && !ciudad && !modalidad) {
      return NextResponse.json({
        ok: true, query, parsed, total: 0, internos: 0, externos: 0,
        resultados: [],
        hint: 'Escribí el puesto que buscás, ej: "mozo", "limpieza en San Isidro", "cajero zona norte"',
      });
    }

    // 2. Búsqueda primaria (keywords + ciudad)
    const [internasRaw, externasRaw] = await Promise.all([
      queryInternas(keywords, ciudad, modalidad, limit),
      // Externos: siempre consultar si hay ciudad o keywords
      (keywords.length > 0 || ciudad)
        ? queryExternas(keywords, ciudad, modalidad, limit)
        : Promise.resolve([]),
    ]);

    let resultados = [
      ...mapInternas(internasRaw as OfertaInterna[]),
      ...mapExternas(externasRaw),
    ].slice(0, limit);

    let modo = 'exacto';

    // 3. Fallback A — si 0 resultados y hay ciudad: buscar todas las ofertas de esa ciudad (sin keywords)
    if (resultados.length === 0 && ciudad) {
      const [int2, ext2] = await Promise.all([
        queryInternas([], ciudad, null, limit),
        queryExternas([], ciudad, null, limit),
      ]);
      resultados = [
        ...mapInternas(int2 as OfertaInterna[]),
        ...mapExternas(ext2),
      ].slice(0, limit);
      modo = 'ciudad_sin_keywords';
    }

    // 4. Fallback B — si aún 0 resultados y hay keywords: buscar sin filtro de ciudad
    if (resultados.length === 0 && keywords.length > 0) {
      const [int3, ext3] = await Promise.all([
        queryInternas(keywords, null, null, limit),
        queryExternas(keywords, null, null, limit),
      ]);
      resultados = [
        ...mapInternas(int3 as OfertaInterna[]),
        ...mapExternas(ext3),
      ].slice(0, limit);
      modo = 'sin_zona';
    }

    const hint = modo === 'ciudad_sin_keywords'
      ? `No encontramos "${keywords.join(', ')}" en ${ciudad}. Mostramos todas las ofertas de la zona.`
      : modo === 'sin_zona'
      ? `No encontramos resultados exactos en ${ciudad ?? 'esa zona'}. Mostramos ofertas similares de otras zonas.`
      : undefined;

    return NextResponse.json({
      ok: true, query, parsed, modo,
      total: resultados.length,
      internos: resultados.filter(r => r.tipo === 'interna').length,
      externos: resultados.filter(r => r.tipo === 'externa').length,
      resultados,
      ...(hint ? { hint } : {}),
    });

  } catch (err) {
    console.error('[buscar] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/** GET /api/buscar?q=... */
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

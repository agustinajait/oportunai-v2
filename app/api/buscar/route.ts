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
  mozo:       ['mozo', 'mozos', 'camarero', 'camarera', 'camareros', 'moza'],
  cajero:     ['cajero', 'cajera', 'caja', 'cajeros'],
  repositor:  ['repositor', 'repositora', 'reposicion', 'repositores'],
  operario:   ['operario', 'operaria', 'operarios', 'produccion', 'manufactura'],
  limpieza:   ['limpieza', 'mucama', 'maestranza', 'ordenanza', 'portero'],
  seguridad:  ['seguridad', 'vigilador', 'guardia', 'vigilancia'],
  cocinero:   ['cocinero', 'cocinera', 'cocina', 'chef', 'pastelero'],
  logistica:  ['logistica', 'deposito', 'almacen', 'distribucion', 'repartidor'],
  ventas:     ['ventas', 'vendedor', 'vendedora', 'comercial', 'local'],
  atencion:   ['atencion', 'cliente', 'recepcion', 'call center', 'telemarketing'],
  encargado:  ['encargado', 'encargada', 'supervisor', 'jefe', 'responsable'],
  rrhh:       ['recursos humanos', 'rrhh', 'seleccion', 'personal'],
  administrativo: ['administrativo', 'administrativa', 'secretaria', 'oficina'],
  mecanico:   ['mecanico', 'mecanica', 'automotriz', 'taller'],
  electricista: ['electricista', 'electrico', 'instalaciones'],
};

// Palabras a ignorar al extraer keywords de la consulta
const STOP_WORDS = new Set([
  'en', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'del', 'al', 'y', 'o',
  'con', 'sin', 'por', 'para', 'que', 'se', 'es', 'a', 'me', 'mi', 'su',
  'trabajo', 'busco', 'quiero', 'necesito', 'cerca', 'zona', 'puesto',
  'empleo', 'oferta', 'turno', 'horario', 'jornada',
]);

// Zonas de Argentina para detección de ciudad
const ZONAS_ARGENTINA = [
  'san isidro', 'tigre', 'pilar', 'escobar', 'zona norte',
  'quilmes', 'avellaneda', 'lanus', 'zona sur',
  'merlo', 'moreno', 'laferrere', 'zona oeste', 'ituzaingo',
  'la tablada', 'casanova', 'distrito casanova',
  'palermo', 'belgrano', 'flores', 'once', 'barracas', 'caba',
  'capital federal', 'buenos aires', 'gran buenos aires', 'gba', 'conurbano',
  'cordoba', 'rosario', 'mendoza', 'tucuman', 'salta', 'mar del plata',
  'lomas de zamora', 'san martin', 'tres de febrero', 'moron',
];

interface ParseResult {
  keywords: string[];
  ciudad: string | null;
  modalidad: 'presencial' | 'remoto' | 'hibrido' | null;
  resumen: string;
}

/** Extrae keywords y ciudad directamente de la consulta (rápido, sin IA) */
function parseQueryLocal(query: string): ParseResult {
  const lq = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Detectar ciudad
  let ciudad: string | null = null;
  for (const zona of ZONAS_ARGENTINA) {
    const zonaNorm = zona.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (lq.includes(zonaNorm)) {
      ciudad = zona;
      break;
    }
  }

  // Detectar modalidad
  let modalidad: ParseResult['modalidad'] = null;
  if (lq.includes('remoto') || lq.includes('remote') || lq.includes('teletrabajo')) modalidad = 'remoto';
  else if (lq.includes('hibrido') || lq.includes('hybrid')) modalidad = 'hibrido';

  // Expandir sinonimia: si la consulta incluye una keyword canónica, agregar sinónimos
  const expandedKeywords = new Set<string>();
  for (const [canonical, synonyms] of Object.entries(SINONIMOS)) {
    if (synonyms.some(s => lq.includes(s)) || lq.includes(canonical)) {
      synonyms.forEach(s => expandedKeywords.add(s));
    }
  }

  // Si no matcheó sinonimia, extraer palabras clave de la consulta directamente
  if (expandedKeywords.size === 0) {
    const cityWords = new Set((ciudad ?? '').split(' ').filter(Boolean));
    query.toLowerCase().split(/\s+/).forEach(w => {
      const wn = w.normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (w.length > 2 && !STOP_WORDS.has(wn) && !cityWords.has(wn)) {
        expandedKeywords.add(w);
      }
    });
  }

  const keywords = Array.from(expandedKeywords).slice(0, 8);
  return { keywords, ciudad, modalidad, resumen: query };
}

/** Enriquece con Claude (sinónimos, área, etc.) — opcional, falla con gracia */
async function enrichWithClaude(query: string, local: ParseResult): Promise<ParseResult> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Extrae filtros de búsqueda de empleo en Argentina. Responde SOLO JSON válido sin markdown.

Query: "${query}"

IMPORTANTE:
- "keywords": solo sinónimos del PUESTO (cargo/actividad). Máximo 6 palabras.
- "ciudad": nombre exacto de ciudad/zona si está en la query, sino null. No pongas la ciudad en keywords.
- "modalidad": "presencial"|"remoto"|"hibrido"|null

{"keywords":["..."],"ciudad":"..."|null,"modalidad":"presencial"|"remoto"|"hibrido"|null}`,
      }],
    });

    const text = (msg.content[0] as { text: string }).text.trim();
    const parsed = JSON.parse(text);

    // Usar ciudad de Claude si no la detectamos localmente, o si es más específica
    const ciudad = local.ciudad ?? (typeof parsed.ciudad === 'string' ? parsed.ciudad : null);

    // Merge keywords: los nuestros + los de Claude, dedup
    const allKw = new Set([...local.keywords, ...(Array.isArray(parsed.keywords) ? parsed.keywords : [])]);
    const keywords = Array.from(allKw).slice(0, 10);

    return { ...local, keywords, ciudad, modalidad: parsed.modalidad ?? local.modalidad };
  } catch {
    // Si Claude falla, usar solo el parseado local — no romper la búsqueda
    return local;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = (body.query || '').trim();
    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Consulta vacía' }, { status: 400 });
    }

    const limit = Math.min(Number(body.limit) || 20, 50);

    // 1. Parsear consulta: local primero, luego enriquecer con Claude
    const local = parseQueryLocal(query);
    const parsed = await enrichWithClaude(query, local);
    const { keywords, ciudad, modalidad } = parsed;

    // Si no hay ningún filtro útil, no devolver resultados sin sentido
    if (keywords.length === 0 && !ciudad && !modalidad) {
      return NextResponse.json({
        ok: true, query, parsed, total: 0, internos: 0, externos: 0,
        resultados: [], hint: 'Consultá más específico, ej: "mozo en San Isidro"',
      });
    }

    // 2. Buscar en Ofertas internas (más datos → búsqueda amplia)
    const whereInternal: Record<string, unknown> = { estado: 'activa' };
    if (keywords.length > 0) {
      whereInternal.OR = keywords.flatMap(kw => [
        { titulo:      { contains: kw, mode: 'insensitive' as const } },
        { descripcion: { contains: kw, mode: 'insensitive' as const } },
        { area:        { contains: kw, mode: 'insensitive' as const } },
      ]);
    }
    if (ciudad) whereInternal.ciudad = { contains: ciudad, mode: 'insensitive' };
    if (modalidad) whereInternal.modalidad = modalidad;

    const ofertasInternas = await prisma.oferta.findMany({
      where: whereInternal as Parameters<typeof prisma.oferta.findMany>[0]['where'],
      include: { empresa: { select: { nombre: true, logo_url: true, slug: true } } },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    // 3. Buscar en Ofertas externas — SOLO en título, sin fallback de ciudad
    //    Estrategia: título match + ciudad exacta. Sin resultados de otras zonas.
    const titleOr = keywords.map(kw => ({
      titulo: { contains: kw, mode: 'insensitive' as const },
    }));

    let ofertasExternas: Awaited<ReturnType<typeof prisma.ofertaExterna.findMany>> = [];

    if (titleOr.length > 0) {
      const whereExt: Record<string, unknown> = { activa: true, OR: titleOr };
      if (ciudad) whereExt.ciudad = { contains: ciudad, mode: 'insensitive' };
      if (modalidad) whereExt.modalidad = modalidad;

      ofertasExternas = await prisma.ofertaExterna.findMany({
        where: whereExt as Parameters<typeof prisma.ofertaExterna.findMany>[0]['where'],
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    }

    // 4. Normalizar
    const resultadosInternos = ofertasInternas.map(o => ({
      id: o.id, tipo: 'interna' as const,
      titulo: o.titulo,
      empresa_nombre: o.nombre_marca || o.empresa.nombre,
      logo_url: o.logo_url || o.empresa.logo_url,
      ciudad: o.ciudad, area: o.area, modalidad: o.modalidad,
      descripcion: o.descripcion?.slice(0, 200),
      url: `/ofertas/${o.id}`, fuente: 'oportunai', fecha: o.created_at,
    }));

    const resultadosExternos = ofertasExternas.map(o => ({
      id: o.id, tipo: 'externa' as const,
      titulo: o.titulo, empresa_nombre: o.empresa_nombre,
      logo_url: o.logo_url, ciudad: o.ciudad, area: o.area, modalidad: o.modalidad,
      descripcion: o.descripcion?.slice(0, 200),
      url: o.url_original, fuente: o.fuente, salario: o.salario, fecha: o.created_at,
    }));

    const resultados = [...resultadosInternos, ...resultadosExternos].slice(0, limit);

    return NextResponse.json({
      ok: true, query, parsed, total: resultados.length,
      internos: resultadosInternos.length, externos: resultadosExternos.length,
      resultados,
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

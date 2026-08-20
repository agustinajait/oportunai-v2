/**
 * POST /api/admin/apify-webhook
 * Recibe el webhook de Apify cuando un run de scraping finaliza.
 * Apify envía un POST con info del run; este endpoint descarga
 * los items del dataset y los guarda en OfertaExterna.
 *
 * Configuración en Apify:
 *   URL: https://oportunai.korai.lat/api/admin/apify-webhook?key=<SCRAPE_API_KEY>
 *   Events: RUN_SUCCEEDED
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { JobListing } from '@/lib/scrapers/computrabajo';

const SCRAPE_KEY = process.env.SCRAPE_API_KEY;
const APIFY_TOKEN = process.env.APIFY_TOKEN;

/** Valida la API key en query param */
function isAuthorized(req: NextRequest): boolean {
  if (!SCRAPE_KEY) return false;
  const key =
    req.headers.get('x-api-key') ||
    new URL(req.url).searchParams.get('key');
  return key === SCRAPE_KEY;
}

/** Guarda un lote de JobListings en DB con createMany + skipDuplicates.
 *  Retorna { saved, error? } — el error se incluye en la respuesta HTTP para
 *  facilitar el diagnóstico sin necesidad de acceder a logs de Vercel.
 */
async function saveListings(
  fuente: string,
  items: JobListing[],
): Promise<{ saved: number; error?: string }> {
  if (items.length === 0) return { saved: 0 };

  // ── Pre-flight: verificar que la tabla es accesible ────────────────────────
  try {
    await prisma.ofertaExterna.count();
  } catch (e: unknown) {
    const msg = (e as Error).message || String(e);
    console.error('[apify-webhook] Tabla OfertaExterna inaccesible:', msg);
    return { saved: 0, error: `tabla_inaccesible: ${msg.slice(0, 300)}` };
  }

  const now = new Date();

  // ── Intento 1: createMany bulk ─────────────────────────────────────────────
  try {
    const result = await prisma.ofertaExterna.createMany({
      data: items.map(item => ({
        fuente,
        fuente_id: item.fuente_id ?? null,
        titulo: item.titulo,
        empresa_nombre: item.empresa_nombre,
        descripcion: item.descripcion ?? null,
        area: item.area ?? null,
        ciudad: item.ciudad ?? null,
        modalidad: item.modalidad ?? 'presencial',
        salario: item.salario ?? null,
        url_original: item.url_original,
        logo_url: item.logo_url ?? null,
        fecha_publicacion: item.fecha_publicacion ?? null,
        activa: true,
        updated_at: now,
      })),
      skipDuplicates: true,
    });
    return { saved: result.count };
  } catch (err: unknown) {
    const bulkMsg = (err as Error).message || String(err);
    console.error('[apify-webhook] createMany falló:', bulkMsg);

    // ── Intento 2: insertar de a uno ─────────────────────────────────────────
    let saved = 0;
    let firstNonDupError = '';

    for (const item of items) {
      try {
        await prisma.ofertaExterna.create({
          data: {
            fuente,
            fuente_id: item.fuente_id ?? null,
            titulo: item.titulo,
            empresa_nombre: item.empresa_nombre,
            descripcion: item.descripcion ?? null,
            area: item.area ?? null,
            ciudad: item.ciudad ?? null,
            modalidad: item.modalidad ?? 'presencial',
            salario: item.salario ?? null,
            url_original: item.url_original,
            logo_url: item.logo_url ?? null,
            fecha_publicacion: item.fecha_publicacion ?? null,
            activa: true,
            updated_at: now,
          },
        });
        saved++;
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        const emsg = (e as Error).message || String(e);
        if (code !== 'P2002') {
          if (!firstNonDupError) firstNonDupError = emsg;
          console.error('[apify-webhook] create individual falló:', emsg, item.titulo);
        }
      }
    }

    const error =
      saved === 0
        ? `bulk: ${bulkMsg.slice(0, 200)} | individual: ${firstNonDupError.slice(0, 200)}`
        : undefined;

    return { saved, error };
  }
}

/**
 * Extrae el primer valor no-vacío de una lista de posibles campos.
 */
function pick(item: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = String(item[k] ?? '').trim();
    if (v && v !== 'null' && v !== 'undefined') return v;
  }
  return '';
}

/**
 * Mapea un item de Computrabajo (salida de Apify) a JobListing.
 * Cubre todos los nombres de campo conocidos de actores populares de Computrabajo.
 */
function mapComputrabajo(item: Record<string, unknown>): JobListing | null {
  // Título — obligatorio (probamos todos los campos conocidos + fallback inteligente)
  let titulo = pick(item,
    'title', 'titulo', 'posicion', 'jobTitle', 'position',
    'name', 'cargo', 'puesto', 'vacante', 'oferta',
    'job_title', 'jobtitle', 'Titulo', 'Title',
  );

  // Fallback: buscar cualquier campo string corto que no sea URL ni fecha
  if (!titulo) {
    for (const [k, v] of Object.entries(item)) {
      if (
        typeof v === 'string' &&
        v.length > 3 && v.length < 200 &&
        !v.startsWith('http') &&
        !k.toLowerCase().includes('url') &&
        !k.toLowerCase().includes('date') &&
        !k.toLowerCase().includes('at') &&
        !k.toLowerCase().includes('id') &&
        !k.toLowerCase().includes('company') &&
        !k.toLowerCase().includes('empresa')
      ) {
        titulo = v.trim();
        break;
      }
    }
  }

  if (!titulo) return null;

  // URL — obligatorio
  let url_original = pick(item,
    'url', 'jobUrl', 'link', 'href',
    'pageUrl', 'loadedUrl', 'ofertaUrl', 'detailUrl',
    'sourceUrl', 'canonicalUrl', 'jobLink', 'applyUrl',
  );

  // Fallback: primer valor string que empiece con http
  if (!url_original) {
    for (const v of Object.values(item)) {
      if (typeof v === 'string' && v.startsWith('http')) {
        url_original = v;
        break;
      }
    }
  }

  if (!url_original) return null;

  // ID único
  const rawId = pick(item, 'id', 'jobId', 'fuente_id', 'offerId', 'vacancyId', 'postingId');
  const urlId = url_original.match(/\/(\d+)(?:[/?#]|$)/)?.[1] || '';
  const fuente_id = rawId || urlId || url_original.slice(-24);

  // Empresa
  const empresa_nombre = pick(item,
    'company', 'empresa', 'companyName', 'employer',
    'organizacion', 'organization', 'recruiter',
  ) || 'Empresa no indicada';

  // Descripción
  const rawDesc = pick(item, 'description', 'descripcion', 'snippet', 'summary', 'details', 'jobDescription');
  const descripcion = rawDesc ? rawDesc.replace(/<[^>]+>/g, '').slice(0, 500) : undefined;

  // Ciudad
  const ciudad = pick(item,
    'location', 'ciudad', 'city', 'place', 'localidad',
    'province', 'provincia', 'region', 'zona',
  ) || undefined;

  // Área / categoría
  const area = pick(item,
    'category', 'area', 'sector', 'rubro', 'industria',
    'jobCategory', 'subcategory',
  ) || undefined;

  // Salario
  const salario = pick(item, 'salary', 'salario', 'wage', 'remuneration', 'sueldo') || undefined;

  // Modalidad
  const modalityRaw = pick(item, 'modality', 'modalidad', 'workType', 'jobType', 'contractType').toLowerCase();
  const modalidad =
    modalityRaw.includes('remoto') || modalityRaw.includes('remote') || modalityRaw.includes('teletrabajo')
      ? 'remoto'
      : modalityRaw.includes('híbrido') || modalityRaw.includes('hybrid')
      ? 'hibrido'
      : 'presencial';

  // Logo de empresa
  const logo_url = pick(item,
    'logo', 'logoUrl', 'logo_url', 'companyLogo', 'companyImage',
    'imageUrl', 'image', 'photoUrl', 'company_logo', 'brandLogo',
    'empresaLogo', 'companyLogoUrl', 'logoSrc',
  ) || undefined;

  // Fecha
  let fecha_publicacion: Date | undefined;
  const rawDate = item.date || item.fecha || item.publishedAt || item.postedAt;
  if (rawDate) {
    const d = new Date(String(rawDate));
    if (!isNaN(d.getTime())) fecha_publicacion = d;
  }

  return {
    fuente_id,
    titulo,
    empresa_nombre,
    descripcion,
    area,
    ciudad,
    modalidad,
    salario,
    url_original,
    logo_url,
    fecha_publicacion,
  };
}

/**
 * Determina la fuente y el mapper según el actor que disparó el webhook.
 */
function detectSource(actorId?: string, actorName?: string): {
  fuente: string;
  mapper: (item: Record<string, unknown>) => JobListing | null;
} {
  const hint = ((actorId || '') + (actorName || '')).toLowerCase();

  if (hint.includes('zonajobs')) return { fuente: 'zonajobs', mapper: mapComputrabajo };
  if (hint.includes('bumeran')) return { fuente: 'bumeran', mapper: mapComputrabajo };
  if (hint.includes('linkedin')) return { fuente: 'linkedin', mapper: mapComputrabajo };

  // Default: computrabajo
  return { fuente: 'computrabajo', mapper: mapComputrabajo };
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Apify envía un JSON con info del run
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  console.log('[apify-webhook] body:', JSON.stringify(body).slice(0, 500));

  // Apify webhook payload:
  // { eventType, eventData: { actorId, actorRunId, actorTaskId, defaultDatasetId, ... } }
  const eventType = String(body.eventType || '');
  const eventData = (body.eventData || body) as Record<string, unknown>;

  const actorRunId = String(eventData.actorRunId || body.runId || '');
  const datasetId = String(eventData.defaultDatasetId || body.datasetId || '');
  const actorId = String(eventData.actorId || body.actorId || '');
  const actorName = String(eventData.actorName || body.actorName || '');

  if (!datasetId && !actorRunId) {
    return NextResponse.json(
      { error: 'Falta datasetId o actorRunId en el payload' },
      { status: 400 },
    );
  }

  // ── Descargar items del dataset ────────────────────────────────────────────
  const token = APIFY_TOKEN;
  if (!token) {
    console.error('[apify-webhook] APIFY_TOKEN no configurado');
    return NextResponse.json({ error: 'APIFY_TOKEN no configurado' }, { status: 500 });
  }

  let rawItems: Record<string, unknown>[] = [];

  // Preferir dataset directo; si no, obtenerlo desde el run
  if (datasetId) {
    const dsUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&format=json&limit=1000`;
    const dsRes = await fetch(dsUrl, { signal: AbortSignal.timeout(30000) });
    if (!dsRes.ok) {
      console.error('[apify-webhook] Error fetching dataset:', dsRes.status);
      return NextResponse.json({ error: `Error fetching dataset: ${dsRes.status}` }, { status: 502 });
    }
    rawItems = await dsRes.json();
  } else {
    // Obtener datasetId desde el run
    const runUrl = `https://api.apify.com/v2/actor-runs/${actorRunId}?token=${token}`;
    const runRes = await fetch(runUrl, { signal: AbortSignal.timeout(15000) });
    if (!runRes.ok) {
      return NextResponse.json({ error: `Error fetching run: ${runRes.status}` }, { status: 502 });
    }
    const runData = await runRes.json();
    const resolvedDatasetId = runData?.data?.defaultDatasetId;
    if (!resolvedDatasetId) {
      return NextResponse.json({ error: 'No se encontró defaultDatasetId en el run' }, { status: 400 });
    }

    const dsUrl = `https://api.apify.com/v2/datasets/${resolvedDatasetId}/items?token=${token}&format=json&limit=1000`;
    const dsRes = await fetch(dsUrl, { signal: AbortSignal.timeout(30000) });
    if (!dsRes.ok) {
      return NextResponse.json({ error: `Error fetching dataset items: ${dsRes.status}` }, { status: 502 });
    }
    rawItems = await dsRes.json();
  }

  if (!Array.isArray(rawItems)) {
    rawItems = [];
  }

  console.log(`[apify-webhook] Items descargados: ${rawItems.length}`);

  // ── Mapear y guardar ────────────────────────────────────────────────────────
  const { fuente, mapper } = detectSource(actorId, actorName);

  const listings: JobListing[] = [];
  for (const raw of rawItems) {
    const mapped = mapper(raw);
    if (mapped) listings.push(mapped);
  }

  const saveResult = await saveListings(fuente, listings);
  const { saved, error: saveError } = saveResult;

  console.log(`[apify-webhook] Guardados ${saved}/${listings.length} items de ${fuente}${saveError ? ' | ERROR: ' + saveError : ''}`);

  // Incluir las keys del primer item para diagnóstico cuando no se mapea nada
  const sampleKeys = rawItems.length > 0 ? Object.keys(rawItems[0]) : [];
  const sampleItem = listings.length === 0 && rawItems.length > 0 ? rawItems[0] : undefined;

  return NextResponse.json({
    ok: true,
    fuente,
    eventType,
    itemsReceived: rawItems.length,
    itemsMapped: listings.length,
    saved,
    ...(listings.length === 0 && { sampleKeys, sampleItem }),
    // Siempre mostrar el error si hubo uno, para poder diagnosticar sin logs de Vercel
    ...(saveError && { saveError }),
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET → devuelve instrucciones de configuración (para verificar que el endpoint existe)
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return NextResponse.json({
    endpoint: '/api/admin/apify-webhook',
    usage: 'Configura este URL como webhook en Apify: POST con ?key=<SCRAPE_API_KEY>',
    requiredEnvVars: ['APIFY_TOKEN', 'SCRAPE_API_KEY'],
    events: ['RUN_SUCCEEDED'],
    note: 'El payload de Apify debe incluir eventData.defaultDatasetId o eventData.actorRunId',
  });
}

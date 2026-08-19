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

/** Guarda un lote de JobListings en DB con upsert */
async function saveListings(fuente: string, items: JobListing[]): Promise<number> {
  let saved = 0;
  for (const item of items) {
    try {
      if (item.fuente_id) {
        await prisma.ofertaExterna.upsert({
          where: { fuente_fuente_id: { fuente, fuente_id: item.fuente_id } },
          update: {
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
            updated_at: new Date(),
          },
          create: {
            fuente,
            fuente_id: item.fuente_id,
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
          },
        });
      } else {
        await prisma.ofertaExterna.create({
          data: {
            fuente,
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
          },
        });
      }
      saved++;
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== 'P2002') {
        console.error(`[apify-webhook] Error saving item:`, err);
      }
    }
  }
  return saved;
}

/**
 * Mapea un item de Computrabajo (salida de Apify) a JobListing.
 * Los campos varían según el actor; cubrimos los nombres más comunes.
 */
function mapComputrabajo(item: Record<string, unknown>): JobListing | null {
  // Título — obligatorio
  const titulo = String(
    item.title || item.titulo || item.posicion || item.jobTitle || '',
  ).trim();
  if (!titulo) return null;

  // URL — obligatorio
  const url_original = String(
    item.url || item.jobUrl || item.link || item.href || '',
  ).trim();
  if (!url_original) return null;

  // ID único
  const rawId = String(item.id || item.jobId || item.fuente_id || '').trim();
  const urlId = url_original.match(/\/(\d+)(?:\?|$)/)?.[1] || '';
  const fuente_id = rawId || urlId || url_original.slice(-20);

  // Empresa
  const empresa_nombre = String(
    item.company || item.empresa || item.companyName || 'Empresa no indicada',
  ).trim();

  // Descripción
  const rawDesc = String(
    item.description || item.descripcion || item.snippet || '',
  ).trim();
  const descripcion = rawDesc ? rawDesc.replace(/<[^>]+>/g, '').slice(0, 500) : undefined;

  // Ciudad
  const ciudad = String(
    item.location || item.ciudad || item.city || item.place || '',
  ).trim() || undefined;

  // Área / categoría
  const area = String(
    item.category || item.area || item.sector || '',
  ).trim() || undefined;

  // Salario
  const salario = String(item.salary || item.salario || '').trim() || undefined;

  // Modalidad
  const modalityRaw = String(item.modality || item.modalidad || item.workType || '').toLowerCase();
  const modalidad =
    modalityRaw.includes('remoto') || modalityRaw.includes('remote') || modalityRaw.includes('teletrabajo')
      ? 'remoto'
      : modalityRaw.includes('híbrido') || modalityRaw.includes('hybrid')
      ? 'hibrido'
      : 'presencial';

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

  const saved = await saveListings(fuente, listings);

  console.log(`[apify-webhook] Guardados ${saved}/${listings.length} items de ${fuente}`);

  return NextResponse.json({
    ok: true,
    fuente,
    eventType,
    itemsReceived: rawItems.length,
    itemsMapped: listings.length,
    saved,
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

/**
 * POST /api/admin/scrape-ofertas
 * Scraper de ofertas externas. Protegido por SCRAPE_API_KEY.
 * Se puede llamar manualmente o automatizar con cron (cron-job.org, Railway cron, etc.)
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Vercel Pro: hasta 300s; en free plan usa el máximo disponible
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeComputrabajo } from '@/lib/scrapers/computrabajo';
import { scrapeZonaJobs } from '@/lib/scrapers/zonajobs';
import { scrapeBumeran } from '@/lib/scrapers/bumeran';
import {
  scrapeMercadoLibre,
  scrapeYPF,
  scrapeMcDonalds,
  scrapeMostaza,
  scrapeStarbucks,
  scrapeSanIsidro,
} from '@/lib/scrapers/empresas';
import type { JobListing } from '@/lib/scrapers/computrabajo';

const SCRAPE_KEY = process.env.SCRAPE_API_KEY;

/** Valida la API key */
function isAuthorized(req: NextRequest): boolean {
  if (!SCRAPE_KEY) return false;
  const key =
    req.headers.get('x-api-key') || new URL(req.url).searchParams.get('key');
  return key === SCRAPE_KEY;
}

/** Guarda un lote de JobListings en DB con upsert (deduplicación por fuente+fuente_id) */
async function saveListings(fuente: string, items: JobListing[]): Promise<number> {
  let saved = 0;
  for (const item of items) {
    try {
      if (item.fuente_id) {
        // Upsert: actualiza si existe, crea si no
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
        // Sin fuente_id, siempre crear (sin dedup)
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
      // Ignorar duplicados únicos
      if ((err as { code?: string }).code !== 'P2002') {
        console.error(`[scrape] Error saving ${fuente} item:`, err);
      }
    }
  }
  return saved;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const fuentes: string[] = body.fuentes || ['all'];
  const runAll = fuentes.includes('all');
  // debug=true devuelve los items crudos sin guardar (para diagnosticar)
  const debug = body.debug === true;

  const stats: Record<string, number> = {};
  const errors: Record<string, string> = {};
  const debugItems: Record<string, unknown[]> = {};

  // Pocas keywords para no superar el timeout de Vercel (10-30s free, 300s Pro)
  const KEYWORDS = ['cajero', 'operario', 'atencion al cliente', 'mozo', 'repositor'];

  // ── Computrabajo ──────────────────────────────────────────────────────────
  if (runAll || fuentes.includes('computrabajo')) {
    try {
      const items = await scrapeComputrabajo(KEYWORDS, 1);
      if (debug) { debugItems.computrabajo = items; stats.computrabajo = items.length; }
      else stats.computrabajo = await saveListings('computrabajo', items);
    } catch (err) {
      errors.computrabajo = String(err);
    }
  }

  // ── ZonaJobs ─────────────────────────────────────────────────────────────
  if (runAll || fuentes.includes('zonajobs')) {
    try {
      const items = await scrapeZonaJobs(KEYWORDS, 10);
      if (debug) { debugItems.zonajobs = items; stats.zonajobs = items.length; }
      else stats.zonajobs = await saveListings('zonajobs', items);
    } catch (err) {
      errors.zonajobs = String(err);
    }
  }

  // ── Bumeran ───────────────────────────────────────────────────────────────
  if (runAll || fuentes.includes('bumeran')) {
    try {
      const items = await scrapeBumeran(KEYWORDS, 10);
      if (debug) { debugItems.bumeran = items; stats.bumeran = items.length; }
      else stats.bumeran = await saveListings('bumeran', items);
    } catch (err) {
      errors.bumeran = String(err);
    }
  }

  // ── Mercado Libre ─────────────────────────────────────────────────────────
  if (runAll || fuentes.includes('mercadolibre')) {
    try {
      const items = await scrapeMercadoLibre();
      if (debug) { debugItems.mercadolibre = items; stats.mercadolibre = items.length; }
      else stats.mercadolibre = await saveListings('mercadolibre', items);
    } catch (err) {
      errors.mercadolibre = String(err);
    }
  }

  // ── YPF ───────────────────────────────────────────────────────────────────
  if (runAll || fuentes.includes('ypf')) {
    try {
      const items = await scrapeYPF();
      if (debug) { debugItems.ypf = items; stats.ypf = items.length; }
      else stats.ypf = await saveListings('ypf', items);
    } catch (err) {
      errors.ypf = String(err);
    }
  }

  // ── McDonald's ────────────────────────────────────────────────────────────
  if (runAll || fuentes.includes('mcdonalds')) {
    try {
      const items = await scrapeMcDonalds();
      if (debug) { debugItems.mcdonalds = items; stats.mcdonalds = items.length; }
      else stats.mcdonalds = await saveListings('mcdonalds', items);
    } catch (err) {
      errors.mcdonalds = String(err);
    }
  }

  // ── Mostaza ───────────────────────────────────────────────────────────────
  if (runAll || fuentes.includes('mostaza')) {
    try {
      const items = await scrapeMostaza();
      if (debug) { debugItems.mostaza = items; stats.mostaza = items.length; }
      else stats.mostaza = await saveListings('mostaza', items);
    } catch (err) {
      errors.mostaza = String(err);
    }
  }

  // ── Starbucks ─────────────────────────────────────────────────────────────
  if (runAll || fuentes.includes('starbucks')) {
    try {
      const items = await scrapeStarbucks();
      if (debug) { debugItems.starbucks = items; stats.starbucks = items.length; }
      else stats.starbucks = await saveListings('starbucks', items);
    } catch (err) {
      errors.starbucks = String(err);
    }
  }

  // ── San Isidro ────────────────────────────────────────────────────────────
  if (runAll || fuentes.includes('sanisidro')) {
    try {
      const items = await scrapeSanIsidro();
      if (debug) { debugItems.sanisidro = items; stats.sanisidro = items.length; }
      else stats.sanisidro = await saveListings('sanisidro', items);
    } catch (err) {
      errors.sanisidro = String(err);
    }
  }

  const totalSaved = Object.values(stats).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    ok: true,
    totalSaved,
    stats,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    ...(debug && { debugItems }),
    timestamp: new Date().toISOString(),
  });
}

/** GET → muestra stats de ofertas externas en DB */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const total = await prisma.ofertaExterna.count({ where: { activa: true } });
  const byFuente = await prisma.ofertaExterna.groupBy({
    by: ['fuente'],
    _count: { id: true },
    where: { activa: true },
    orderBy: { _count: { id: 'desc' } },
  });
  const last = await prisma.ofertaExterna.findFirst({
    orderBy: { updated_at: 'desc' },
    select: { updated_at: true },
  });
  return NextResponse.json({ total, byFuente, lastSync: last?.updated_at });
}

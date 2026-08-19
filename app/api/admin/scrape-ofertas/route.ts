/**
 * POST /api/admin/scrape-ofertas
 * Scraper de ofertas externas. Protegido por SCRAPE_API_KEY.
 * Se puede llamar manualmente o automatizar con cron (cron-job.org, Railway cron, etc.)
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Vercel Pro: hasta 300s; en free plan usa el máximo disponible
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeAdzuna } from '@/lib/scrapers/adzuna';
import { scrapeIndeed } from '@/lib/scrapers/indeed';
import { scrapeMercadoLibre, scrapeYPF, scrapeMcDonalds, scrapeMostaza, scrapeStarbucks, scrapeSanIsidro } from '@/lib/scrapers/empresas';
import { scrapeVicenteLopez, scrapeSanFernando, scrapeGCBA, scrapeEmpleoGobAr } from '@/lib/scrapers/municipios';
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

  // ── Indeed RSS (fuente principal — agrega Computrabajo, ZonaJobs, Bumeran, etc.) ──
  if (runAll || fuentes.includes('indeed')) {
    try {
      const items = await scrapeIndeed();
      if (debug) { debugItems.indeed = items; stats.indeed = items.length; }
      else stats.indeed = await saveListings('indeed', items);
    } catch (err) {
      errors.indeed = String(err);
    }
  }

  // ── Adzuna (desactivado — no cubre Argentina) ─────────────────────────────
  // if (runAll || fuentes.includes('adzuna')) { ... }

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

  // ── Vicente López ─────────────────────────────────────────────────────────
  if (runAll || fuentes.includes('vicentelopez')) {
    try {
      const items = await scrapeVicenteLopez();
      if (debug) { debugItems.vicentelopez = items; stats.vicentelopez = items.length; }
      else stats.vicentelopez = await saveListings('vicentelopez', items);
    } catch (err) {
      errors.vicentelopez = String(err);
    }
  }

  // ── San Fernando ──────────────────────────────────────────────────────────
  if (runAll || fuentes.includes('sanfernando')) {
    try {
      const items = await scrapeSanFernando();
      if (debug) { debugItems.sanfernando = items; stats.sanfernando = items.length; }
      else stats.sanfernando = await saveListings('sanfernando', items);
    } catch (err) {
      errors.sanfernando = String(err);
    }
  }

  // ── GCBA (Gobierno Ciudad de Buenos Aires) ────────────────────────────────
  if (runAll || fuentes.includes('gcba')) {
    try {
      const items = await scrapeGCBA();
      if (debug) { debugItems.gcba = items; stats.gcba = items.length; }
      else stats.gcba = await saveListings('gcba', items);
    } catch (err) {
      errors.gcba = String(err);
    }
  }

  // ── empleo.gob.ar (Ministerio de Trabajo Nacional) ────────────────────────
  if (runAll || fuentes.includes('empleogob')) {
    try {
      const items = await scrapeEmpleoGobAr();
      if (debug) { debugItems.empleogob = items; stats.empleogob = items.length; }
      else stats.empleogob = await saveListings('empleogob', items);
    } catch (err) {
      errors.empleogob = String(err);
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

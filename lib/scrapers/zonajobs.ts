/**
 * Scraper para ZonaJobs Argentina
 * zonajobs.com.ar
 */

import type { JobListing } from './computrabajo';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/html',
  'Accept-Language': 'es-AR,es;q=0.9',
};

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Scrape ZonaJobs via su API interna de búsqueda */
export async function scrapeZonaJobs(
  keywords: string[] = ['atencion al cliente', 'operario', 'cajero', 'repositor', 'mozo'],
  maxPerKw = 20,
): Promise<JobListing[]> {
  const results: JobListing[] = [];
  const seen = new Set<string>();

  for (const kw of keywords) {
    try {
      // ZonaJobs usa una API interna JSON
      const apiUrl = `https://api.zonajobs.com.ar/api/postulations/search?q=${encodeURIComponent(kw)}&page=1&perPage=${maxPerKw}&order=date&country=AR`;
      const res = await fetch(apiUrl, {
        headers: { ...HEADERS, 'x-zonajobs-source': 'web' },
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        const items = data?.data || data?.results || data?.postulations || [];
        for (const item of items) {
          const fuente_id = String(item.id || item.postulation_id || '');
          if (!fuente_id || seen.has(fuente_id)) continue;
          seen.add(fuente_id);

          results.push({
            fuente_id,
            titulo: clean(item.title || item.name || 'Oferta de trabajo'),
            empresa_nombre: clean(item.company?.name || item.company_name || 'Empresa no indicada'),
            descripcion: item.description ? clean(item.description.slice(0, 500)) : undefined,
            area: item.category?.name || kw,
            ciudad: item.location?.name || item.city || undefined,
            modalidad: item.modality || 'presencial',
            salario: item.salary || undefined,
            url_original: item.url || `https://www.zonajobs.com.ar/empleo-oferta-${fuente_id}.html`,
            logo_url: item.company?.logo || undefined,
          });
        }
      } else {
        // Fallback: HTML scraping
        await scrapeZonaJobsHtml(kw, results, seen);
      }
    } catch (err) {
      console.error(`[zonajobs] Error scraping "${kw}":`, err);
      // Intentar HTML como fallback
      try {
        await scrapeZonaJobsHtml(kw, results, seen);
      } catch {}
    }
  }

  return results;
}

async function scrapeZonaJobsHtml(
  kw: string,
  results: JobListing[],
  seen: Set<string>,
): Promise<void> {
  const url = `https://www.zonajobs.com.ar/empleos?q=${encodeURIComponent(kw)}`;
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
  if (!res.ok) return;
  const html = await res.text();

  // ZonaJobs renderiza server-side, buscar artículos de trabajo
  const cardRegex = /<div[^>]*class="[^"]*jobCard[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let m;
  while ((m = cardRegex.exec(html)) !== null) {
    const cardHtml = m[1];
    const idMatch = cardHtml.match(/data-id="(\d+)"/);
    const fuente_id = idMatch ? idMatch[1] : '';
    if (!fuente_id || seen.has(fuente_id)) continue;
    seen.add(fuente_id);

    const titleMatch = cardHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const titulo = titleMatch ? clean(titleMatch[1].replace(/<[^>]+>/g, '')) : 'Oferta de trabajo';

    const empresaMatch = cardHtml.match(/<p[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const empresa_nombre = empresaMatch
      ? clean(empresaMatch[1].replace(/<[^>]+>/g, ''))
      : 'Empresa no indicada';

    results.push({
      fuente_id,
      titulo,
      empresa_nombre,
      area: kw,
      url_original: `https://www.zonajobs.com.ar/empleo-oferta-${fuente_id}.html`,
    });
  }
}

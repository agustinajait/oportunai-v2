/**
 * Scraper para ZonaJobs Argentina
 * zonajobs.com.ar
 */

import type { JobListing } from './computrabajo';
import { scrapeFetch, cleanText } from './utils';

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
      const res = await scrapeFetch(apiUrl, {
        headers: { 'x-zonajobs-source': 'web', Accept: 'application/json' },
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
            titulo: cleanText(item.title || item.name || 'Oferta de trabajo'),
            empresa_nombre: cleanText(item.company?.name || item.company_name || 'Empresa no indicada'),
            descripcion: item.description ? cleanText(item.description.slice(0, 500)) : undefined,
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
  const res = await scrapeFetch(url);
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
    const titulo = titleMatch ? cleanText(titleMatch[1].replace(/<[^>]+>/g, '')) : 'Oferta de trabajo';

    const empresaMatch = cardHtml.match(/<p[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const empresa_nombre = empresaMatch
      ? cleanText(empresaMatch[1].replace(/<[^>]+>/g, ''))
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

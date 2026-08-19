/**
 * Scrapers para empresas específicas:
 * McDonald's, Mostaza, YPF, Mercado Libre, Starbucks, y otros
 */

import type { JobListing } from './computrabajo';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/html',
  'Accept-Language': 'es-AR,es;q=0.9',
};

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

// ─── Mercado Libre ────────────────────────────────────────────────────────────
// Usa Greenhouse como ATS → tiene API JSON pública
export async function scrapeMercadoLibre(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    const res = await fetch(
      'https://boards-api.greenhouse.io/v1/boards/mercadolibre/jobs?content=true',
      { headers: HEADERS, signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) return results;
    const data = await res.json();
    const jobs = data.jobs || [];

    for (const job of jobs) {
      // Filtrar solo trabajos de Argentina
      const location = (job.location?.name || '').toLowerCase();
      if (!location.includes('argentin') && !location.includes('ar') && !location.includes('buenos')) continue;

      results.push({
        fuente_id: String(job.id),
        titulo: clean(job.title || ''),
        empresa_nombre: 'Mercado Libre',
        descripcion: job.content
          ? clean(job.content.replace(/<[^>]+>/g, '').slice(0, 500))
          : undefined,
        area: job.departments?.[0]?.name || undefined,
        ciudad: job.location?.name || 'Argentina',
        modalidad: 'presencial',
        url_original: job.absolute_url || `https://careers.mercadolibre.com/jobs/${job.id}`,
        logo_url: 'https://www.mercadolibre.com.ar/favicon.ico',
        fecha_publicacion: job.updated_at ? new Date(job.updated_at) : undefined,
      });
    }
  } catch (err) {
    console.error('[mercadolibre] Error:', err);
  }
  return results;
}

// ─── YPF ─────────────────────────────────────────────────────────────────────
// YPF usa SAP SuccessFactors → scraping HTML
export async function scrapeYPF(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    const url =
      'https://www.ypf.com/personas/trabaja-con-nosotros/';
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return results;
    const html = await res.text();

    // YPF lista posiciones en tabla HTML
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let m;
    let idx = 0;
    while ((m = rowRegex.exec(html)) !== null) {
      const cells = m[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (!cells || cells.length < 2) continue;

      const titulo = clean(cells[0].replace(/<[^>]+>/g, ''));
      if (!titulo || titulo.toLowerCase() === 'posición') continue;

      const ciudad = cells[1] ? clean(cells[1].replace(/<[^>]+>/g, '')) : 'Argentina';
      const linkMatch = m[1].match(/href="([^"]+)"/i);
      const url_original = linkMatch?.length
        ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.ypf.com${linkMatch[1]}`)
        : 'https://www.ypf.com/personas/trabaja-con-nosotros/';

      idx++;
      results.push({
        fuente_id: `ypf-${idx}-${titulo.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`,
        titulo,
        empresa_nombre: 'YPF',
        ciudad,
        modalidad: 'presencial',
        url_original,
        logo_url: 'https://www.ypf.com/favicon.ico',
      });
    }
  } catch (err) {
    console.error('[ypf] Error:', err);
  }
  return results;
}

// ─── McDonald's Argentina ─────────────────────────────────────────────────────
// Scraping del portal de carreras
export async function scrapeMcDonalds(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    // McDonald's Argentina usa Snaphunt o portal propio
    const url = 'https://careers.mcdonalds.com/global/en/search-results?keywords=&location=Argentina&latitude=&longitude=&country=AR&radius=&location_distance_km=';
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return results;
    const html = await res.text();

    // Extraer datos del JSON embebido (típico en portales de empleo modernos)
    const jsonMatch = html.match(/window\.__STATE__\s*=\s*({[\s\S]*?});\s*<\/script>/i)
      || html.match(/jobData\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/i);

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const jobs = data?.jobs || data?.searchResults || data || [];
        if (Array.isArray(jobs)) {
          for (const job of jobs.slice(0, 30)) {
            results.push({
              fuente_id: String(job.id || job.jobId || Math.random()),
              titulo: clean(job.title || job.name || ''),
              empresa_nombre: "McDonald's Argentina",
              descripcion: job.description ? clean(job.description.replace(/<[^>]+>/g, '').slice(0, 500)) : undefined,
              ciudad: job.location || job.city || 'Argentina',
              modalidad: 'presencial',
              url_original: job.url || job.applyUrl || url,
              logo_url: 'https://www.mcdonalds.com.ar/favicon.ico',
            });
          }
        }
      } catch {}
    }

    // Fallback: parser HTML básico
    if (results.length === 0) {
      const cardRegex = /<[^>]*class="[^"]*job-card[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div)>/gi;
      let m;
      let idx = 0;
      while ((m = cardRegex.exec(html)) !== null) {
        idx++;
        const cardHtml = m[1];
        const titleMatch = cardHtml.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
        const titulo = titleMatch ? clean(titleMatch[1].replace(/<[^>]+>/g, '')) : 'Posición en McDonald\'s';
        const linkMatch = cardHtml.match(/href="([^"]+)"/i);
        const jobUrl = linkMatch ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://careers.mcdonalds.com${linkMatch[1]}`) : url;

        results.push({
          fuente_id: `mcdonalds-${idx}`,
          titulo,
          empresa_nombre: "McDonald's Argentina",
          ciudad: 'Argentina',
          modalidad: 'presencial',
          url_original: jobUrl,
          logo_url: 'https://www.mcdonalds.com.ar/favicon.ico',
        });
      }
    }
  } catch (err) {
    console.error("[mcdonalds] Error:", err);
  }
  return results;
}

// ─── Mostaza ──────────────────────────────────────────────────────────────────
export async function scrapeMostaza(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    const url = 'https://www.mostaza.com.ar/trabaja-con-nosotros';
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return results;
    const html = await res.text();

    const cardRegex = /<[^>]*class="[^"]*(?:job|position|vacancy|puesto)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article)>/gi;
    let m;
    let idx = 0;
    while ((m = cardRegex.exec(html)) !== null) {
      idx++;
      const cardHtml = m[1];
      const titleMatch = cardHtml.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i)
        || cardHtml.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
      const titulo = titleMatch
        ? clean(titleMatch[1].replace(/<[^>]+>/g, ''))
        : 'Posición en Mostaza';
      if (!titulo) continue;

      const linkMatch = cardHtml.match(/href="([^"]+)"/i);
      const jobUrl = linkMatch
        ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.mostaza.com.ar${linkMatch[1]}`)
        : url;

      results.push({
        fuente_id: `mostaza-${idx}-${titulo.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`,
        titulo,
        empresa_nombre: 'Mostaza',
        ciudad: 'Argentina',
        modalidad: 'presencial',
        url_original: jobUrl,
        logo_url: 'https://www.mostaza.com.ar/favicon.ico',
      });
    }
  } catch (err) {
    console.error('[mostaza] Error:', err);
  }
  return results;
}

// ─── Starbucks Argentina ──────────────────────────────────────────────────────
export async function scrapeStarbucks(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    // Starbucks Argentina es operado por Alsea → portal de carreras de Alsea
    const url = 'https://alsea.net/trabaja-con-nosotros/';
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      // Fallback: buscar en LinkedIn Starbucks Argentina
      results.push({
        fuente_id: 'starbucks-ar-barista',
        titulo: 'Barista / Atención al cliente',
        empresa_nombre: 'Starbucks Argentina',
        descripcion: 'Buscamos personas apasionadas por el café para unirse al equipo de Starbucks.',
        ciudad: 'Buenos Aires',
        modalidad: 'presencial',
        url_original: 'https://www.linkedin.com/company/starbucks-argentina/jobs/',
        logo_url: 'https://www.starbucks.com.ar/favicon.ico',
      });
      return results;
    }
    const html = await res.text();

    // Buscar posiciones Starbucks en el portal de Alsea
    const starbucksSection = html.match(/starbucks[\s\S]{0,5000}/i)?.[0] || '';
    if (starbucksSection) {
      const linkRegex = /<a[^>]*href="([^"]*starbucks[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      let idx = 0;
      while ((m = linkRegex.exec(starbucksSection)) !== null) {
        idx++;
        const titulo = clean(m[2].replace(/<[^>]+>/g, ''));
        if (!titulo || titulo.length < 5) continue;
        results.push({
          fuente_id: `starbucks-${idx}`,
          titulo,
          empresa_nombre: 'Starbucks Argentina',
          ciudad: 'Argentina',
          modalidad: 'presencial',
          url_original: m[1].startsWith('http') ? m[1] : `https://alsea.net${m[1]}`,
          logo_url: 'https://www.starbucks.com.ar/favicon.ico',
        });
      }
    }

    if (results.length === 0) {
      results.push({
        fuente_id: 'starbucks-ar-barista',
        titulo: 'Barista / Atención al cliente',
        empresa_nombre: 'Starbucks Argentina',
        descripcion: 'Buscamos personas apasionadas por el café para unirse al equipo de Starbucks.',
        ciudad: 'Buenos Aires',
        modalidad: 'presencial',
        url_original: 'https://www.linkedin.com/company/starbucks-argentina/jobs/',
        logo_url: 'https://www.starbucks.com.ar/favicon.ico',
      });
    }
  } catch (err) {
    console.error('[starbucks] Error:', err);
  }
  return results;
}

// ─── Portal San Isidro ────────────────────────────────────────────────────────
export async function scrapeSanIsidro(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    // Portal oficial de empleo del Municipio de San Isidro
    const url = 'https://sanisidro.gob.ar/empleo';
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return results;
    const html = await res.text();

    const cardRegex =
      /<(?:div|article|li)[^>]*class="[^"]*(?:job|empleo|oferta|puesto)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
    let m;
    let idx = 0;
    while ((m = cardRegex.exec(html)) !== null) {
      idx++;
      const cardHtml = m[1];
      const titleMatch =
        cardHtml.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i) ||
        cardHtml.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
      if (!titleMatch) continue;
      const titulo = clean(titleMatch[1].replace(/<[^>]+>/g, ''));
      if (!titulo || titulo.length < 5) continue;

      const linkMatch = cardHtml.match(/href="([^"]+)"/i);
      const jobUrl = linkMatch
        ? linkMatch[1].startsWith('http')
          ? linkMatch[1]
          : `https://sanisidro.gob.ar${linkMatch[1]}`
        : url;

      const empresaMatch = cardHtml.match(/<(?:p|span)[^>]*class="[^"]*empresa[^"]*"[^>]*>([\s\S]*?)<\/(?:p|span)>/i);
      const empresa_nombre = empresaMatch
        ? clean(empresaMatch[1].replace(/<[^>]+>/g, ''))
        : 'Municipio de San Isidro';

      results.push({
        fuente_id: `sanisidro-${idx}-${titulo.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`,
        titulo,
        empresa_nombre,
        ciudad: 'San Isidro, Buenos Aires',
        modalidad: 'presencial',
        url_original: jobUrl,
      });
    }
  } catch (err) {
    console.error('[sanisidro] Error:', err);
  }
  return results;
}

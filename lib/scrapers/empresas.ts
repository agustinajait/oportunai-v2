/**
 * Scrapers para empresas específicas:
 * McDonald's, Mostaza, YPF, Mercado Libre, Starbucks, San Isidro
 */

import type { JobListing } from './computrabajo';
import { scrapeFetch, cleanText } from './utils';

// ─── Mercado Libre ────────────────────────────────────────────────────────────
// Scraping de su portal de carreras (careers.mercadolibre.com)
export async function scrapeMercadoLibre(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    // Intentar API interna que usa su SPA
    const apiUrl = 'https://careers.mercadolibre.com/api/jobs?country=AR&limit=30&offset=0';
    const res = await scrapeFetch(apiUrl, { skipProxy: true });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('json')) {
        const data = await res.json();
        const jobs = data.jobs || data.results || data.data || data || [];
        if (Array.isArray(jobs) && jobs.length > 0) {
          for (const job of jobs.slice(0, 30)) {
            results.push({
              fuente_id: String(job.id || job.jobId || `ml-${results.length}`),
              titulo: cleanText(job.title || job.name || ''),
              empresa_nombre: 'Mercado Libre',
              descripcion: job.description ? cleanText(job.description).slice(0, 500) : undefined,
              area: job.area || job.department || undefined,
              ciudad: job.location || job.city || 'Argentina',
              modalidad: 'presencial',
              url_original: job.url || job.applyUrl || `https://careers.mercadolibre.com/jobs/${job.id}`,
              logo_url: 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.22/mercadolibre/logo__large_plus.png',
            });
          }
          return results;
        }
      }
    }

    // Fallback: scraping HTML del portal
    const htmlRes = await scrapeFetch('https://careers.mercadolibre.com/jobs?country=Argentina', {
      skipProxy: false, // usar ScraperAPI para el HTML
    });
    if (!htmlRes.ok) return results;
    const html = await htmlRes.text();

    // Buscar jobs embebidos en JSON dentro del HTML (Next.js / Nuxt pattern)
    const jsonMatches = [
      html.match(/"jobs"\s*:\s*(\[[\s\S]{10,5000}?\])/),
      html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]{10,10000}?});/),
      html.match(/"results"\s*:\s*(\[[\s\S]{10,5000}?\])/),
    ];

    for (const match of jsonMatches) {
      if (!match) continue;
      try {
        const parsed = JSON.parse(match[1]);
        const items = Array.isArray(parsed) ? parsed : (parsed.jobs || parsed.results || []);
        for (const job of items.slice(0, 20)) {
          const titulo = cleanText(job.title || job.name || '');
          if (!titulo) continue;
          results.push({
            fuente_id: String(job.id || `ml-${results.length}`),
            titulo,
            empresa_nombre: 'Mercado Libre',
            ciudad: job.location || job.city || 'Argentina',
            modalidad: 'presencial',
            url_original: job.url || job.absoluteUrl || 'https://careers.mercadolibre.com/',
            logo_url: 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.22/mercadolibre/logo__large_plus.png',
          });
        }
        if (results.length > 0) break;
      } catch {}
    }
  } catch (err) {
    console.error('[mercadolibre] Error:', err);
  }
  return results;
}

// ─── YPF ─────────────────────────────────────────────────────────────────────
export async function scrapeYPF(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    const url = 'https://www.ypf.com/personas/trabaja-con-nosotros/';
    const res = await scrapeFetch(url);
    if (!res.ok) return results;
    const html = await res.text();

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let m;
    let idx = 0;
    while ((m = rowRegex.exec(html)) !== null) {
      const cells = m[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (!cells || cells.length < 2) continue;

      const titulo = cleanText(cells[0]);
      if (!titulo || titulo.toLowerCase() === 'posición') continue;

      const ciudad = cells[1] ? cleanText(cells[1]) : 'Argentina';
      const linkMatch = m[1].match(/href="([^"]+)"/i);
      const url_original = linkMatch?.length
        ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.ypf.com${linkMatch[1]}`)
        : url;

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
export async function scrapeMcDonalds(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    const url =
      'https://careers.mcdonalds.com/global/en/search-results?keywords=&location=Argentina&country=AR';
    const res = await scrapeFetch(url, { renderJs: true });
    if (!res.ok) return results;
    const html = await res.text();

    const jsonMatch =
      html.match(/window\.__STATE__\s*=\s*({[\s\S]*?});\s*<\/script>/i) ||
      html.match(/jobData\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/i);

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const jobs = data?.jobs || data?.searchResults || data || [];
        if (Array.isArray(jobs)) {
          for (const job of jobs.slice(0, 30)) {
            results.push({
              fuente_id: String(job.id || job.jobId || `mcdonalds-${results.length}`),
              titulo: cleanText(job.title || job.name || ''),
              empresa_nombre: "McDonald's Argentina",
              descripcion: job.description ? cleanText(job.description).slice(0, 500) : undefined,
              ciudad: job.location || job.city || 'Argentina',
              modalidad: 'presencial',
              url_original: job.url || job.applyUrl || url,
              logo_url: 'https://www.mcdonalds.com.ar/favicon.ico',
            });
          }
        }
      } catch {}
    }

    if (results.length === 0) {
      const cardRegex = /<[^>]*class="[^"]*job-card[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div)>/gi;
      let m;
      let idx = 0;
      while ((m = cardRegex.exec(html)) !== null) {
        idx++;
        const cardHtml = m[1];
        const titleMatch = cardHtml.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
        const titulo = titleMatch ? cleanText(titleMatch[1]) : "Posición en McDonald's";
        const linkMatch = cardHtml.match(/href="([^"]+)"/i);
        const jobUrl = linkMatch
          ? linkMatch[1].startsWith('http') ? linkMatch[1] : `https://careers.mcdonalds.com${linkMatch[1]}`
          : url;

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
    console.error('[mcdonalds] Error:', err);
  }
  return results;
}

// ─── Mostaza ──────────────────────────────────────────────────────────────────
export async function scrapeMostaza(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    const url = 'https://www.mostaza.com.ar/trabaja-con-nosotros';
    const res = await scrapeFetch(url);
    if (!res.ok) return results;
    const html = await res.text();

    const cardRegex =
      /<[^>]*class="[^"]*(?:job|position|vacancy|puesto)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article)>/gi;
    let m;
    let idx = 0;
    while ((m = cardRegex.exec(html)) !== null) {
      idx++;
      const cardHtml = m[1];
      const titleMatch =
        cardHtml.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i) ||
        cardHtml.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
      const titulo = titleMatch ? cleanText(titleMatch[1]) : 'Posición en Mostaza';
      if (!titulo) continue;

      const linkMatch = cardHtml.match(/href="([^"]+)"/i);
      const jobUrl = linkMatch
        ? linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.mostaza.com.ar${linkMatch[1]}`
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
    const url = 'https://alsea.net/trabaja-con-nosotros/';
    const res = await scrapeFetch(url);
    if (!res.ok) {
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

    const starbucksSection = html.match(/starbucks[\s\S]{0,5000}/i)?.[0] || '';
    if (starbucksSection) {
      const linkRegex = /<a[^>]*href="([^"]*starbucks[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      let idx = 0;
      while ((m = linkRegex.exec(starbucksSection)) !== null) {
        idx++;
        const titulo = cleanText(m[2]);
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
    const url = 'https://sanisidro.gob.ar/empleo';
    const res = await scrapeFetch(url);
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
      const titulo = cleanText(titleMatch[1]);
      if (!titulo || titulo.length < 5) continue;

      const linkMatch = cardHtml.match(/href="([^"]+)"/i);
      const jobUrl = linkMatch
        ? linkMatch[1].startsWith('http') ? linkMatch[1] : `https://sanisidro.gob.ar${linkMatch[1]}`
        : url;

      const empresaMatch = cardHtml.match(
        /<(?:p|span)[^>]*class="[^"]*empresa[^"]*"[^>]*>([\s\S]*?)<\/(?:p|span)>/i,
      );
      const empresa_nombre = empresaMatch ? cleanText(empresaMatch[1]) : 'Municipio de San Isidro';

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

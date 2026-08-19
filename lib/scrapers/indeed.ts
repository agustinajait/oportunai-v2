/**
 * Scraper via Indeed Argentina RSS feeds (gratuito, sin API key)
 * Indeed agrega Computrabajo, ZonaJobs, Bumeran y otros portales argentinos.
 * Feed: https://ar.indeed.com/jobs?q={keyword}&l={location}&sort=date&rss=1
 */

import type { JobListing } from './computrabajo';
import { cleanText } from './utils';

const KEYWORDS = [
  'cajero',
  'atencion al cliente',
  'operario',
  'mozo camarero',
  'repositor',
  'limpieza',
  'seguridad vigilancia',
  'administrativo',
  'almacen deposito',
  'cocina gastronomia',
];

const LOCATIONS = ['Buenos Aires', 'GBA', 'Córdoba', 'Rosario'];

function parseRSS(xml: string): JobListing[] {
  const results: JobListing[] = [];

  // Extraer items del RSS
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let m;

  while ((m = itemRegex.exec(xml)) !== null) {
    const item = m[1];

    // Título
    const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                       item.match(/<title>([\s\S]*?)<\/title>/);
    const titulo = titleMatch ? cleanText(titleMatch[1]) : '';
    if (!titulo) continue;

    // URL
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/) ||
                      item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);
    const url_original = linkMatch ? linkMatch[1].trim() : '';
    if (!url_original) continue;

    // ID único desde la URL
    const idMatch = url_original.match(/jk=([a-z0-9]+)/i);
    const fuente_id = idMatch ? idMatch[1] : url_original.slice(-20);

    // Empresa
    const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/) ||
                        item.match(/<author>([\s\S]*?)<\/author>/);
    const empresa_nombre = sourceMatch ? cleanText(sourceMatch[1]) : 'Empresa no indicada';

    // Descripción
    const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
                      item.match(/<description>([\s\S]*?)<\/description>/);
    const descripcion = descMatch ? cleanText(descMatch[1]).slice(0, 500) : undefined;

    // Ciudad
    const cityMatch = item.match(/<indeed:city>([\s\S]*?)<\/indeed:city>/) ||
                      item.match(/<location>([\s\S]*?)<\/location>/);
    const ciudad = cityMatch ? cleanText(cityMatch[1]) : undefined;

    // Salario
    const salaryMatch = item.match(/<indeed:salary>([\s\S]*?)<\/indeed:salary>/);
    const salario = salaryMatch ? cleanText(salaryMatch[1]) : undefined;

    // Fecha
    const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const fecha_publicacion = dateMatch ? new Date(dateMatch[1].trim()) : undefined;

    results.push({
      fuente_id,
      titulo,
      empresa_nombre,
      descripcion,
      ciudad,
      salario,
      modalidad: 'presencial',
      url_original,
      fecha_publicacion,
    });
  }

  return results;
}

export async function scrapeIndeed(
  keywords: string[] = KEYWORDS,
  locations: string[] = LOCATIONS,
): Promise<JobListing[]> {
  const results: JobListing[] = [];
  const seen = new Set<string>();

  for (const kw of keywords) {
    for (const loc of locations) {
      try {
        const params = new URLSearchParams({
          q: kw,
          l: loc,
          sort: 'date',
          rss: '1',
        });
        const url = `https://ar.indeed.com/jobs?${params}`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RSS reader)',
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) continue;
        const xml = await res.text();

        // Verificar que sea RSS válido
        if (!xml.includes('<rss') && !xml.includes('<channel')) continue;

        const items = parseRSS(xml);
        for (const item of items) {
          if (seen.has(item.fuente_id)) continue;
          seen.add(item.fuente_id);
          item.area = kw;
          results.push(item);
        }
      } catch (err) {
        console.error(`[indeed] Error "${kw}" en "${loc}":`, err);
      }
    }
  }

  return results;
}

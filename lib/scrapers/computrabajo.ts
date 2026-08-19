/**
 * Scraper para Computrabajo Argentina
 * Documentación: ar.computrabajo.com
 */

import { scrapeFetch, cleanText } from './utils';

export interface JobListing {
  fuente_id: string;
  titulo: string;
  empresa_nombre: string;
  descripcion?: string;
  area?: string;
  ciudad?: string;
  modalidad?: string;
  salario?: string;
  url_original: string;
  logo_url?: string;
  fecha_publicacion?: Date;
}

/** Extrae el fuente_id desde una URL de Computrabajo */
function extractId(url: string): string {
  const m = url.match(/\/(\d+)(?:\?|$)/);
  return m ? m[1] : url;
}

/** Scrape de una página de resultados de Computrabajo */
export async function scrapeComputrabajo(
  keywords: string[] = ['mozo', 'cajero', 'repositor', 'almacen', 'operario', 'atencion al cliente', 'limpieza'],
  maxPages = 2,
): Promise<JobListing[]> {
  const results: JobListing[] = [];
  const seen = new Set<string>();

  for (const kw of keywords) {
    for (let page = 1; page <= maxPages; page++) {
      try {
        const url =
          page === 1
            ? `https://ar.computrabajo.com/trabajo-de-${encodeURIComponent(kw.replace(/ /g, '-'))}`
            : `https://ar.computrabajo.com/trabajo-de-${encodeURIComponent(kw.replace(/ /g, '-'))}-p${page}`;

        const res = await scrapeFetch(url);
        if (!res.ok) break;
        const html = await res.text();

        // Extraer artículos de trabajo (Computrabajo usa <article class="box_offer">)
        const articleRegex = /<article[^>]*class="[^"]*box_offer[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
        let m;
        while ((m = articleRegex.exec(html)) !== null) {
          const articleHtml = m[1];

          // Título y URL
          const titleMatch = articleHtml.match(/<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
          if (!titleMatch) continue;
          const jobPath = titleMatch[1];
          const titulo = cleanText(titleMatch[2]);

          const fullUrl = jobPath.startsWith('http') ? jobPath : `https://ar.computrabajo.com${jobPath}`;
          const fuente_id = extractId(fullUrl);

          if (seen.has(fuente_id)) continue;
          seen.add(fuente_id);

          // Empresa
          const empresaMatch = articleHtml.match(
            /<p[^>]*class="[^"]*comp[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
          );
          const empresa_nombre = empresaMatch
            ? cleanText(empresaMatch[1])
            : 'Empresa no indicada';

          // Ciudad/ubicación
          const cityMatch = articleHtml.match(
            /<p[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
          );
          const ciudad = cityMatch ? cleanText(cityMatch[1]) : undefined;

          // Descripción snippet
          const descMatch = articleHtml.match(/<p[^>]*class="[^"]*fs16[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
          const descripcion = descMatch ? cleanText(descMatch[1]) : undefined;

          results.push({
            fuente_id,
            titulo,
            empresa_nombre,
            descripcion,
            area: kw,
            ciudad,
            url_original: fullUrl,
          });
        }

        // Si no hay más páginas (no hay paginador)
        if (!html.includes('siguiente')) break;
      } catch (err) {
        console.error(`[computrabajo] Error scraping "${kw}" p${page}:`, err);
        break;
      }
    }
  }

  return results;
}

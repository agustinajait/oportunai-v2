/**
 * Scraper para Computrabajo Argentina
 * Documentación: ar.computrabajo.com
 */

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

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-AR,es;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
};

/** Normaliza texto limpiando espacios extra */
function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
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

        const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
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
          const titulo = clean(titleMatch[2].replace(/<[^>]+>/g, ''));

          const fullUrl = jobPath.startsWith('http') ? jobPath : `https://ar.computrabajo.com${jobPath}`;
          const fuente_id = extractId(fullUrl);

          if (seen.has(fuente_id)) continue;
          seen.add(fuente_id);

          // Empresa
          const empresaMatch = articleHtml.match(
            /<p[^>]*class="[^"]*comp[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
          );
          const empresa_nombre = empresaMatch
            ? clean(empresaMatch[1].replace(/<[^>]+>/g, ''))
            : 'Empresa no indicada';

          // Ciudad/ubicación
          const cityMatch = articleHtml.match(
            /<p[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
          );
          const ciudad = cityMatch ? clean(cityMatch[1].replace(/<[^>]+>/g, '')) : undefined;

          // Descripción snippet
          const descMatch = articleHtml.match(/<p[^>]*class="[^"]*fs16[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
          const descripcion = descMatch ? clean(descMatch[1].replace(/<[^>]+>/g, '')) : undefined;

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

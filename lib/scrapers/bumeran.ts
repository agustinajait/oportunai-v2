/**
 * Scraper para Bumeran Argentina
 * bumeran.com.ar
 */

import type { JobListing } from './computrabajo';
import { scrapeFetch, cleanText } from './utils';

/** Scrape Bumeran via su API de búsqueda (JSON) */
export async function scrapeBumeran(
  keywords: string[] = ['atencion al cliente', 'operario', 'cajero', 'repositor', 'mozo'],
  maxPerKw = 20,
): Promise<JobListing[]> {
  const results: JobListing[] = [];
  const seen = new Set<string>();

  for (const kw of keywords) {
    try {
      // Bumeran tiene una API pública que devuelve JSON
      const apiUrl = `https://www.bumeran.com.ar/candidatos/postulaciones/buscar-empleos.json?filters%5Bkeyword%5D=${encodeURIComponent(kw)}&filters%5Bcountry%5D=ar&pageNumber=1&pageSize=${maxPerKw}`;

      const res = await scrapeFetch(apiUrl, {
        headers: { Referer: 'https://www.bumeran.com.ar/', Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        const items = data?.avisos || data?.results || data?.postings || [];

        for (const item of items) {
          const fuente_id = String(item.id || item.aviso_id || '');
          if (!fuente_id || seen.has(fuente_id)) continue;
          seen.add(fuente_id);

          const slug = item.avisoUrl || item.slug || `aviso-${fuente_id}`;
          const jobUrl = slug.startsWith('http')
            ? slug
            : `https://www.bumeran.com.ar/${slug}`;

          results.push({
            fuente_id,
            titulo: cleanText(item.titulo || item.title || 'Oferta de trabajo'),
            empresa_nombre: cleanText(
              item.empresa?.nombreFantasia || item.empresa?.nombre || item.company || 'Empresa no indicada',
            ),
            descripcion: item.descripcion
              ? cleanText(item.descripcion).slice(0, 500)
              : undefined,
            area: item.categoria?.nombreCategoria || kw,
            ciudad: item.lugar?.descripcion || item.ciudad || undefined,
            modalidad: item.tipoTrabajo?.includes('remoto') ? 'remoto' : 'presencial',
            salario: item.salario?.descripcion || undefined,
            url_original: jobUrl,
            logo_url: item.empresa?.logo || undefined,
            fecha_publicacion: item.fechaPublicacion ? new Date(item.fechaPublicacion) : undefined,
          });
        }
      }
    } catch (err) {
      console.error(`[bumeran] Error scraping "${kw}":`, err);
    }
  }

  return results;
}

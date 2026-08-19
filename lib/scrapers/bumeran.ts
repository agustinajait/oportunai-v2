/**
 * Scraper para Bumeran Argentina
 * bumeran.com.ar
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

      const res = await fetch(apiUrl, {
        headers: { ...HEADERS, Referer: 'https://www.bumeran.com.ar/' },
        signal: AbortSignal.timeout(15000),
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
            titulo: clean(item.titulo || item.title || 'Oferta de trabajo'),
            empresa_nombre: clean(
              item.empresa?.nombreFantasia || item.empresa?.nombre || item.company || 'Empresa no indicada',
            ),
            descripcion: item.descripcion
              ? clean(item.descripcion.replace(/<[^>]+>/g, '').slice(0, 500))
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

/**
 * Utilidades compartidas para scrapers.
 * Si existe SCRAPER_API_KEY, todos los fetch pasan por ScraperAPI
 * (evita bloqueos en Computrabajo, ZonaJobs, Bumeran, etc.)
 */

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

/**
 * Wrapper de fetch que pasa automáticamente por ScraperAPI si hay clave configurada.
 * Sin clave: fetch directo (puede ser bloqueado por portales con anti-bot).
 * Con clave: usa ScraperAPI como proxy con render JS opcional.
 */
export async function scrapeFetch(
  url: string,
  options: {
    headers?: Record<string, string>;
    renderJs?: boolean;         // activar si el sitio usa React/Vue (más lento)
    countryCode?: string;       // forzar IP de un país, ej: 'ar'
    timeoutMs?: number;
  } = {},
): Promise<Response> {
  const { headers = {}, renderJs = false, countryCode = 'ar', timeoutMs = 20000 } = options;

  if (SCRAPER_API_KEY) {
    // Construir URL de ScraperAPI
    const params = new URLSearchParams({
      api_key: SCRAPER_API_KEY,
      url,
      render: renderJs ? 'true' : 'false',
      country_code: countryCode,
    });
    const proxyUrl = `http://api.scraperapi.com?${params.toString()}`;
    return fetch(proxyUrl, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  // Sin ScraperAPI — fetch directo
  return fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,*/*',
      'Accept-Language': 'es-AR,es;q=0.9',
      ...headers,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/** Limpia texto removiendo espacios extra y tags HTML */
export function cleanText(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

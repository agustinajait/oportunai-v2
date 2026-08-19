/**
 * Utilidades compartidas para scrapers.
 * Si existe SCRAPER_API_KEY, todos los fetch pasan por ScraperAPI
 * (evita bloqueos en Computrabajo, ZonaJobs, Bumeran, etc.)
 */

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

/**
 * Wrapper de fetch que pasa automáticamente por ScraperAPI si hay clave configurada.
 * Usá skipProxy: true para APIs JSON que no necesitan proxy (Greenhouse, etc.)
 * Con clave: usa ScraperAPI como proxy con render JS opcional.
 */
export async function scrapeFetch(
  url: string,
  options: {
    headers?: Record<string, string>;
    renderJs?: boolean;     // activar si el sitio usa React/Vue (más lento, consume más créditos)
    countryCode?: string;   // forzar IP de un país, ej: 'ar'
    timeoutMs?: number;
    skipProxy?: boolean;    // true = fetch directo aunque haya SCRAPER_API_KEY (para JSON APIs)
  } = {},
): Promise<Response> {
  const {
    headers = {},
    renderJs = false,
    countryCode = 'ar',
    timeoutMs = 25000,
    skipProxy = false,
  } = options;

  const defaultHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/json,*/*',
    'Accept-Language': 'es-AR,es;q=0.9',
  };

  if (SCRAPER_API_KEY && !skipProxy) {
    const params = new URLSearchParams({
      api_key: SCRAPER_API_KEY,
      url,
      render: renderJs ? 'true' : 'false',
      country_code: countryCode,
    });
    const proxyUrl = `http://api.scraperapi.com?${params.toString()}`;
    return fetch(proxyUrl, {
      headers: { ...defaultHeaders, ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  // Fetch directo (sin proxy)
  return fetch(url, {
    headers: { ...defaultHeaders, ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/** Limpia texto removiendo espacios extra y tags HTML */
export function cleanText(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

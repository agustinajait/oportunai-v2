/**
 * Scraper via Adzuna API — agrega ofertas de múltiples portales argentinos
 * Docs: https://developer.adzuna.com/docs/search
 * Free tier: 250 requests/día
 */

import type { JobListing } from './computrabajo';

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;

const KEYWORDS = [
  'cajero',
  'atencion al cliente',
  'operario',
  'mozo',
  'repositor',
  'limpieza',
  'seguridad',
  'administrativo',
  'cocina',
  'almacen',
];

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  location: { display_name: string; area?: string[] };
  category: { label: string };
  company: { display_name: string };
  contract_time?: string; // 'full_time' | 'part_time'
  contract_type?: string; // 'permanent' | 'contract'
}

function salarioLabel(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;
  const fmt = (n: number) =>
    '$' + Math.round(n).toLocaleString('es-AR');
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Desde ${fmt(min)}`;
  if (max) return `Hasta ${fmt(max)}`;
}

export async function scrapeAdzuna(
  keywords: string[] = KEYWORDS,
  resultsPerKw = 10,
): Promise<JobListing[]> {
  if (!APP_ID || !APP_KEY) {
    console.error('[adzuna] Faltan ADZUNA_APP_ID / ADZUNA_APP_KEY');
    return [];
  }

  const results: JobListing[] = [];
  const seen = new Set<string>();

  for (const kw of keywords) {
    try {
      const params = new URLSearchParams({
        app_id: APP_ID,
        app_key: APP_KEY,
        results_per_page: String(resultsPerKw),
        what: kw,
        where: 'Argentina',
        content_type: 'application/json',
      });

      const url = `https://api.adzuna.com/v1/api/jobs/ar/search/1?${params}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.error(`[adzuna] HTTP ${res.status} para "${kw}"`);
        continue;
      }

      const data = await res.json();
      const jobs: AdzunaJob[] = data.results || [];

      for (const job of jobs) {
        if (seen.has(job.id)) continue;
        seen.add(job.id);

        const modalidad = job.contract_time === 'part_time' ? 'presencial' : 'presencial';

        results.push({
          fuente_id: job.id,
          titulo: job.title.trim(),
          empresa_nombre: job.company?.display_name || 'Empresa no indicada',
          descripcion: job.description
            ? job.description.replace(/<[^>]+>/g, '').slice(0, 500).trim()
            : undefined,
          area: job.category?.label || kw,
          ciudad: job.location?.display_name || 'Argentina',
          modalidad,
          salario: salarioLabel(job.salary_min, job.salary_max),
          url_original: job.redirect_url,
          fecha_publicacion: job.created ? new Date(job.created) : undefined,
        });
      }
    } catch (err) {
      console.error(`[adzuna] Error para "${kw}":`, err);
    }
  }

  return results;
}

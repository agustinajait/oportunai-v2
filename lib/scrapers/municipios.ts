/**
 * Scrapers para portales de empleo municipales y gobierno:
 * - Vicente López
 * - San Fernando
 * - Gobierno de la Ciudad de Buenos Aires (GCBA)
 * - empleo.gob.ar (Ministerio de Trabajo Nacional)
 */

import type { JobListing } from './computrabajo';
import { scrapeFetch, cleanText } from './utils';

// ─── Helper genérico para portales HTML simples ───────────────────────────────
async function scrapeGenericHtml(opts: {
  url: string;
  baseUrl: string;
  ciudad: string;
  empresa_nombre: string;
  fuente: string;
  cardSelector?: RegExp;
  titleSelector?: RegExp;
  linkSelector?: RegExp;
  descSelector?: RegExp;
}): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    const res = await scrapeFetch(opts.url);
    if (!res.ok) return results;
    const html = await res.text();

    const cardRegex = opts.cardSelector ||
      /<(?:div|article|li)[^>]*class="[^"]*(?:job|empleo|oferta|puesto|vacante|cargo|item)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;

    let m;
    let idx = 0;
    while ((m = cardRegex.exec(html)) !== null) {
      idx++;
      const cardHtml = m[1];

      const titleMatch =
        cardHtml.match(opts.titleSelector || /<h[2-5][^>]*>([\s\S]*?)<\/h[2-5]>/i) ||
        cardHtml.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i) ||
        cardHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
      if (!titleMatch) continue;
      const titulo = cleanText(titleMatch[1]);
      if (!titulo || titulo.length < 4) continue;

      const linkMatch = cardHtml.match(/href="([^"#][^"]+)"/i);
      const jobUrl = linkMatch
        ? linkMatch[1].startsWith('http') ? linkMatch[1] : `${opts.baseUrl}${linkMatch[1]}`
        : opts.url;

      const descMatch = cardHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const descripcion = descMatch ? cleanText(descMatch[1]).slice(0, 400) : undefined;

      results.push({
        fuente_id: `${opts.fuente}-${idx}-${titulo.toLowerCase().replace(/\s+/g, '-').slice(0, 25)}`,
        titulo,
        empresa_nombre: opts.empresa_nombre,
        descripcion,
        ciudad: opts.ciudad,
        modalidad: 'presencial',
        url_original: jobUrl,
      });
    }
  } catch (err) {
    console.error(`[${opts.fuente}] Error:`, err);
  }
  return results;
}

// ─── Vicente López ────────────────────────────────────────────────────────────
export async function scrapeVicenteLopez(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    // Portal oficial de empleo de Vicente López
    const urls = [
      'https://vicentelopez.gob.ar/empleo',
      'https://vicentelopez.gob.ar/trabajo',
      'https://vicentelopez.gob.ar/bolsa-de-trabajo',
    ];

    for (const url of urls) {
      const res = await scrapeFetch(url);
      if (!res.ok) continue;
      const html = await res.text();

      // Buscar cualquier lista de puestos/vacantes
      const cardRegex = /<(?:div|article|li)[^>]*class="[^"]*(?:job|empleo|oferta|puesto|vacante|work|view-row)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
      let m;
      let idx = 0;
      while ((m = cardRegex.exec(html)) !== null) {
        idx++;
        const cardHtml = m[1];
        const titleMatch = cardHtml.match(/<h[2-5][^>]*>([\s\S]*?)<\/h[2-5]>/i) ||
                           cardHtml.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
        if (!titleMatch) continue;
        const titulo = cleanText(titleMatch[1]);
        if (!titulo || titulo.length < 4) continue;

        const linkMatch = cardHtml.match(/href="([^"#][^"]+)"/i);
        const jobUrl = linkMatch
          ? linkMatch[1].startsWith('http') ? linkMatch[1] : `https://vicentelopez.gob.ar${linkMatch[1]}`
          : url;

        results.push({
          fuente_id: `vicentelopez-${idx}-${titulo.toLowerCase().replace(/\s+/g, '-').slice(0, 25)}`,
          titulo,
          empresa_nombre: 'Municipio de Vicente López',
          ciudad: 'Vicente López, Buenos Aires',
          modalidad: 'presencial',
          url_original: jobUrl,
        });
      }

      if (results.length > 0) break;
    }

    // Si no encontró nada, dejar registro de la página principal
    if (results.length === 0) {
      results.push({
        fuente_id: 'vicentelopez-empleo-main',
        titulo: 'Oportunidades de empleo - Municipio Vicente López',
        empresa_nombre: 'Municipio de Vicente López',
        descripcion: 'El municipio de Vicente López publica oportunidades de empleo en su portal oficial.',
        ciudad: 'Vicente López, Buenos Aires',
        modalidad: 'presencial',
        url_original: 'https://vicentelopez.gob.ar/empleo',
      });
    }
  } catch (err) {
    console.error('[vicentelopez] Error:', err);
  }
  return results;
}

// ─── San Fernando ─────────────────────────────────────────────────────────────
export async function scrapeSanFernando(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    const urls = [
      'https://sanfernando.gob.ar/empleo',
      'https://sanfernando.gob.ar/trabajo',
      'https://www.sanfernando.gob.ar/empleo',
    ];

    for (const url of urls) {
      const res = await scrapeFetch(url);
      if (!res.ok) continue;
      const html = await res.text();

      const cardRegex = /<(?:div|article|li)[^>]*class="[^"]*(?:job|empleo|oferta|puesto|vacante|work|view-row)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
      let m;
      let idx = 0;
      while ((m = cardRegex.exec(html)) !== null) {
        idx++;
        const cardHtml = m[1];
        const titleMatch = cardHtml.match(/<h[2-5][^>]*>([\s\S]*?)<\/h[2-5]>/i) ||
                           cardHtml.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
        if (!titleMatch) continue;
        const titulo = cleanText(titleMatch[1]);
        if (!titulo || titulo.length < 4) continue;

        const linkMatch = cardHtml.match(/href="([^"#][^"]+)"/i);
        const jobUrl = linkMatch
          ? linkMatch[1].startsWith('http') ? linkMatch[1] : `https://sanfernando.gob.ar${linkMatch[1]}`
          : url;

        results.push({
          fuente_id: `sanfernando-${idx}-${titulo.toLowerCase().replace(/\s+/g, '-').slice(0, 25)}`,
          titulo,
          empresa_nombre: 'Municipio de San Fernando',
          ciudad: 'San Fernando, Buenos Aires',
          modalidad: 'presencial',
          url_original: jobUrl,
        });
      }

      if (results.length > 0) break;
    }

    if (results.length === 0) {
      results.push({
        fuente_id: 'sanfernando-empleo-main',
        titulo: 'Oportunidades de empleo - Municipio San Fernando',
        empresa_nombre: 'Municipio de San Fernando',
        descripcion: 'El municipio de San Fernando publica oportunidades de empleo en su portal oficial.',
        ciudad: 'San Fernando, Buenos Aires',
        modalidad: 'presencial',
        url_original: 'https://sanfernando.gob.ar/empleo',
      });
    }
  } catch (err) {
    console.error('[sanfernando] Error:', err);
  }
  return results;
}

// ─── Gobierno de la Ciudad de Buenos Aires (GCBA) ────────────────────────────
// Portal: buenosaires.gob.ar/trabajo y portal de empleos públicos
export async function scrapeGCBA(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    // API de empleos del GCBA (fuente más confiable)
    const apiUrl = 'https://buenosaires.gob.ar/api/empleos?limit=50&offset=0';
    const apiRes = await scrapeFetch(apiUrl, { skipProxy: true });

    if (apiRes.ok) {
      const ct = apiRes.headers.get('content-type') || '';
      if (ct.includes('json')) {
        const data = await apiRes.json();
        const jobs = data.results || data.data || data || [];
        if (Array.isArray(jobs) && jobs.length > 0) {
          for (const job of jobs.slice(0, 50)) {
            const titulo = cleanText(String(job.title || job.titulo || job.nombre || ''));
            if (!titulo) continue;
            results.push({
              fuente_id: `gcba-${job.id || results.length}`,
              titulo,
              empresa_nombre: job.organismo || job.empresa || 'Gobierno de la Ciudad de Buenos Aires',
              descripcion: job.description ? cleanText(job.description).slice(0, 400) : undefined,
              area: job.area || job.categoria || undefined,
              ciudad: 'Buenos Aires, CABA',
              modalidad: 'presencial',
              url_original: job.url || job.link || 'https://buenosaires.gob.ar/trabajo',
            });
          }
          return results;
        }
      }
    }

    // Fallback: HTML del portal de trabajo
    const htmlUrls = [
      'https://buenosaires.gob.ar/trabajo/empleo-publico',
      'https://buenosaires.gob.ar/trabajo',
      'https://empleos.buenosaires.gob.ar',
    ];

    for (const url of htmlUrls) {
      const res = await scrapeFetch(url);
      if (!res.ok) continue;
      const html = await res.text();

      const cardRegex = /<(?:div|article|li)[^>]*class="[^"]*(?:job|empleo|oferta|puesto|vacante|card|item)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
      let m;
      let idx = 0;
      while ((m = cardRegex.exec(html)) !== null) {
        idx++;
        const cardHtml = m[1];
        const titleMatch = cardHtml.match(/<h[2-5][^>]*>([\s\S]*?)<\/h[2-5]>/i) ||
                           cardHtml.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
        if (!titleMatch) continue;
        const titulo = cleanText(titleMatch[1]);
        if (!titulo || titulo.length < 4) continue;

        const linkMatch = cardHtml.match(/href="([^"#][^"]+)"/i);
        const jobUrl = linkMatch
          ? linkMatch[1].startsWith('http') ? linkMatch[1] : `https://buenosaires.gob.ar${linkMatch[1]}`
          : url;

        const orgMatch = cardHtml.match(/<(?:p|span)[^>]*class="[^"]*(?:org|organismo|empresa|ministerio)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|span)>/i);
        const empresa_nombre = orgMatch ? cleanText(orgMatch[1]) : 'Gobierno de la Ciudad de Buenos Aires';

        results.push({
          fuente_id: `gcba-${idx}-${titulo.toLowerCase().replace(/\s+/g, '-').slice(0, 25)}`,
          titulo,
          empresa_nombre,
          ciudad: 'Buenos Aires, CABA',
          modalidad: 'presencial',
          url_original: jobUrl,
        });
      }

      if (results.length > 0) break;
    }

    if (results.length === 0) {
      results.push({
        fuente_id: 'gcba-empleo-publico',
        titulo: 'Empleos públicos - Gobierno de la Ciudad de Buenos Aires',
        empresa_nombre: 'Gobierno de la Ciudad de Buenos Aires',
        descripcion: 'El GCBA publica convocatorias para empleo público en su portal oficial.',
        ciudad: 'Buenos Aires, CABA',
        modalidad: 'presencial',
        url_original: 'https://buenosaires.gob.ar/trabajo/empleo-publico',
      });
    }
  } catch (err) {
    console.error('[gcba] Error:', err);
  }
  return results;
}

// ─── empleo.gob.ar (Ministerio de Trabajo Nacional) ──────────────────────────
// Portal oficial del gobierno nacional con muchas ofertas privadas y públicas
export async function scrapeEmpleoGobAr(): Promise<JobListing[]> {
  const results: JobListing[] = [];
  try {
    // API del portal nacional de empleo
    const keywords = ['mozo', 'cajero', 'limpieza', 'administrativo', 'repositor', 'seguridad', 'operario', 'atencion al cliente'];

    for (const kw of keywords) {
      try {
        const apiUrl = `https://www.empleo.gob.ar/empleos/buscar?q=${encodeURIComponent(kw)}&format=json&limit=20`;
        const apiRes = await scrapeFetch(apiUrl, { skipProxy: true });

        if (apiRes.ok) {
          const ct = apiRes.headers.get('content-type') || '';
          if (ct.includes('json')) {
            const data = await apiRes.json();
            const jobs = data.results || data.empleos || data.data || data || [];
            if (Array.isArray(jobs)) {
              for (const job of jobs.slice(0, 20)) {
                const titulo = cleanText(String(job.titulo || job.title || job.puesto || ''));
                if (!titulo) continue;
                const fuente_id = `empleogob-${job.id || `${kw}-${results.length}`}`;
                results.push({
                  fuente_id,
                  titulo,
                  empresa_nombre: job.empresa || job.empleador || 'Empresa publicada en empleo.gob.ar',
                  descripcion: job.descripcion ? cleanText(job.descripcion).slice(0, 400) : undefined,
                  area: kw,
                  ciudad: job.localidad || job.ciudad || job.provincia || 'Argentina',
                  modalidad: 'presencial',
                  salario: job.salario || undefined,
                  url_original: job.url || job.link || `https://www.empleo.gob.ar/empleos/${job.id || ''}`,
                });
              }
              continue;
            }
          }
        }

        // Fallback HTML
        const htmlUrl = `https://www.empleo.gob.ar/empleos/buscar?q=${encodeURIComponent(kw)}`;
        const htmlRes = await scrapeFetch(htmlUrl);
        if (!htmlRes.ok) continue;
        const html = await htmlRes.text();

        const cardRegex = /<(?:div|article|li)[^>]*class="[^"]*(?:job|empleo|oferta|resultado|item-empleo)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
        let m;
        let idx = 0;
        while ((m = cardRegex.exec(html)) !== null) {
          idx++;
          const cardHtml = m[1];
          const titleMatch = cardHtml.match(/<h[2-5][^>]*>([\s\S]*?)<\/h[2-5]>/i) ||
                             cardHtml.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
          if (!titleMatch) continue;
          const titulo = cleanText(titleMatch[1]);
          if (!titulo || titulo.length < 4) continue;

          const linkMatch = cardHtml.match(/href="([^"#][^"]+)"/i);
          const jobUrl = linkMatch
            ? linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.empleo.gob.ar${linkMatch[1]}`
            : htmlUrl;

          const empresaMatch = cardHtml.match(/<(?:p|span|div)[^>]*class="[^"]*empresa[^"]*"[^>]*>([\s\S]*?)<\/(?:p|span|div)>/i);
          const empresa_nombre = empresaMatch ? cleanText(empresaMatch[1]) : 'Empresa publicada en empleo.gob.ar';

          const ciudadMatch = cardHtml.match(/<(?:p|span)[^>]*class="[^"]*(?:localidad|ciudad|ubicacion)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|span)>/i);
          const ciudad = ciudadMatch ? cleanText(ciudadMatch[1]) : 'Argentina';

          // Buscar email de contacto en el card
          const emailMatch = cardHtml.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          const descripcion = emailMatch ? `Contacto: ${emailMatch[1]}` : undefined;

          results.push({
            fuente_id: `empleogob-${kw}-${idx}`,
            titulo,
            empresa_nombre,
            descripcion,
            area: kw,
            ciudad,
            modalidad: 'presencial',
            url_original: jobUrl,
          });
        }
      } catch (err) {
        console.error(`[empleogob] Error keyword "${kw}":`, err);
      }
    }
  } catch (err) {
    console.error('[empleogob] Error general:', err);
  }
  return results;
}

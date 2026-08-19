/**
 * GET /api/admin/scrape-test?url=...&key=...
 * Hace un fetch a la URL dada y devuelve los primeros 2000 chars de la respuesta.
 * Solo para diagnóstico — protegido por SCRAPE_API_KEY.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const SCRAPE_KEY = process.env.SCRAPE_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!SCRAPE_KEY || key !== SCRAPE_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const targetUrl = searchParams.get('url');
  if (!targetUrl) {
    return NextResponse.json({ error: 'Falta ?url=' }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/html, */*',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    });

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    // Si es JSON, parsearlo
    let parsed = null;
    if (contentType.includes('json')) {
      try { parsed = JSON.parse(text); } catch {}
    }

    return NextResponse.json({
      status: res.status,
      contentType,
      length: text.length,
      preview: text.slice(0, 2000),
      parsed: parsed ? JSON.stringify(parsed).slice(0, 2000) : null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

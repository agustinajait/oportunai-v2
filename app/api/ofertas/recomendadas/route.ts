/**
 * GET /api/ofertas/recomendadas
 *
 * Devuelve ofertas personalizadas según el perfil del usuario logueado.
 * Estrategia:
 *   1. Extrae keywords del cargo/habilidades del cv_datos
 *   2. Busca matches en OfertaExterna + Oferta (internas)
 *   3. Si no hay resultados (perfil vacío o sin matches), devuelve las
 *      20 ofertas más recientes como fallback
 *
 * Requiere sesión activa.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Misma tabla de sinónimos que /api/buscar para coherencia
const SINONIMOS: Record<string, string[]> = {
  mozo:       ['mozo', 'mozos', 'camarero', 'camarera', 'camareros', 'moza'],
  cajero:     ['cajero', 'cajera', 'caja', 'cajeros'],
  repositor:  ['repositor', 'repositora', 'reposicion', 'repositores'],
  operario:   ['operario', 'operaria', 'operarios', 'produccion', 'manufactura'],
  limpieza:   ['limpieza', 'mucama', 'maestranza', 'ordenanza'],
  seguridad:  ['seguridad', 'vigilador', 'guardia', 'vigilancia'],
  cocinero:   ['cocinero', 'cocinera', 'cocina', 'chef', 'pastelero'],
  logistica:  ['logistica', 'deposito', 'almacen', 'distribucion', 'repartidor'],
  ventas:     ['ventas', 'vendedor', 'vendedora', 'comercial', 'local'],
  atencion:   ['atencion', 'cliente', 'recepcion', 'call center', 'telemarketing'],
  encargado:  ['encargado', 'encargada', 'supervisor', 'jefe', 'responsable'],
  administrativo: ['administrativo', 'administrativa', 'secretaria', 'oficina'],
};

const STOP_WORDS = new Set([
  'en', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'del', 'al', 'y', 'o',
  'con', 'sin', 'por', 'para', 'que', 'se', 'es', 'a', 'me', 'mi', 'su',
]);

function expandKeywords(words: string[]): string[] {
  const out = new Set<string>();
  for (const w of words) {
    const wn = w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (wn.length <= 2 || STOP_WORDS.has(wn)) continue;
    // Intentar expandir con sinónimos
    let expanded = false;
    for (const synonyms of Object.values(SINONIMOS)) {
      if (synonyms.some(s => wn.includes(s) || s.includes(wn))) {
        synonyms.forEach(s => out.add(s));
        expanded = true;
        break;
      }
    }
    if (!expanded) out.add(wn);
  }
  return Array.from(out).slice(0, 10);
}

interface Resultado {
  id: string;
  tipo: 'interna' | 'externa';
  titulo: string;
  empresa_nombre: string;
  logo_url?: string | null;
  ciudad?: string | null;
  area?: string | null;
  modalidad?: string | null;
  descripcion?: string | null;
  url: string;
  fuente: string;
  salario?: string | null;
}

async function ofertasRecientes(limit: number): Promise<Resultado[]> {
  const [externas, internas] = await Promise.all([
    prisma.ofertaExterna.findMany({
      where: { activa: true },
      orderBy: { created_at: 'desc' },
      take: limit,
    }),
    prisma.oferta.findMany({
      where: { estado: 'activa' },
      include: { empresa: { select: { nombre: true, logo_url: true } } },
      orderBy: { created_at: 'desc' },
      take: Math.floor(limit / 4), // pocas internas para no dominar
    }),
  ]);
  return [
    ...internas.map(o => ({
      id: o.id, tipo: 'interna' as const,
      titulo: o.titulo, empresa_nombre: o.nombre_marca || o.empresa.nombre,
      logo_url: o.logo_url || o.empresa.logo_url,
      ciudad: o.ciudad, area: o.area, modalidad: o.modalidad,
      descripcion: o.descripcion?.slice(0, 200),
      url: `/ofertas/${o.id}`, fuente: 'oportunai',
    })),
    ...externas.map(o => ({
      id: o.id, tipo: 'externa' as const,
      titulo: o.titulo, empresa_nombre: o.empresa_nombre,
      logo_url: o.logo_url, ciudad: o.ciudad, area: o.area, modalidad: o.modalidad,
      descripcion: o.descripcion?.slice(0, 200),
      url: o.url_original, fuente: o.fuente, salario: o.salario,
    })),
  ].slice(0, limit);
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
  }

  const limit = 20;

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { cv_datos: true },
  });

  const cv = usuario?.cv_datos as {
    experiencia?: { cargo: string }[];
    habilidades?: string[];
    localidad?: string;
  } | null;

  // ── Construir keywords desde el perfil ────────────────────────────────────
  const rawWords: string[] = [];

  // Cargo de las últimas 2 experiencias
  cv?.experiencia?.slice(0, 2).forEach(e => {
    if (e.cargo) rawWords.push(...e.cargo.split(/\s+/));
  });

  // Primeras 3 habilidades
  cv?.habilidades?.slice(0, 3).forEach(h => rawWords.push(...h.split(/\s+/)));

  const keywords = expandKeywords(rawWords);
  const zona = cv?.localidad ?? null;

  // Sin keywords ni zona → fallback a recientes
  if (keywords.length === 0 && !zona) {
    const resultados = await ofertasRecientes(limit);
    return NextResponse.json({
      ok: true, total: resultados.length, resultados,
      modo: 'recientes',
      query_usado: null,
    });
  }

  // ── Buscar por keywords (sin filtro de zona para ser leniente) ─────────────
  const titleOr = keywords.map(kw => ({
    titulo: { contains: kw, mode: 'insensitive' as const },
  }));

  const [externas, internas] = await Promise.all([
    prisma.ofertaExterna.findMany({
      where: { activa: true, OR: titleOr },
      orderBy: { created_at: 'desc' },
      take: limit,
    }),
    prisma.oferta.findMany({
      where: {
        estado: 'activa',
        OR: keywords.flatMap(kw => [
          { titulo:      { contains: kw, mode: 'insensitive' as const } },
          { descripcion: { contains: kw, mode: 'insensitive' as const } },
          { area:        { contains: kw, mode: 'insensitive' as const } },
        ]),
      },
      include: { empresa: { select: { nombre: true, logo_url: true } } },
      orderBy: { created_at: 'desc' },
      take: Math.floor(limit / 4),
    }),
  ]);

  let resultados: Resultado[] = [
    ...internas.map(o => ({
      id: o.id, tipo: 'interna' as const,
      titulo: o.titulo, empresa_nombre: o.nombre_marca || o.empresa.nombre,
      logo_url: o.logo_url || o.empresa.logo_url,
      ciudad: o.ciudad, area: o.area, modalidad: o.modalidad,
      descripcion: o.descripcion?.slice(0, 200),
      url: `/ofertas/${o.id}`, fuente: 'oportunai',
    })),
    ...externas.map(o => ({
      id: o.id, tipo: 'externa' as const,
      titulo: o.titulo, empresa_nombre: o.empresa_nombre,
      logo_url: o.logo_url, ciudad: o.ciudad, area: o.area, modalidad: o.modalidad,
      descripcion: o.descripcion?.slice(0, 200),
      url: o.url_original, fuente: o.fuente, salario: o.salario,
    })),
  ].slice(0, limit);

  // Si no hay matches → fallback a recientes
  if (resultados.length === 0) {
    resultados = await ofertasRecientes(limit);
    return NextResponse.json({
      ok: true, total: resultados.length, resultados,
      modo: 'recientes',
      query_usado: null,
    });
  }

  const query_usado = keywords.slice(0, 3).join(', ') + (zona ? ` · ${zona}` : '');

  return NextResponse.json({
    ok: true, total: resultados.length, resultados,
    modo: 'perfil',
    query_usado,
  });
}

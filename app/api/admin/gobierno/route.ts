/**
 * GET /api/admin/gobierno
 * Datos agregados del semáforo Korai para el dashboard de gobierno.
 * Solo admin y super_admin.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DIMS = ['empleo', 'educacion', 'ingresos', 'salud', 'vivienda', 'red'] as const;
type Dim = typeof DIMS[number];
type Color = 'verde' | 'amarillo' | 'rojo';

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const [totalUsuarios, usuariosConDiag, usuariosWA, usuariosRaw] = await Promise.all([
    prisma.usuario.count({ where: { role: 'user' } }),
    prisma.usuario.count({
      where: { role: 'user', korai_semaforo: { not: { equals: null } } },
    }),
    prisma.usuario.count({ where: { role: 'user', whatsapp_activo: true } }),
    prisma.usuario.findMany({
      where: { role: 'user', korai_semaforo: { not: { equals: null } } },
      select: { id: true, korai_semaforo: true, created_at: true },
    }),
  ]);

  // ── Inicializar contadores ──────────────────────────────
  const porDimension: Record<Dim, { verde: number; amarillo: number; rojo: number; sin_dato: number }> = {
    empleo:    { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    educacion: { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    ingresos:  { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    salud:     { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    vivienda:  { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    red:       { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
  };

  // Estado general por persona: crítico (≥1 rojo) / alerta (≥1 amarillo) / estable (todo verde)
  let estadoCritico = 0, estadoAlerta = 0, estadoEstable = 0;

  // Estadísticas sociales
  const situacionLaboral: Record<string, number> = {};
  const ingresoHogar: Record<string, number> = {};
  const tipoVivienda: Record<string, number> = {};

  // Barrios
  const barriosMap: Record<string, { total: number; rojo: number; amarillo: number }> = {};

  // Voces del territorio
  const voces: { barrio: string; texto: string; fecha: string }[] = [];

  // ── Procesar usuarios ───────────────────────────────────
  const hace30 = new Date();
  hace30.setDate(hace30.getDate() - 30);
  let registradosUltimos30 = 0;

  for (const u of usuariosRaw) {
    if (new Date(u.created_at) >= hace30) registradosUltimos30++;

    const sem = u.korai_semaforo as Record<string, unknown> | null;
    if (!sem) continue;

    // Dimensiones
    let tieneRojo = false, tieneAmarillo = false;
    for (const dim of DIMS) {
      const color = sem[dim] as Color | undefined;
      if (color === 'verde' || color === 'amarillo' || color === 'rojo') {
        porDimension[dim][color]++;
        if (color === 'rojo') tieneRojo = true;
        if (color === 'amarillo') tieneAmarillo = true;
      } else {
        porDimension[dim].sin_dato++;
      }
    }

    // Estado general
    if (tieneRojo) estadoCritico++;
    else if (tieneAmarillo) estadoAlerta++;
    else estadoEstable++;

    // Sociodemográficos
    const sl = sem.situacion_laboral as string | undefined;
    if (sl) situacionLaboral[sl] = (situacionLaboral[sl] ?? 0) + 1;

    const ih = sem.ingreso_hogar as string | undefined;
    if (ih) ingresoHogar[ih] = (ingresoHogar[ih] ?? 0) + 1;

    const tv = sem.tipo_vivienda as string | undefined;
    if (tv) tipoVivienda[tv] = (tipoVivienda[tv] ?? 0) + 1;

    // Barrios
    const barrio = (sem.barrio as string | undefined) ?? '';
    if (barrio) {
      if (!barriosMap[barrio]) barriosMap[barrio] = { total: 0, rojo: 0, amarillo: 0 };
      barriosMap[barrio].total++;
      if (tieneRojo) barriosMap[barrio].rojo++;
      else if (tieneAmarillo) barriosMap[barrio].amarillo++;
    }

    // Voces
    const motivo = sem.motivo as string | undefined;
    if (motivo && motivo.trim()) {
      voces.push({
        barrio: barrio || 'Sin barrio',
        texto: motivo.trim(),
        fecha: (sem.ultima_actualizacion as string | undefined) ?? new Date(u.created_at).toISOString(),
      });
    }
  }

  // ── Ranking dimensiones ─────────────────────────────────
  const rankingCriticidad = DIMS.map(dim => {
    const d = porDimension[dim];
    const total = d.verde + d.amarillo + d.rojo;
    return {
      dim, rojo: d.rojo, amarillo: d.amarillo, verde: d.verde, total,
      pct_rojo:     pct(d.rojo,     total),
      pct_amarillo: pct(d.amarillo, total),
      pct_verde:    pct(d.verde,    total),
    };
  }).sort((a, b) => b.pct_rojo - a.pct_rojo);

  // ── Barrios top ─────────────────────────────────────────
  const porBarrio = Object.entries(barriosMap)
    .map(([barrio, d]) => ({
      barrio,
      total: d.total,
      rojo: d.rojo,
      amarillo: d.amarillo,
      pct_rojo: pct(d.rojo, d.total),
      pct_critico: pct(d.rojo, d.total),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  // ── Voces ordenadas por fecha desc ──────────────────────
  const vocesOrdenadas = voces
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 20);

  const totalConDiag = usuariosConDiag;

  return NextResponse.json({
    kpis: {
      total_usuarios:   totalUsuarios,
      con_diagnostico:  totalConDiag,
      whatsapp_activo:  usuariosWA,
      pct_diagnostico:  pct(totalConDiag, totalUsuarios),
      pct_wa:           pct(usuariosWA, totalUsuarios),
      registrados_30d:  registradosUltimos30,
    },
    estadoGeneral: {
      critico:  estadoCritico,
      alerta:   estadoAlerta,
      estable:  estadoEstable,
      pct_critico:  pct(estadoCritico, totalConDiag),
      pct_alerta:   pct(estadoAlerta,  totalConDiag),
      pct_estable:  pct(estadoEstable, totalConDiag),
    },
    porDimension,
    rankingCriticidad,
    estadisticasSociales: {
      situacion_laboral: situacionLaboral,
      ingreso_hogar:     ingresoHogar,
      tipo_vivienda:     tipoVivienda,
    },
    porBarrio,
    voces: vocesOrdenadas,
  });
}

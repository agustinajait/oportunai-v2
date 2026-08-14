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

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const [totalUsuarios, usuariosConDiag, usuariosWA, usuariosRaw] = await Promise.all([
    prisma.usuario.count({ where: { role: 'user' } }),
    prisma.usuario.count({
      where: {
        role: 'user',
        korai_semaforo: { not: { equals: null } },
      },
    }),
    prisma.usuario.count({ where: { role: 'user', whatsapp_activo: true } }),
    prisma.usuario.findMany({
      where: {
        role: 'user',
        korai_semaforo: { not: { equals: null } },
      },
      select: { korai_semaforo: true, created_at: true },
    }),
  ]);

  // Agregar por dimensión
  const porDimension: Record<Dim, { verde: number; amarillo: number; rojo: number; sin_dato: number }> = {
    empleo:    { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    educacion: { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    ingresos:  { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    salud:     { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    vivienda:  { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
    red:       { verde: 0, amarillo: 0, rojo: 0, sin_dato: 0 },
  };

  for (const u of usuariosRaw) {
    const sem = u.korai_semaforo as Record<string, unknown> | null;
    if (!sem) continue;
    for (const dim of DIMS) {
      const color = sem[dim] as Color | undefined;
      if (color === 'verde' || color === 'amarillo' || color === 'rojo') {
        porDimension[dim][color]++;
      } else {
        porDimension[dim].sin_dato++;
      }
    }
  }

  // Ranking de áreas más críticas (por % rojo)
  const rankingCriticidad = DIMS.map(dim => {
    const d = porDimension[dim];
    const total = d.verde + d.amarillo + d.rojo;
    return {
      dim,
      rojo: d.rojo,
      amarillo: d.amarillo,
      verde: d.verde,
      total,
      pct_rojo: total > 0 ? Math.round((d.rojo / total) * 100) : 0,
      pct_amarillo: total > 0 ? Math.round((d.amarillo / total) * 100) : 0,
      pct_verde: total > 0 ? Math.round((d.verde / total) * 100) : 0,
    };
  }).sort((a, b) => b.pct_rojo - a.pct_rojo);

  // Últimos 30 días
  const hace30 = new Date();
  hace30.setDate(hace30.getDate() - 30);
  const registradosUltimos30 = usuariosRaw.filter(
    u => new Date(u.created_at) >= hace30
  ).length;

  return NextResponse.json({
    kpis: {
      total_usuarios: totalUsuarios,
      con_diagnostico: usuariosConDiag,
      whatsapp_activo: usuariosWA,
      pct_diagnostico: totalUsuarios > 0 ? Math.round((usuariosConDiag / totalUsuarios) * 100) : 0,
      pct_wa: totalUsuarios > 0 ? Math.round((usuariosWA / totalUsuarios) * 100) : 0,
      registrados_30d: registradosUltimos30,
    },
    porDimension,
    rankingCriticidad,
  });
}

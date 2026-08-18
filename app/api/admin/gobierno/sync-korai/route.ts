/**
 * POST /api/admin/gobierno/sync-korai
 * Carga manual de semáforo Korai para un usuario específico (sin backfill automático).
 * Solo super_admin.
 *
 * Body: {
 *   email: string          // email del usuario en OportunAI
 *   semaforo: {
 *     empleo?:    'verde' | 'amarillo' | 'rojo'
 *     educacion?: 'verde' | 'amarillo' | 'rojo'
 *     ingresos?:  'verde' | 'amarillo' | 'rojo'
 *     salud?:     'verde' | 'amarillo' | 'rojo'
 *     vivienda?:  'verde' | 'amarillo' | 'rojo'
 *     red?:       'verde' | 'amarillo' | 'rojo'
 *   }
 *   situacion_laboral?: string
 *   ingreso_hogar?:     string
 *   tipo_vivienda?:     string
 *   barrio?:            string
 *   motivo?:            string
 * }
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DIMS = ['empleo', 'educacion', 'ingresos', 'salud', 'vivienda', 'red'] as const;
const COLORES = ['verde', 'amarillo', 'rojo'];

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 });
  }

  const body = await req.json();
  const { email, semaforo, situacion_laboral, ingreso_hogar, tipo_vivienda, barrio, motivo } = body;

  if (!email || !semaforo) {
    return NextResponse.json({ error: 'email y semaforo requeridos' }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, nombre_completo: true, korai_semaforo: true },
  });

  if (!usuario) {
    return NextResponse.json({ error: `Usuario no encontrado: ${email}` }, { status: 404 });
  }

  const actual = (usuario.korai_semaforo as Record<string, unknown>) ?? {};
  const nuevo: Record<string, unknown> = { ...actual };

  for (const dim of DIMS) {
    if (semaforo[dim] && COLORES.includes(semaforo[dim])) {
      nuevo[dim] = semaforo[dim];
    }
  }
  if (situacion_laboral) nuevo.situacion_laboral = situacion_laboral;
  if (ingreso_hogar)     nuevo.ingreso_hogar     = ingreso_hogar;
  if (tipo_vivienda)     nuevo.tipo_vivienda     = tipo_vivienda;
  if (barrio)            nuevo.barrio            = barrio;
  if (motivo)            nuevo.motivo            = motivo;
  nuevo.ultima_actualizacion = new Date().toISOString();
  nuevo.fuente = 'admin_sync';

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { korai_semaforo: nuevo },
  });

  return NextResponse.json({ ok: true, usuario: usuario.nombre_completo, semaforo: nuevo });
}

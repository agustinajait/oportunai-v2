/**
 * GET /api/admin/gobierno/candidatos?dim=empleo&color=rojo
 * Lista de candidatos filtrada por dimensión y color del semáforo.
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

  const { searchParams } = new URL(req.url);
  const dim = searchParams.get('dim') as Dim | null;
  const color = searchParams.get('color') as Color | null;

  if (!dim || !DIMS.includes(dim)) {
    return NextResponse.json({ error: 'Dimensión inválida' }, { status: 400 });
  }
  if (!color || !['verde', 'amarillo', 'rojo'].includes(color)) {
    return NextResponse.json({ error: 'Color inválido' }, { status: 400 });
  }

  const usuarios = await prisma.usuario.findMany({
    where: {
      role: 'user',
      korai_semaforo: { not: { equals: null } },
    },
    select: {
      id: true,
      nombre_completo: true,
      email: true,
      telefono: true,
      slug: true,
      korai_semaforo: true,
      whatsapp_activo: true,
      created_at: true,
    },
    orderBy: { nombre_completo: 'asc' },
  });

  const filtrados = usuarios.filter(u => {
    const sem = u.korai_semaforo as Record<string, unknown> | null;
    return sem && sem[dim] === color;
  });

  return NextResponse.json({
    candidatos: filtrados.map(u => ({
      id: u.id,
      nombre_completo: u.nombre_completo,
      email: u.email,
      telefono: u.telefono,
      slug: u.slug,
      whatsapp_activo: u.whatsapp_activo,
      created_at: u.created_at,
      semaforo: u.korai_semaforo,
    })),
    total: filtrados.length,
  });
}

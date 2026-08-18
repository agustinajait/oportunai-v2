/**
 * GET /api/admin/gobierno/export
 * Exporta todos los candidatos con diagnóstico Korai como CSV.
 * Solo admin y super_admin.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DIMS = ['empleo', 'educacion', 'ingresos', 'salud', 'vivienda', 'red'] as const;

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const todosUsuarios = await prisma.usuario.findMany({
    where: { role: 'user' },
    select: {
      nombre_completo: true,
      email: true,
      telefono: true,
      slug: true,
      whatsapp_activo: true,
      created_at: true,
      korai_semaforo: true,
    },
    orderBy: { nombre_completo: 'asc' },
  });

  const headers = [
    'Nombre',
    'Email',
    'Teléfono',
    'Perfil (slug)',
    'WhatsApp activo',
    'Fecha registro',
    ...DIMS.map(d => `Semáforo ${d}`),
  ];

  const usuarios = todosUsuarios.filter(u => u.korai_semaforo !== null);

  const rows = usuarios.map(u => {
    const sem = u.korai_semaforo as Record<string, unknown> | null;
    return [
      escapeCsv(u.nombre_completo),
      escapeCsv(u.email),
      escapeCsv(u.telefono),
      escapeCsv(u.slug),
      u.whatsapp_activo ? 'Sí' : 'No',
      new Date(u.created_at).toLocaleDateString('es-AR'),
      ...DIMS.map(d => escapeCsv(sem?.[d] as string ?? '')),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="diagnosticos-korai-${fecha}.csv"`,
    },
  });
}

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const empresas = await prisma.empresa.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      miembros: {
        include: {
          usuario: {
            select: { id: true, nombre_completo: true, email: true, telefono: true, role: true },
          },
        },
      },
      _count: { select: { ofertas: true } },
      ofertas: {
        orderBy: { created_at: 'desc' },
        select: { id: true, titulo: true, estado: true, created_at: true, _count: { select: { postulaciones: true } } },
      },
    },
  });

  return NextResponse.json(empresas);
}

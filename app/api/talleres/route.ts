export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Returns talleres assigned to the logged-in user, with modulos.
// Used by the dashboard "Talleres Especiales" dropdown.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const relaciones = await prisma.tallerUsuario.findMany({
    where: { usuario_id: session.userId },
    include: {
      taller: {
        include: {
          modulos: { orderBy: [{ tipo_video: 'asc' }, { orden: 'asc' }] },
        },
      },
    },
    orderBy: { asignado_en: 'desc' },
  });

  return NextResponse.json(relaciones);
}


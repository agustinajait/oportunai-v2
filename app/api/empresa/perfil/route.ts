export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'empleador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const miembro = await prisma.empresaMiembro.findFirst({
    where: { usuario_id: session.userId },
    include: { empresa: true },
  });
  if (!miembro) return NextResponse.json({ error: 'Sin empresa' }, { status: 404 });
  return NextResponse.json({ empresa: miembro.empresa });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'empleador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const miembro = await prisma.empresaMiembro.findFirst({
    where: { usuario_id: session.userId },
  });
  if (!miembro) return NextResponse.json({ error: 'Sin empresa' }, { status: 404 });

  const body = await req.json();
  const empresa = await prisma.empresa.update({
    where: { id: miembro.empresa_id },
    data: {
      nombre: body.nombre,
      descripcion: body.descripcion || null,
      rubro: body.rubro || null,
      ciudad: body.ciudad || null,
      sitio_web: body.sitio_web || null,
    },
  });
  return NextResponse.json({ ok: true, empresa });
}

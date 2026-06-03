export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const rolesValidos = ['user', 'admin', 'empleador', 'super_admin'];
  if (body.role && !rolesValidos.includes(body.role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
  }

  const usuario = await prisma.usuario.update({
    where: { id: params.userId },
    data: { ...(body.role && { role: body.role }) },
    select: { id: true, role: true },
  });

  return NextResponse.json(usuario);
}

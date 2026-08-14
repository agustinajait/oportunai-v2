/**
 * DELETE /api/admin/usuarios/[id]
 * Solo super_admin puede eliminar usuarios. Prisma cascadea todos los datos relacionados.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = params;

  // No permitir que se borre a sí mismo
  if (id === session.userId) {
    return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombre_completo: true, email: true },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    await prisma.usuario.delete({ where: { id } });

    return NextResponse.json({ ok: true, deleted: usuario });
  } catch (error) {
    console.error('[admin/delete-usuario]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

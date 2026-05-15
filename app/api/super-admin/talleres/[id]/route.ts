import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  nombre:          z.string().min(3).max(100).optional(),
  descripcion:     z.string().max(300).optional(),
  activo:          z.boolean().optional(),
  habilita_cv:    z.boolean().optional(),
  habilita_pitch: z.boolean().optional(),
});

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const taller = await prisma.taller.findUnique({
    where: { id: params.id },
    include: {
      modulos: { orderBy: [{ tipo_video: 'asc' }, { orden: 'asc' }] },
      taller_usuarios: {
        include: { usuario: { select: { id: true, nombre_completo: true, email: true, slug: true } } },
        orderBy: { asignado_en: 'desc' },
      },
      _count: { select: { videos: true, taller_usuarios: true } },
    },
  });

  if (!taller) return NextResponse.json({ error: 'Taller no encontrado' }, { status: 404 });
  return NextResponse.json(taller);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const taller = await prisma.taller.update({
    where: { id: params.id },
    data: parsed.data,
    include: { modulos: { orderBy: [{ tipo_video: 'asc' }, { orden: 'asc' }] } },
  });

  return NextResponse.json(taller);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await prisma.taller.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

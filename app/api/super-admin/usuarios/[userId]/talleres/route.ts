export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type Params = { params: { userId: string } };

// GET — talleres del usuario con estado
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const relaciones = await prisma.tallerUsuario.findMany({
    where: { usuario_id: params.userId },
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

// POST — asignar un taller al usuario
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const schema = z.object({ taller_id: z.string(), notas: z.string().optional() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const relacion = await prisma.tallerUsuario.upsert({
    where: { usuario_id_taller_id: { usuario_id: params.userId, taller_id: parsed.data.taller_id } },
    update: { notas: parsed.data.notas },
    create: { usuario_id: params.userId, taller_id: parsed.data.taller_id, notas: parsed.data.notas },
    include: { taller: { select: { id: true, nombre: true } } },
  });

  return NextResponse.json(relacion, { status: 201 });
}

// PATCH — cambiar estado (asignado → completado → validado)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const schema = z.object({
    taller_id: z.string(),
    estado: z.enum(['asignado', 'completado', 'validado']),
    notas: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const relacion = await prisma.tallerUsuario.update({
    where: { usuario_id_taller_id: { usuario_id: params.userId, taller_id: parsed.data.taller_id } },
    data: {
      estado: parsed.data.estado,
      notas:  parsed.data.notas,
      validado_en: parsed.data.estado === 'validado' ? new Date() : undefined,
    },
    include: { taller: { select: { id: true, nombre: true } } },
  });

  return NextResponse.json(relacion);
}

// DELETE — desasignar taller
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { taller_id } = await req.json();
  await prisma.tallerUsuario.delete({
    where: { usuario_id_taller_id: { usuario_id: params.userId, taller_id } },
  });

  return NextResponse.json({ ok: true });
}

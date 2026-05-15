import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const moduloSchema = z.object({
  nombre_modulo: z.string().min(2).max(80).optional(),
  duracion_base: z.number().int().min(5).max(120).optional(),
  texto_guia:    z.string().min(5).max(300).optional(),
});

type Params = { params: { id: string; moduloId: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = moduloSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // Ensure modulo belongs to this taller
  const modulo = await prisma.tallerModulo.findFirst({
    where: { id: params.moduloId, taller_id: params.id },
  });
  if (!modulo) return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });

  const updated = await prisma.tallerModulo.update({
    where: { id: params.moduloId },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

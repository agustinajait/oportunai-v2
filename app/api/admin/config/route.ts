export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { configuracionVideoSchema } from '@/lib/validations';
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const config = await prisma.configuracionVideo.findMany({
    orderBy: [{ tipo_video: 'asc' }, { orden: 'asc' }],
  });

  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = configuracionVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await prisma.configuracionVideo.update({
    where: { id: parsed.data.id },
    data: {
      duracion_base: parsed.data.duracion_base,
      texto_guia: parsed.data.texto_guia,
    },
  });

  return NextResponse.json(updated);
}

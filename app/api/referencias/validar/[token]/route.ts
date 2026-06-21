export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const ref = await prisma.referencia.findUnique({
    where: { token: params.token },
    include: { usuario: { select: { nombre_completo: true, slug: true } } },
  });

  if (!ref) return NextResponse.json({ error: 'Link inválido' }, { status: 404 });

  return NextResponse.json({
    empresa_nombre: ref.empresa_nombre,
    referidor_nombre: ref.referidor_nombre,
    candidato: ref.usuario.nombre_completo,
    estado: ref.estado,
    fecha_validada: ref.fecha_validada,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const ref = await prisma.referencia.findUnique({ where: { token: params.token } });
  if (!ref) return NextResponse.json({ error: 'Link inválido' }, { status: 404 });
  if (ref.estado === 'validada') return NextResponse.json({ error: 'Ya fue validada' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  await prisma.referencia.update({
    where: { token: params.token },
    data: {
      estado: 'validada',
      fecha_validada: new Date(),
      mensaje: body.mensaje?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}

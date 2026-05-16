export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bioSchema } from '@/lib/validations';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const parsed = bioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const usuario = await prisma.usuario.update({
    where: { id: session.userId },
    data: { bio: parsed.data.bio },
    select: { bio: true },
  });

  return NextResponse.json(usuario);
}


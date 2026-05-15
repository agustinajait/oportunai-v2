import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: { userId: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const videos = await prisma.video.findMany({
    where: { user_id: params.userId },
    orderBy: { created_at: 'desc' },
    include: {
      taller: { select: { id: true, nombre: true } },
    },
  });

  return NextResponse.json(videos);
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'empleador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const documentos = await prisma.documento.findMany({
    where: { user_id: params.userId },
    select: { tipo: true, file_url: true, created_at: true },
  });

  return NextResponse.json({ documentos });
}
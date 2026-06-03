export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const TIPOS_VALIDOS = ['dni', 'antecedentes_penales', 'manipulacion_alimentos', 'libreta_sanitaria', 'otro'];

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const documentos = await prisma.documento.findMany({
    where: { user_id: session.userId },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ documentos });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { file_url, tipo } = await req.json();
  if (!file_url || !tipo) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  if (!TIPOS_VALIDOS.includes(tipo)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });

  const documento = await prisma.documento.upsert({
    where: { user_id_tipo: { user_id: session.userId, tipo: tipo as any } },
    create: { user_id: session.userId, tipo: tipo as any, file_url },
    update: { file_url },
  });

  return NextResponse.json({ ok: true, documento });
}

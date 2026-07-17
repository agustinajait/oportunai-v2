export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest, isSuperAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const items = await prisma.galeriaHome.findMany({ orderBy: { orden: 'asc' } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { src, label, big, orden } = await req.json();
  if (!src || !label) {
    return NextResponse.json({ error: 'src y label son requeridos' }, { status: 400 });
  }
  const item = await prisma.galeriaHome.create({
    data: { src, label, big: big ?? false, orden: orden ?? 0, activa: true },
  });
  return NextResponse.json({ ok: true, item });
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const email = new URL(req.url).searchParams.get('email') ?? '';
  const u = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, nombre_completo: true, email: true, role: true, korai_semaforo: true, korai_opt_in: true, whatsapp_activo: true },
  });
  if (!u) return NextResponse.json({ error: 'No encontrado', email });
  return NextResponse.json(u);
}

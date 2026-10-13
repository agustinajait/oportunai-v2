/**
 * POST /api/admin/activate-premium
 * Activa plan premium para un usuario por email.
 * Protegido por SCRAPE_API_KEY (reutiliza el secret de admin).
 * Usar solo para testing — borrar o deshabilitar en producción real.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-api-key');
  if (!secret || secret !== process.env.SCRAPE_API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { email } = await req.json() as { email: string };
  if (!email) return NextResponse.json({ error: 'Falta email' }, { status: 400 });

  const usuario = await prisma.usuario.update({
    where: { email },
    data: { pagado: true },
    select: { id: true, email: true, nombre_completo: true, pagado: true },
  });

  return NextResponse.json({ ok: true, usuario });
}

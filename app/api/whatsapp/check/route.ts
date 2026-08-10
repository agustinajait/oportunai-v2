/**
 * GET /api/whatsapp/check?telefono=549XXXXXXXXXX
 * Korai llama este endpoint para saber si un número pertenece
 * a un usuario de Oportunai con el bot activo.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const INTERNAL_KEY = process.env.OPORTUNAI_INTERNAL_KEY ?? '';

export async function GET(req: NextRequest) {
  // Validar key compartida con Korai
  const key = req.headers.get('x-internal-key') ?? '';
  if (!INTERNAL_KEY || key !== INTERNAL_KEY) {
    return NextResponse.json({ activo: false }, { status: 401 });
  }

  const telefono = req.nextUrl.searchParams.get('telefono') ?? '';
  if (!telefono) return NextResponse.json({ activo: false });

  // Normalizar número
  const digits = telefono.replace(/\D/g, '');
  const variantes = new Set([digits]);
  if (digits.startsWith('549')) variantes.add(digits.slice(3));
  if (digits.startsWith('54'))  variantes.add(digits.slice(2));

  let usuario = null;
  for (const v of variantes) {
    usuario = await prisma.usuario.findFirst({
      where: { telefono: { contains: v }, whatsapp_activo: true },
      select: { id: true, whatsapp_activo: true },
    });
    if (usuario) break;
  }

  return NextResponse.json({ activo: !!usuario });
}

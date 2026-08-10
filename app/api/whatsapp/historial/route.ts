export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/whatsapp/historial — últimos mensajes del bot del candidato
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role === 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const mensajes = await prisma.botMensaje.findMany({
      where: { usuario_id: session.userId },
      orderBy: { created_at: 'asc' },
      take: 50,
    });

    return NextResponse.json({ mensajes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

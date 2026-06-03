export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { file_url, file_type } = await req.json();
    if (!file_url || !file_type) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const archivo = await prisma.archivo.create({
      data: { user_id: session.userId, file_url, file_type },
    });

    return NextResponse.json(archivo, { status: 201 });
  } catch (err) {
    console.error('[files/upload]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

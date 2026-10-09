import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildCvBuffer, cvFilename } from '@/lib/cv-generator';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { nombre_completo: true, email: true, telefono: true, cv_datos: true, pagado: true },
  });

  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  if (!usuario.pagado) {
    return NextResponse.json({ error: 'Se requiere plan premium', code: 'PAYMENT_REQUIRED' }, { status: 402 });
  }

  const buffer = await buildCvBuffer(usuario as any);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${cvFilename(usuario.nombre_completo)}"`,
    },
  });
}

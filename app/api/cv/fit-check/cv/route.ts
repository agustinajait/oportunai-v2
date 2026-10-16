/**
 * POST /api/cv/fit-check/cv
 * Genera y descarga el DOCX del CV adaptado a una oferta.
 * Body: { cv_adaptado: CvDatosInput }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildCvBuffer, cvFilename, type CvDatosInput } from '@/lib/cv-generator';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { cv_adaptado } = await req.json() as { cv_adaptado: CvDatosInput };
  if (!cv_adaptado) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: { nombre_completo: true, email: true, telefono: true },
  });
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const buffer = await buildCvBuffer({
    nombre_completo: usuario.nombre_completo,
    email: usuario.email,
    telefono: usuario.telefono,
    cv_datos: cv_adaptado,
  });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${cvFilename(usuario.nombre_completo, 'cv-adaptado')}"`,
    },
  });
}

/**
 * PATCH /api/user/onboarding
 *
 * Actualiza el perfil del usuario durante el onboarding y/o marca el onboarding como completado.
 * Requiere sesión activa.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface OnboardingBody {
  // Paso 1 — perfil básico
  bio?:          string;
  foto_url?:     string;
  area_laboral?: string; // se guarda dentro de cv_datos.area_laboral

  // Paso 4 — completar
  completar?: boolean;
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json() as OnboardingBody;

  // Construir objeto de actualización
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (body.bio          !== undefined) data.bio       = body.bio;
  if (body.foto_url     !== undefined) data.foto_url  = body.foto_url;
  if (body.completar    === true)      data.onboarding_completado = true;

  // Si viene area_laboral, mergearla en cv_datos
  if (body.area_laboral !== undefined) {
    const usuario = await prisma.usuario.findUnique({
      where:  { id: session.userId },
      select: { cv_datos: true },
    });
    const cvActual = (usuario?.cv_datos as Record<string, unknown>) ?? {};
    data.cv_datos = { ...cvActual, area_laboral: body.area_laboral };
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
  }

  const usuario = await prisma.usuario.update({
    where:  { id: session.userId },
    data,
    select: { id: true, onboarding_completado: true },
  });

  return NextResponse.json({ ok: true, usuario });
}

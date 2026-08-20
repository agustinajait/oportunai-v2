/**
 * GET /api/korai/redirect
 *
 * El candidato de OportunAI quiere hacer el diagnóstico en Korai.
 * Este endpoint genera un JWT firmado con sus datos y redirige a
 * https://app.korai.lat/join/TOKEN — Korai lo recibe, encuentra o
 * crea el usuario y lleva directo al semáforo sin registro.
 *
 * Requiere sesión activa (cookie oportunai_token).
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const JOIN_SECRET = new TextEncoder().encode(
  process.env.KORAI_JOIN_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret'
);
const KORAI_APP_URL = process.env.KORAI_APP_URL ?? 'https://app.korai.lat';
const APP_URL       = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oportunai.korai.lat';

export async function GET(req: NextRequest) {
  // 1. Validar sesión
  const session = await getSessionFromRequest(req);
  if (!session) {
    // Sin sesión → llevar al login primero
    return NextResponse.redirect(`${APP_URL}/login?next=/api/korai/redirect`);
  }

  // 2. Traer datos del usuario
  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      nombre_completo: true,
      email: true,
      telefono: true,
      direccion: true,
      korai_semaforo: true,
    },
  });

  if (!usuario) {
    return NextResponse.redirect(`${APP_URL}/login`);
  }

  // 3. Generar token (1 hora — suficiente para que el usuario complete el flujo)
  const token = await new SignJWT({
    nombre_completo:  usuario.nombre_completo,
    email:            usuario.email,
    telefono:         usuario.telefono,
    oportunai_user_id: usuario.id,
    // URL de retorno: Korai redirige aquí al terminar el diagnóstico
    return_url: `${APP_URL}/dashboard?bienvenida=korai`,
    // Si ya tiene semáforo parcial lo mandamos para que Korai lo precargue
    semaforo_previo:  usuario.korai_semaforo ?? {},
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JOIN_SECRET);

  // 4. Redirigir a Korai con el token
  return NextResponse.redirect(`${KORAI_APP_URL}/join/${token}`, { status: 302 });
}

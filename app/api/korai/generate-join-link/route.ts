/**
 * POST /api/korai/generate-join-link
 *
 * Korai llama este endpoint cuando un usuario tiene empleo rojo/amarillo
 * y quiere derivarlo a OportunAI sin que tenga que registrarse de nuevo.
 *
 * Body:
 * {
 *   nombre_completo: string
 *   email:           string
 *   telefono:        string
 *   korai_user_id:   string
 *   semaforo: { empleo, educacion, ingresos, salud, vivienda, red }
 *   direccion?:      string
 *   secret:          string  // KORAI_WEBHOOK_SECRET
 * }
 *
 * Returns:
 * { url: "https://oportunai.korai.lat/join/TOKEN" }
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const KORAI_WEBHOOK_SECRET = process.env.KORAI_WEBHOOK_SECRET ?? '';
const JOIN_SECRET = new TextEncoder().encode(
  process.env.KORAI_JOIN_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret'
);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oportunai.korai.lat';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre_completo, email, telefono, korai_user_id, semaforo, direccion, secret } = body;

    // Autenticación
    if (!KORAI_WEBHOOK_SECRET || secret !== KORAI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!nombre_completo || !email || !telefono || !korai_user_id) {
      return NextResponse.json({ error: 'nombre_completo, email, telefono y korai_user_id son requeridos' }, { status: 400 });
    }

    // Generar token JWT firmado, válido por 48 horas
    const token = await new SignJWT({
      nombre_completo,
      email,
      telefono,
      korai_user_id,
      semaforo: semaforo ?? {},
      direccion: direccion ?? '',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('48h')
      .sign(JOIN_SECRET);

    const url = `${APP_URL}/join/${token}`;

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error('[generate-join-link]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

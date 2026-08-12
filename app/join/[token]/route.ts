/**
 * GET /join/[token]
 *
 * Magic link de Korai → OportunAI.
 * Korai genera el link con POST /api/korai/generate-join-link.
 * El usuario llega acá al hacer clic; validamos el JWT y lo logueamos
 * (creando cuenta si no existe).
 *
 * Flujo:
 * 1. Verificar JWT firmado con KORAI_JOIN_SECRET
 * 2. Buscar usuario existente por email o teléfono
 *    - Sí existe  → actualizar korai_semaforo + activar WhatsApp
 *    - No existe  → crear cuenta + activar WhatsApp
 * 3. Emitir cookie de sesión
 * 4. Redirect a /dashboard?bienvenida=korai
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createToken, generateSlug } from '@/lib/auth';

const JOIN_SECRET = new TextEncoder().encode(
  process.env.KORAI_JOIN_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret'
);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oportunai.korai.lat';

interface JoinPayload {
  nombre_completo: string;
  email: string;
  telefono: string;
  korai_user_id: string;
  semaforo: Record<string, unknown>;
  direccion: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // ── 1. Verificar JWT ─────────────────────────────────────────────────────
    let payload: JoinPayload;
    try {
      const { payload: p } = await jwtVerify(params.token, JOIN_SECRET);
      payload = p as unknown as JoinPayload;
    } catch {
      console.error('[join] token inválido o expirado');
      return NextResponse.redirect(`${APP_URL}/?error=link-invalido`);
    }

    const { nombre_completo, email, telefono, korai_user_id, semaforo, direccion } = payload;

    if (!nombre_completo || !email || !korai_user_id) {
      return NextResponse.redirect(`${APP_URL}/?error=link-invalido`);
    }

    // ── 2. Buscar usuario existente ──────────────────────────────────────────
    const digits = (telefono ?? '').replace(/\D/g, '');

    // Primero por email (único); luego por teléfono si no hay match
    let usuario = await prisma.usuario.findFirst({
      where: { email },
    });

    if (!usuario && digits.length >= 8) {
      // Intentar por variantes de teléfono (mismo patrón que el bot)
      const variantes: string[] = [digits];
      if (digits.startsWith('549')) variantes.push(digits.slice(3));
      if (digits.startsWith('549')) variantes.push('0' + digits.slice(3));

      for (const v of variantes) {
        usuario = await prisma.usuario.findFirst({
          where: { telefono: { contains: v } },
        });
        if (usuario) break;
      }
    }

    const semaforoMeta = {
      korai_user_id,
      ultima_actualizacion: new Date().toISOString(),
      fuente: 'korai',
    };

    if (usuario) {
      // ── 2a. Ya existe → merge semáforo + activar WhatsApp ─────────────────
      const semaforoActual = (usuario.korai_semaforo as Record<string, unknown>) ?? {};
      const semaforoMerged = {
        ...semaforoActual,
        ...(semaforo ?? {}),
        ...semaforoMeta,
      };

      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          korai_semaforo: semaforoMerged,
          korai_opt_in: true,
          whatsapp_activo: true,
          // Actualizar teléfono si no lo tenía
          ...((!usuario.telefono || usuario.telefono === '') && digits ? { telefono: digits } : {}),
        },
      });

      console.log(`[join] usuario existente logueado: ${usuario.id}`);
    } else {
      // ── 2b. No existe → crear cuenta ──────────────────────────────────────
      // DNI: usamos "korai_" + últimos 8 chars del korai_user_id (único, no conflictúa con DNIs reales)
      const dniPlaceholder = `korai_${korai_user_id.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`;

      // Manejar colisión de slug: si el slug ya existe agregamos un sufijo
      let slug = generateSlug(nombre_completo, dniPlaceholder);
      const slugConflicto = await prisma.usuario.findUnique({ where: { slug } });
      if (slugConflicto) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
      }

      // Contraseña aleatoria — el usuario puede setear una más adelante
      const password_hash = await bcrypt.hash(
        `korai_${korai_user_id}_${Date.now()}`,
        10
      );

      const semaforoInicial = {
        ...(semaforo ?? {}),
        ...semaforoMeta,
      };

      usuario = await prisma.usuario.create({
        data: {
          nombre_completo,
          email,
          telefono: digits || telefono || '',
          direccion: direccion || 'Sin dirección',
          dni: dniPlaceholder,
          slug,
          password_hash,
          korai_semaforo: semaforoInicial,
          korai_opt_in: true,
          whatsapp_activo: true,
        },
      });

      console.log(`[join] nuevo usuario creado desde Korai: ${usuario.id}`);
    }

    // ── 3. Emitir cookie de sesión ───────────────────────────────────────────
    const sessionToken = await createToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
      nombre: usuario.nombre_completo,
      slug: usuario.slug,
    });

    // ── 4. Redirect al dashboard ─────────────────────────────────────────────
    const response = NextResponse.redirect(`${APP_URL}/dashboard?bienvenida=korai`, {
      status: 302,
    });

    response.cookies.set('oportunai_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[join] error inesperado:', error);
    return NextResponse.redirect(`${APP_URL}/?error=error-interno`);
  }
}

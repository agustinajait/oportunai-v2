/**
 * PATCH /api/whatsapp/opt-in
 * El candidato activa o desactiva el acompañamiento por WhatsApp.
 * Al activar: bot se presenta, comparte link del perfil e invita al diagnóstico de Korai.
 * Si ya tiene perfil laboral completo, pre-infiere la dimensión "empleo" del semáforo.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const APP_URL       = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oportunai.korai.lat';
const KORAI_APP_URL = process.env.KORAI_APP_URL ?? 'https://app.korai.lat';
const JOIN_SECRET   = new TextEncoder().encode(
  process.env.KORAI_JOIN_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret'
);

/** Genera un magic link personalizado hacia el test de Korai (válido 48 h) */
async function generarLinkKorai(usuario: {
  id: string; nombre_completo: string; email: string; telefono: string;
}): Promise<string> {
  try {
    const token = await new SignJWT({
      nombre_completo:   usuario.nombre_completo,
      email:             usuario.email,
      telefono:          usuario.telefono,
      oportunai_user_id: usuario.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('48h')
      .sign(JOIN_SECRET);
    return `${KORAI_APP_URL}/join/${token}`;
  } catch {
    return KORAI_APP_URL; // fallback al sitio directo
  }
}

type CvDatos = {
  resumen?: string;
  experiencia?: { cargo: string; empresa: string; periodo?: string }[];
  habilidades?: string[];
  nivel_estudios?: string;
  disponibilidad?: string;
};

/**
 * Infiere el estado de la dimensión "empleo" a partir del perfil laboral.
 * Solo se usa para pre-poblar el semáforo sin tocar el test de Korai.
 */
function inferirEmpleo(cvDatos: CvDatos | null): 'verde' | 'amarillo' | 'rojo' | null {
  if (!cvDatos) return null;

  const disponibilidad = (cvDatos.disponibilidad ?? '').toLowerCase();
  const resumen = (cvDatos.resumen ?? '').toLowerCase();
  const tieneExperiencia = (cvDatos.experiencia?.length ?? 0) > 0;

  // Señales claras de búsqueda activa / desempleo
  const buscaTrabajo =
    disponibilidad.includes('inmediata') ||
    disponibilidad.includes('busco') ||
    resumen.includes('busco trabajo') ||
    resumen.includes('busco empleo') ||
    resumen.includes('sin trabajo') ||
    resumen.includes('desocupado') ||
    resumen.includes('desempleado');

  // Señales de empleo actual
  const tieneEmpleo =
    disponibilidad.includes('part time') ||
    disponibilidad.includes('part-time') ||
    disponibilidad.includes('medio tiempo') ||
    resumen.includes('trabajo actualmente') ||
    resumen.includes('actualmente trabajo') ||
    resumen.includes('empleado en') ||
    resumen.includes('trabajo en');

  if (buscaTrabajo && !tieneEmpleo) return 'rojo';
  if (tieneEmpleo) return 'amarillo'; // tiene algo pero busca mejorar
  if (tieneExperiencia) return 'amarillo'; // tiene historial, situación a confirmar
  return 'rojo'; // sin experiencia y sin señales claras
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role === 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { activo } = await req.json();
    if (typeof activo !== 'boolean') {
      return NextResponse.json({ error: 'activo debe ser boolean' }, { status: 400 });
    }

    // Leemos primero para tener cv_datos y semáforo actual
    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { cv_datos: true, korai_semaforo: true },
    });

    // Si activa y tiene perfil laboral → pre-inferir dimensión empleo si aún no está en semáforo
    let nuevoSemaforo: object | undefined;
    if (activo && usuarioActual) {
      const semaforoActual = (usuarioActual.korai_semaforo ?? {}) as Record<string, unknown>;
      if (!semaforoActual.empleo) {
        const empleoInferido = inferirEmpleo(usuarioActual.cv_datos as CvDatos | null);
        if (empleoInferido) {
          nuevoSemaforo = {
            ...semaforoActual,
            empleo: empleoInferido,
            fuente_empleo: 'perfil_oportunai',
            ultima_actualizacion: new Date().toISOString(),
          };
        }
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id: session.userId },
      data: {
        korai_opt_in:    activo,
        whatsapp_activo: activo,
        ...(nuevoSemaforo ? { korai_semaforo: nuevoSemaforo } : {}),
      },
      select: {
        id: true,
        korai_opt_in: true,
        whatsapp_activo: true,
        telefono: true,
        nombre_completo: true,
        slug: true,
        cv_datos: true,
        videos: {
          where: { tipo: 'video_cv', es_fragmento: false },
          select: { id: true },
          take: 1,
        },
      },
    });

    // Al activar: mensaje de bienvenida
    if (activo && process.env.SUPABASE_FUNCTIONS_URL) {
      const primer_nombre = usuario.nombre_completo.split(' ')[0];
      const tienePerfilLaboral = !!(
        (usuario.cv_datos as CvDatos | null)?.resumen ||
        ((usuario.cv_datos as CvDatos | null)?.experiencia?.length ?? 0) > 0 ||
        ((usuario.cv_datos as CvDatos | null)?.habilidades?.length ?? 0) > 0
      );
      const tieneVideoCV = (usuario as any).videos?.length > 0;

      // Magic link personalizado a Korai — el usuario llega sin tener que registrarse
      const koraiLink = await generarLinkKorai({
        id:              usuario.id,
        nombre_completo: usuario.nombre_completo,
        email:           (await prisma.usuario.findUnique({ where: { id: usuario.id }, select: { email: true } }))?.email ?? '',
        telefono:        usuario.telefono,
      });

      // Descripción del primer paso según lo que ya completó
      const primerPasoDesc = tienePerfilLaboral && tieneVideoCV
        ? 'creando tu perfil laboral y grabando tu VideoCV'
        : tienePerfilLaboral
          ? 'creando tu perfil laboral'
          : tieneVideoCV
            ? 'grabando tu VideoCV'
            : 'registrándote en la plataforma';

      const bienvenida =
        `¡Perfecto, ${primer_nombre}! Nos alegra que quieras seguir acompañado en tu búsqueda laboral.\n\n` +
        `Ya diste un primer paso en OportunAI ${primerPasoDesc}. Ahora queremos conocerte un poco más para poder acompañarte de una manera personalizada.\n\n` +
        `Por eso te invitamos a realizar tu diagnóstico Korai. Es rápido, gratuito y te permite contarnos cómo estás hoy en distintas áreas de tu vida que pueden influir en tu camino laboral.\n\n` +
        `A partir de lo que nos cuentes, Korai va a poder identificar qué necesitás y acercarte herramientas, oportunidades, programas y recursos que se adapten mejor a tu situación.\n\n` +
        `Hacé tu diagnóstico acá:\n` +
        `${koraiLink}\n\n` +
        `Cuando termines el diagnóstico, Korai te va a indicar los próximos pasos para continuar. 💙`;

      await fetch(`${process.env.SUPABASE_FUNCTIONS_URL}/send_whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
        },
        body: JSON.stringify({
          telefono:   usuario.telefono,
          mensaje:    bienvenida,
          usuario_id: usuario.id,
        }),
      }).catch(err => console.error('Error enviando bienvenida WA:', err));
    }

    return NextResponse.json({ ok: true, whatsapp_activo: usuario.whatsapp_activo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

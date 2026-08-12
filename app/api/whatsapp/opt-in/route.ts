/**
 * PATCH /api/whatsapp/opt-in
 * El candidato activa o desactiva el acompañamiento por WhatsApp.
 * Al activar: bot se presenta, comparte link del perfil e invita al diagnóstico de Korai.
 * Si ya tiene perfil laboral completo, pre-infiere la dimensión "empleo" del semáforo.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oportunai.korai.lat';

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
      },
    });

    // Al activar: mensaje de bienvenida
    if (activo && process.env.SUPABASE_FUNCTIONS_URL) {
      const primer_nombre = usuario.nombre_completo.split(' ')[0];
      const perfilUrl = `${APP_URL}/u/${usuario.slug}`;
      const tienePerfilLaboral = !!(
        (usuario.cv_datos as CvDatos | null)?.resumen ||
        ((usuario.cv_datos as CvDatos | null)?.experiencia?.length ?? 0) > 0 ||
        ((usuario.cv_datos as CvDatos | null)?.habilidades?.length ?? 0) > 0
      );

      const bienvenida = tienePerfilLaboral
        ? `¡Hola ${primer_nombre}! 👋 Somos el equipo de OportunAI.\n\n` +
          `Ya tenés tu perfil laboral armado — eso nos da una gran ventaja para acompañarte. ` +
          `Te mandamos el link para que lo compartas cuando quieras:\n` +
          `🔗 ${perfilUrl}\n\n` +
          `Para recomendarte oportunidades que encajen con tu situación real, ` +
          `te falta hacer el diagnóstico de Korai — son solo 3 minutos:\n` +
          `📋 app.korai.lat\n\n` +
          `Como ya cargaste tu experiencia laboral, una buena parte ya la conocemos. ` +
          `¡Cuando completes el diagnóstico, te damos recomendaciones personalizadas!`
        : `¡Hola ${primer_nombre}! 👋 Somos el equipo de OportunAI.\n\n` +
          `Estamos acá para acompañarte en tu búsqueda de trabajo.\n\n` +
          `Tu perfil laboral ya está disponible:\n` +
          `🔗 ${perfilUrl}\n\n` +
          `Para poder recomendarte oportunidades según tus habilidades y tu situación, ` +
          `hacé el diagnóstico gratuito de Korai — solo toma 3 minutos:\n` +
          `📋 app.korai.lat\n\n` +
          `¡Cuando lo completes, seguimos con recomendaciones personalizadas!`;

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

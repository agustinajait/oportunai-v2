/**
 * PATCH /api/user/onboarding
 *
 * Actualiza el perfil del usuario durante el onboarding y/o marca el onboarding como completado.
 * Requiere sesión activa.
 *
 * Cuando se guardan bio + area_laboral (paso 1), infiere automáticamente un semáforo
 * parcial usando reglas de texto sin ningún costo de API. Esto permite que Korai
 * reciba `semaforo_previo` con 2-3 dimensiones ya conocidas y acorte el diagnóstico.
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

type SemaforoColor = 'verde' | 'amarillo' | 'rojo';

interface SemaforoParcial {
  empleo?:     SemaforoColor;
  educacion?:  SemaforoColor;
  ingresos?:   SemaforoColor;
  salud?:      SemaforoColor;
  vivienda?:   SemaforoColor;
  red_social?: SemaforoColor;
}

/**
 * Inferencia zero-cost: usa texto ya guardado en la DB para pre-llenar
 * dimensiones del diagnóstico Korai sin Whisper ni LLM.
 *
 * Dimensiones que se infieren con alta confianza:
 *   - empleo:    amarillo  (siempre — están en OportunAI buscando trabajo)
 *   - ingresos:  amarillo  (si tienen área laboral → tienen orientación, probable informalidad)
 *   - educacion: verde/amarillo/rojo según keywords en la bio
 *
 * Dimensiones que NO se infieren (Korai pregunta):
 *   - salud, vivienda, red_social
 */
function inferirSemaforoDesdeTexto(
  bio: string,
  area_laboral: string | null | undefined,
  semaforoExistente: SemaforoParcial | null,
): SemaforoParcial {
  const base: SemaforoParcial = { ...(semaforoExistente ?? {}) };
  const b = bio.toLowerCase();

  // ── Empleo ───────────────────────────────────────────────────────────────
  // Estar en OportunAI buscando trabajo ≈ empleo en búsqueda activa → amarillo
  // Solo marcamos rojo si la persona indica desempleo prolongado
  if (!base.empleo) {
    if (b.includes('sin trabajo') || b.includes('desocupada') || b.includes('desempleada') || b.includes('desempleado')) {
      base.empleo = 'rojo';
    } else {
      base.empleo = 'amarillo';
    }
  }

  // ── Ingresos ─────────────────────────────────────────────────────────────
  // Si tiene área laboral definida: probable trabajador/a informal o en búsqueda
  // Si bio menciona "sin ingresos" / "sin trabajo" → rojo
  if (!base.ingresos) {
    if (b.includes('sin ingresos') || b.includes('sin trabajo') || b.includes('desocupada') || b.includes('desempleada') || b.includes('desempleado')) {
      base.ingresos = 'rojo';
    } else if (area_laboral) {
      base.ingresos = 'amarillo'; // tiene orientación laboral, probablemente ingresos variables/informales
    }
  }

  // ── Educación ────────────────────────────────────────────────────────────
  // Verde: título terciario/universitario / técnico
  // Amarillo: secundario completo o en curso
  // Rojo: sin secundario / solo primaria
  if (!base.educacion) {
    const universitario = [
      'universidad', 'universitari', 'licenciad', 'licenciatura',
      'tecnicatura', 'técnico', 'técnica', 'ingenier', 'profesora', 'profesor',
      'maestra', 'maestro', 'abogad', 'contador', 'contadora', 'título',
    ];
    const secundario = [
      'secundario', 'secundaria', 'bachiller', 'bachillerato', 'polimodal', 'cbt',
    ];
    const sinEstudios = [
      'primaria incompleta', 'sin estudios', 'sin secundario', 'primaria solamente', 'primario',
    ];

    if (universitario.some(k => b.includes(k))) {
      base.educacion = 'verde';
    } else if (secundario.some(k => b.includes(k))) {
      base.educacion = 'amarillo';
    } else if (sinEstudios.some(k => b.includes(k))) {
      base.educacion = 'rojo';
    }
    // Sin keywords → no inferimos, Korai pregunta
  }

  return base;
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json() as OnboardingBody;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (body.bio          !== undefined) data.bio       = body.bio;
  if (body.foto_url     !== undefined) data.foto_url  = body.foto_url;
  if (body.completar    === true)      data.onboarding_completado = true;

  // Si viene area_laboral, mergearla en cv_datos
  if (body.area_laboral !== undefined) {
    const usuario = await prisma.usuario.findUnique({
      where:  { id: session.userId },
      select: { cv_datos: true, bio: true, korai_semaforo: true },
    });
    const cvActual = (usuario?.cv_datos as Record<string, unknown>) ?? {};
    data.cv_datos = { ...cvActual, area_laboral: body.area_laboral };

    // ── Inferencia zero-cost ──────────────────────────────────────────────
    // Calcular semáforo parcial a partir de la bio (nueva o existente) +
    // el área laboral recién guardada. Esto alimenta semaforo_previo en Korai
    // y acorta el diagnóstico de 6 a 3 preguntas (salud, vivienda, red_social).
    const bioParaInferir = body.bio ?? usuario?.bio ?? '';
    const semaforoActual = (usuario?.korai_semaforo ?? null) as SemaforoParcial | null;
    const semaforoParcial = inferirSemaforoDesdeTexto(
      bioParaInferir,
      body.area_laboral,
      semaforoActual,
    );
    // Solo actualizar si inferimos al menos una dimensión nueva
    if (Object.keys(semaforoParcial).length > 0) {
      data.korai_semaforo = semaforoParcial;
    }
  } else if (body.bio !== undefined) {
    // Bio actualizada sin area_laboral: re-inferir con lo que hay en DB
    const usuario = await prisma.usuario.findUnique({
      where:  { id: session.userId },
      select: { cv_datos: true, korai_semaforo: true },
    });
    const area = ((usuario?.cv_datos as Record<string, unknown>)?.area_laboral as string) ?? null;
    const semaforoActual = (usuario?.korai_semaforo ?? null) as SemaforoParcial | null;
    const semaforoParcial = inferirSemaforoDesdeTexto(body.bio, area, semaforoActual);
    if (Object.keys(semaforoParcial).length > 0) {
      data.korai_semaforo = semaforoParcial;
    }
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

export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  nombre:          z.string().min(3).max(100),
  descripcion:     z.string().max(300).optional(),
  habilita_cv:    z.boolean().default(true),
  habilita_pitch: z.boolean().default(true),
});

export async function GET() {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const talleres = await prisma.taller.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      modulos: { orderBy: [{ tipo_video: 'asc' }, { orden: 'asc' }] },
      _count:  { select: { taller_usuarios: true, videos: true } },
    },
  });

  return NextResponse.json(talleres);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { nombre, descripcion, habilita_cv, habilita_pitch } = parsed.data;

  // Auto-crear mÃ³dulos por defecto si el taller los habilita
  const modulosCV = habilita_cv ? [
    { tipo_video: 'video_cv' as const, nombre_modulo: 'PresentaciÃ³n',        duracion_base: 10, texto_guia: 'DecÃ­ tu nombre y quÃ© estÃ¡s buscando laboralmente', orden: 1 },
    { tipo_video: 'video_cv' as const, nombre_modulo: 'Estudios',            duracion_base: 20, texto_guia: 'ContÃ¡ tu formaciÃ³n y cursos relevantes', orden: 2 },
    { tipo_video: 'video_cv' as const, nombre_modulo: 'Experiencia laboral', duracion_base: 20, texto_guia: 'ExplicÃ¡ dÃ³nde trabajaste y quÃ© tareas realizabas', orden: 3 },
    { tipo_video: 'video_cv' as const, nombre_modulo: 'MotivaciÃ³n',          duracion_base: 10, texto_guia: 'ContÃ¡ por quÃ© deberÃ­an contratarte', orden: 4 },
  ] : [];

  const modulosPitch = habilita_pitch ? [
    { tipo_video: 'video_pitch' as const, nombre_modulo: 'PresentaciÃ³n + problema', duracion_base: 15, texto_guia: 'DecÃ­ tu nombre, quÃ© hacÃ©s y cuÃ¡l es el problema que detectaste', orden: 1 },
    { tipo_video: 'video_pitch' as const, nombre_modulo: 'SoluciÃ³n',                duracion_base: 15, texto_guia: 'ExplicÃ¡ cÃ³mo resolvÃ©s ese problema', orden: 2 },
    { tipo_video: 'video_pitch' as const, nombre_modulo: 'Producto / servicio',     duracion_base: 15, texto_guia: 'ContÃ¡ quÃ© ofrecÃ©s y cÃ³mo funciona', orden: 3 },
    { tipo_video: 'video_pitch' as const, nombre_modulo: 'Cierre / impacto',        duracion_base: 15, texto_guia: 'ExplicÃ¡ por quÃ© es importante y quÃ© estÃ¡s buscando', orden: 4 },
  ] : [];

  const taller = await prisma.taller.create({
    data: {
      nombre, descripcion, habilita_cv, habilita_pitch,
      modulos: { create: [...modulosCV, ...modulosPitch] },
    },
    include: { modulos: { orderBy: [{ tipo_video: 'asc' }, { orden: 'asc' }] } },
  });

  return NextResponse.json(taller, { status: 201 });
}


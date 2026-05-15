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

  // Auto-crear módulos por defecto si el taller los habilita
  const modulosCV = habilita_cv ? [
    { tipo_video: 'video_cv' as const, nombre_modulo: 'Presentación',        duracion_base: 10, texto_guia: 'Decí tu nombre y qué estás buscando laboralmente', orden: 1 },
    { tipo_video: 'video_cv' as const, nombre_modulo: 'Estudios',            duracion_base: 20, texto_guia: 'Contá tu formación y cursos relevantes', orden: 2 },
    { tipo_video: 'video_cv' as const, nombre_modulo: 'Experiencia laboral', duracion_base: 20, texto_guia: 'Explicá dónde trabajaste y qué tareas realizabas', orden: 3 },
    { tipo_video: 'video_cv' as const, nombre_modulo: 'Motivación',          duracion_base: 10, texto_guia: 'Contá por qué deberían contratarte', orden: 4 },
  ] : [];

  const modulosPitch = habilita_pitch ? [
    { tipo_video: 'video_pitch' as const, nombre_modulo: 'Presentación + problema', duracion_base: 15, texto_guia: 'Decí tu nombre, qué hacés y cuál es el problema que detectaste', orden: 1 },
    { tipo_video: 'video_pitch' as const, nombre_modulo: 'Solución',                duracion_base: 15, texto_guia: 'Explicá cómo resolvés ese problema', orden: 2 },
    { tipo_video: 'video_pitch' as const, nombre_modulo: 'Producto / servicio',     duracion_base: 15, texto_guia: 'Contá qué ofrecés y cómo funciona', orden: 3 },
    { tipo_video: 'video_pitch' as const, nombre_modulo: 'Cierre / impacto',        duracion_base: 15, texto_guia: 'Explicá por qué es importante y qué estás buscando', orden: 4 },
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

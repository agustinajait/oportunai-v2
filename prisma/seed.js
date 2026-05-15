const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // ── 1. Configuración global de video (fallback sin taller) ──────
  const cvModulos = [
    { nombre_modulo: 'Presentación', duracion_base: 10, texto_guia: 'Decí tu nombre y qué estás buscando laboralmente', orden: 1 },
    { nombre_modulo: 'Estudios',     duracion_base: 20, texto_guia: 'Contá tu formación y cursos relevantes', orden: 2 },
    { nombre_modulo: 'Experiencia',  duracion_base: 20, texto_guia: 'Explicá dónde trabajaste y qué tareas realizabas', orden: 3 },
    { nombre_modulo: 'Motivación',   duracion_base: 10, texto_guia: 'Contá por qué deberían contratarte', orden: 4 },
  ];
  for (const m of cvModulos) {
    await prisma.configuracionVideo.upsert({
      where: { tipo_video_orden: { tipo_video: 'video_cv', orden: m.orden } },
      update: m,
      create: { ...m, tipo_video: 'video_cv' },
    });
  }

  const pitchModulos = [
    { nombre_modulo: 'Presentación + problema', duracion_base: 15, texto_guia: 'Decí tu nombre, qué hacés y cuál es el problema que detectaste', orden: 1 },
    { nombre_modulo: 'Solución',                duracion_base: 15, texto_guia: 'Explicá cómo resolvés ese problema', orden: 2 },
    { nombre_modulo: 'Producto / servicio',     duracion_base: 15, texto_guia: 'Contá qué ofrecés y cómo funciona', orden: 3 },
    { nombre_modulo: 'Cierre / impacto',        duracion_base: 15, texto_guia: 'Explicá por qué es importante y qué estás buscando', orden: 4 },
  ];
  for (const m of pitchModulos) {
    await prisma.configuracionVideo.upsert({
      where: { tipo_video_orden: { tipo_video: 'video_pitch', orden: m.orden } },
      update: m,
      create: { ...m, tipo_video: 'video_pitch' },
    });
  }

  // ── 2. Super Admin ───────────────────────────────────────────────
  const existsSA = await prisma.usuario.findUnique({ where: { email: 'superadmin@oportunai.com' } });
  if (!existsSA) {
    const hash = await bcrypt.hash('SuperAdmin1234!', 12);
    await prisma.usuario.create({
      data: {
        nombre_completo: 'Super Administrador',
        email: 'superadmin@oportunai.com',
        password_hash: hash,
        telefono: '1100000001',
        direccion: 'Buenos Aires',
        dni: '00000001',
        role: 'super_admin',
        slug: 'superadmin',
      },
    });
    console.log('✅ Super Admin: superadmin@oportunai.com / SuperAdmin1234!');
  }

  // ── 3. Admin regular ────────────────────────────────────────────
  const existsA = await prisma.usuario.findUnique({ where: { email: 'admin@oportunai.com' } });
  if (!existsA) {
    const hash = await bcrypt.hash('Admin1234!', 12);
    await prisma.usuario.create({
      data: {
        nombre_completo: 'Administrador',
        email: 'admin@oportunai.com',
        password_hash: hash,
        telefono: '1100000000',
        direccion: 'Buenos Aires',
        dni: '00000000',
        role: 'admin',
        slug: 'admin',
      },
    });
    console.log('✅ Admin: admin@oportunai.com / Admin1234!');
  }

  // ── 4. Talleres de ejemplo ───────────────────────────────────────
  const taller1 = await prisma.taller.upsert({
    where: { id: 'taller-empleo-001' },
    update: {},
    create: {
      id: 'taller-empleo-001',
      nombre: 'Taller de Inserción Laboral',
      descripcion: 'Orientado a jóvenes que buscan su primer empleo formal.',
      habilita_cv: true,
      habilita_pitch: false,
      modulos: {
        create: [
          { tipo_video: 'video_cv', nombre_modulo: 'Presentación', duracion_base: 10, texto_guia: 'Decí tu nombre, tu edad y qué tipo de trabajo estás buscando', orden: 1 },
          { tipo_video: 'video_cv', nombre_modulo: 'Formación',    duracion_base: 20, texto_guia: 'Contá tu nivel educativo y cualquier curso o certificado que hayas hecho', orden: 2 },
          { tipo_video: 'video_cv', nombre_modulo: 'Habilidades',  duracion_base: 20, texto_guia: 'Mencioná tus habilidades principales: tecnología, idiomas, trabajo en equipo', orden: 3 },
          { tipo_video: 'video_cv', nombre_modulo: 'Motivación',   duracion_base: 10, texto_guia: '¿Por qué querés trabajar en esta área? Sé específico y breve', orden: 4 },
        ],
      },
    },
  });

  const taller2 = await prisma.taller.upsert({
    where: { id: 'taller-emprend-002' },
    update: {},
    create: {
      id: 'taller-emprend-002',
      nombre: 'Taller de Emprendedorismo',
      descripcion: 'Para emprendedores que quieren presentar su proyecto ante inversores.',
      habilita_cv: false,
      habilita_pitch: true,
      modulos: {
        create: [
          { tipo_video: 'video_pitch', nombre_modulo: 'Presentación',        duracion_base: 15, texto_guia: 'Presentate y describí en una oración qué hace tu emprendimiento', orden: 1 },
          { tipo_video: 'video_pitch', nombre_modulo: 'El problema',          duracion_base: 15, texto_guia: 'Explicá el problema que identificaste en el mercado con datos concretos', orden: 2 },
          { tipo_video: 'video_pitch', nombre_modulo: 'Tu solución',          duracion_base: 15, texto_guia: 'Mostrá cómo tu producto o servicio resuelve ese problema de forma única', orden: 3 },
          { tipo_video: 'video_pitch', nombre_modulo: 'Llamada a la acción',  duracion_base: 15, texto_guia: 'Qué necesitás: inversión, clientes, socios. Sé claro y directo', orden: 4 },
        ],
      },
    },
  });

  const taller3 = await prisma.taller.upsert({
    where: { id: 'taller-completo-003' },
    update: {},
    create: {
      id: 'taller-completo-003',
      nombre: 'Taller Integral de Comunicación',
      descripcion: 'Incluye tanto Video CV como Video Pitch. Para perfiles multifacéticos.',
      habilita_cv: true,
      habilita_pitch: true,
      modulos: {
        create: [
          { tipo_video: 'video_cv', nombre_modulo: 'Presentación personal', duracion_base: 12, texto_guia: 'Presentate con nombre, ciudad y objetivo profesional en 3 oraciones', orden: 1 },
          { tipo_video: 'video_cv', nombre_modulo: 'Trayectoria',           duracion_base: 20, texto_guia: 'Recorrido profesional: puestos, empresas, años. Énfasis en logros', orden: 2 },
          { tipo_video: 'video_cv', nombre_modulo: 'Propuesta de valor',    duracion_base: 18, texto_guia: '¿Qué problema resolvés mejor que los demás? Dame un ejemplo concreto', orden: 3 },
          { tipo_video: 'video_cv', nombre_modulo: 'Cierre',                duracion_base: 10, texto_guia: 'Disponibilidad, tipo de rol buscado y cómo contactarte', orden: 4 },
          { tipo_video: 'video_pitch', nombre_modulo: 'Elevator pitch',     duracion_base: 15, texto_guia: 'En 15 segundos: quién sos, qué hacés y para quién', orden: 1 },
          { tipo_video: 'video_pitch', nombre_modulo: 'Necesidad del mercado', duracion_base: 15, texto_guia: 'El problema que resolvés con números o historias reales', orden: 2 },
          { tipo_video: 'video_pitch', nombre_modulo: 'Diferencial',        duracion_base: 15, texto_guia: 'Por qué tu solución es mejor. Mostrá tracción o validación temprana', orden: 3 },
          { tipo_video: 'video_pitch', nombre_modulo: 'Próximos pasos',     duracion_base: 15, texto_guia: 'Qué buscás lograr y qué necesitás de quién te escucha', orden: 4 },
        ],
      },
    },
  });

  console.log(`✅ Talleres creados: ${taller1.nombre}, ${taller2.nombre}, ${taller3.nombre}`);
  console.log('✅ Seed completo');
}

main().catch(console.error).finally(() => prisma.$disconnect());

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken, generateEmpresaSlug } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre_completo, email, password, nombre_empresa, rubro, ciudad } = body;

    if (!nombre_completo || !email || !password || !nombre_empresa) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json({ error: 'El email ya estÃ¡ registrado' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const slug = generateEmpresaSlug(nombre_empresa);

    // Crear usuario con rol empleador
    const usuario = await prisma.usuario.create({
      data: {
        nombre_completo,
        email,
        password_hash,
        telefono: body.telefono || '',
        direccion: body.direccion || '',
        dni: body.dni || email, // usamos email como fallback para el unique
        role: 'empleador',
        slug: `emp-${slug}`,
      },
    });

    // Crear la empresa
    const empresa = await prisma.empresa.create({
      data: {
        nombre: nombre_empresa,
        slug,
        rubro: rubro || null,
        ciudad: ciudad || null,
        miembros: {
          create: {
            usuario_id: usuario.id,
            rol_interno: 'manager',
          },
        },
      },
    });

    const token = await createToken({
      userId: usuario.id,
      email: usuario.email,
      role: 'empleador',
      nombre: usuario.nombre_completo,
      slug: usuario.slug,
    });

    const response = NextResponse.json({
      ok: true,
      empresa: { id: empresa.id, nombre: empresa.nombre, slug: empresa.slug },
    });

    response.cookies.set('oportunai_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

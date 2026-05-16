export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return NextResponse.json({ error: 'Email o contraseÃ±a incorrectos' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, usuario.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Email o contraseÃ±a incorrectos' }, { status: 401 });
    }

    const token = await createToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
      nombre: usuario.nombre_completo,
      slug: usuario.slug,
    });

    cookies().set('oportunai_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ ok: true, role: usuario.role });
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}


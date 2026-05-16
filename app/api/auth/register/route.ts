export const dynamic = 'force-dynamic';
﻿export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { createToken, generateSlug } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { nombre_completo, email, password, telefono, direccion, dni } = parsed.data;

    const existing = await prisma.usuario.findFirst({
      where: { OR: [{ email }, { dni }] },
    });
    if (existing) {
      const field = existing.email === email ? 'El email' : 'El DNI';
      return NextResponse.json({ error: `${field} ya estÃ¡ registrado` }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const slug = generateSlug(nombre_completo, dni);

    const usuario = await prisma.usuario.create({
      data: { nombre_completo, email, password_hash, telefono, direccion, dni, slug },
    });

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
      maxAge: 60 * 60 * 24 * 7, // 7 dÃ­as
      path: '/',
    });

    return NextResponse.json({ ok: true, role: usuario.role }, { status: 201 });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}


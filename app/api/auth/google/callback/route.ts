export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken, generateSlug } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=google`);
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error('Token exchange failed');
    }

    // Get Google user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userInfoRes.json();
    const { sub: googleId, email, name } = googleUser as {
      sub: string; email: string; name: string;
    };

    if (!email) throw new Error('No email from Google');

    // Find existing user by email or google_id
    let usuario = await prisma.usuario.findFirst({
      where: { OR: [{ email }, { google_id: googleId }] },
    });

    if (usuario) {
      // Link Google account if not linked yet
      if (!usuario.google_id) {
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: { google_id: googleId },
        });
      }
    } else {
      // New user — create with placeholder values for required fields
      let slug = generateSlug(name || email.split('@')[0], googleId);
      // Handle slug collision
      const existing = await prisma.usuario.findUnique({ where: { slug } });
      if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

      usuario = await prisma.usuario.create({
        data: {
          nombre_completo: name || email.split('@')[0],
          email,
          password_hash: '',
          telefono: '',
          direccion: '',
          dni: `google_${googleId}`,
          slug,
          google_id: googleId,
        },
      });
    }

    // Registrar último ingreso
    prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimo_ingreso: new Date() },
    }).catch(() => {});

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

    const dest =
      usuario.role === 'super_admin' ? '/super-admin'
      : usuario.role === 'admin' ? '/admin'
      : usuario.role === 'empleador' ? '/empresa/dashboard'
      : '/dashboard';

    return NextResponse.redirect(`${appUrl}${dest}`);
  } catch (err) {
    console.error('[google-callback]', err);
    return NextResponse.redirect(`${appUrl}/login?error=google`);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from './lib/auth';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/register-empresa'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/u/')) return NextResponse.next();
  if (pathname.startsWith('/empresa/') && !pathname.startsWith('/empresa/dashboard')) return NextResponse.next();
  if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next();
  if (pathname.startsWith('/onboarding')) return NextResponse.next();

  const session = await getSessionFromRequest(req);

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/super-admin') || pathname.startsWith('/empresa/dashboard')) {
    if (!session) return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirigir al onboarding si el usuario no lo completó
  // (solo para rutas de dashboard de usuarios normales)
  // Excepción: grabar-cv y grabar-taller pueden visitarse desde el onboarding
  const esRutaDeGrabacion = pathname.startsWith('/dashboard/grabar-');
  if (pathname.startsWith('/dashboard') && !esRutaDeGrabacion && session && session.role === 'user') {
    const onboardingCookie = req.cookies.get('onboarding_completado');
    if (onboardingCookie?.value === 'false') {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }

  if (pathname.startsWith('/admin')) {
    if (session?.role !== 'admin' && session?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  if (pathname.startsWith('/super-admin')) {
    if (session?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
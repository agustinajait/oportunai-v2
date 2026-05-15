import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from './lib/auth';

const PUBLIC_ROUTES = ['/', '/login', '/register'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/u/')) return NextResponse.next();
  if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next();

  const session = await getSessionFromRequest(req);

  // Rutas que requieren login
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) {
    if (!session) return NextResponse.redirect(new URL('/login', req.url));
  }

  // Rutas solo para admin (no super_admin — super_admin también puede)
  if (pathname.startsWith('/admin')) {
    if (session?.role !== 'admin' && session?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Rutas exclusivas para super_admin
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

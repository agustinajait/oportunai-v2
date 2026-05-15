import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
);

export interface SessionPayload {
  userId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user' | 'empleador';
  nombre: string;
  slug: string;
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('oportunai_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get('oportunai_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function isSuperAdmin(session: SessionPayload | null): boolean {
  return session?.role === 'super_admin';
}

export function isAdmin(session: SessionPayload | null): boolean {
  return session?.role === 'admin' || session?.role === 'super_admin';
}

export function isEmpleador(session: SessionPayload | null): boolean {
  return session?.role === 'empleador';
}

export function generateSlug(nombre: string, dni: string): string {
  const base = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('-');
  return `${base}-${dni.slice(-4)}`;
}

export function generateEmpresaSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('-') + '-' + Math.random().toString(36).slice(2, 6);
}

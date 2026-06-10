export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SuperAdminClient from '@/components/super-admin/SuperAdminClient';

export default async function SuperAdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') redirect('/dashboard');

  const [talleres, usuarios, empresas] = await Promise.all([
    prisma.taller.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        modulos: { orderBy: [{ tipo_video: 'asc' }, { orden: 'asc' }] },
        _count: { select: { taller_usuarios: true, videos: true } },
      },
    }),
    prisma.usuario.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true, nombre_completo: true, email: true,
        dni: true, role: true, slug: true, created_at: true,
        taller_usuarios: {
          include: {
            taller: { select: { id: true, nombre: true } },
          },
        },
        videos: {
          where: { es_fragmento: false },
          orderBy: { created_at: 'desc' },
          include: { taller: { select: { id: true, nombre: true } } },
        },
        _count: { select: { videos: true } },
      },
    }),
    prisma.empresa.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        miembros: {
          include: {
            usuario: {
              select: { id: true, nombre_completo: true, email: true, telefono: true, role: true },
            },
          },
        },
        _count: { select: { ofertas: true } },
        ofertas: {
          orderBy: { created_at: 'desc' },
          select: { id: true, titulo: true, estado: true, created_at: true, _count: { select: { postulaciones: true } } },
        },
      },
    }),
  ]);

  return <SuperAdminClient talleres={talleres as any} usuarios={usuarios as any} empresas={empresas as any} session={session} />;
}

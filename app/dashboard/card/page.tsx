export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CardClient from './CardClient';

export default async function CardPage() {
  const session = await getSession();
  if (!session || session.role === 'empleador') redirect('/login');

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      nombre_completo: true,
      telefono: true,
      bio: true,
      foto_url: true,
      slug: true,
      alfa_digital: true,
      cv_datos: true,
    },
  });

  if (!usuario) redirect('/login');

  return <CardClient usuario={usuario as any} />;
}

export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ValidarClient from './ValidarClient';

export default async function ValidarPage({ params }: { params: { token: string } }) {
  const ref = await prisma.referencia.findUnique({
    where: { token: params.token },
    include: { usuario: { select: { nombre_completo: true, slug: true } } },
  });

  if (!ref) return notFound();

  return (
    <ValidarClient
      token={params.token}
      candidato={ref.usuario.nombre_completo}
      empresa_nombre={ref.empresa_nombre}
      referidor_nombre={ref.referidor_nombre}
      estadoInicial={ref.estado}
    />
  );
}

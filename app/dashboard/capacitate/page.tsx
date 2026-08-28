export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CapitateDashboard from './CapitateDashboard';

export default async function CapitatePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [contenidos, progresos] = await Promise.all([
    prisma.capacitateContenido.findMany({
      where:   { activa: true },
      orderBy: [{ categoria: 'asc' }, { orden: 'asc' }],
      include: { _count: { select: { modulos: true } } },
    }),
    prisma.capacitateProgreso.findMany({
      where:  { usuario_id: session.userId },
      select: {
        contenido_id: true, estado: true, modulo_actual: true,
        puntaje_final: true, aprobada_en: true,
      },
    }),
  ]);

  const progresoMap = Object.fromEntries(progresos.map(p => [p.contenido_id, p]));

  const data = contenidos.map(c => ({
    id:           c.id,
    slug:         c.slug,
    titulo:       c.titulo,
    categoria:    c.categoria,
    descripcion:  c.descripcion,
    nivel:        c.nivel,
    duracion_min: c.duracion_min,
    competencias: c.competencias as string[],
    icono:        c.icono ?? '📚',
    orden:        c.orden,
    total_modulos: c._count.modulos,
    progreso:     progresoMap[c.id] ?? null,
  }));

  const aprobadas = progresos.filter(p => p.estado === 'aprobada').length;

  return <CapitateDashboard contenidos={data} estrellasTotal={aprobadas} />;
}

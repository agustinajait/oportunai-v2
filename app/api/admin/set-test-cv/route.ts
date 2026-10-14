/**
 * POST /api/admin/set-test-cv
 * Carga datos de CV de prueba (con experiencia) para el usuario logueado (testing only).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CV_TEST = {
  resumen: 'Profesional con 5 años de experiencia en ventas y atención al cliente. Capacidad para trabajar en equipo, orientado a resultados y con habilidades de comunicación. Busco crecer en una empresa donde pueda aportar mis conocimientos y seguir aprendiendo.',
  experiencia: [
    {
      empresa: 'Supermercado La Anónima',
      cargo: 'Repositor y cajero',
      periodo: '2022 – 2024',
    },
    {
      empresa: 'Ferretería El Tornillo',
      cargo: 'Vendedor',
      periodo: '2019 – 2022',
    },
  ],
  habilidades: ['Atención al cliente', 'Manejo de caja', 'Trabajo en equipo', 'Ventas'],
  estudios: 'Secundario completo',
  disponibilidad: ['Tiempo completo', 'Fines de semana'],
  localidad: 'Buenos Aires',
};

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const usuario = await prisma.usuario.update({
    where: { id: session.userId },
    data: { cv_datos: CV_TEST },
    select: { id: true, email: true, nombre_completo: true, cv_datos: true },
  });

  return NextResponse.json({ ok: true, usuario });
}

export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'empleador') redirect('/empresa/dashboard');

  const [usuario, tallersAsignados, citas] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        nombre_completo: true,
        email: true,
        telefono: true,
        direccion: true,
        bio: true,
        foto_url: true,
        slug: true,
        role: true,
        cv_datos: true,
        alfa_digital: true,
        alfa_score: true,
        fecha_nacimiento: true,
        created_at: true,
        whatsapp_activo: true,
        korai_opt_in: true,
        korai_semaforo: true,
        videos: {
          where: { es_fragmento: false },
          orderBy: { created_at: 'desc' },
          include: { taller: { select: { id: true, nombre: true } } },
        },
        archivos: { orderBy: { created_at: 'desc' } },
      },
    }),
    prisma.tallerUsuario.findMany({
      where: { usuario_id: session.userId },
      include: {
        taller: {
          include: {
            modulos: { orderBy: [{ tipo_video: 'asc' }, { orden: 'asc' }] },
          },
        },
      },
      orderBy: { asignado_en: 'desc' },
    }),
    prisma.citaInvitado.findMany({
      where: { postulacion: { usuario_id: session.userId } },
      include: {
        cita: {
          include: {
            empresa: { select: { nombre: true, logo_url: true } },
            oferta: { select: { titulo: true } },
          },
        },
      },
      orderBy: { cita: { fecha: 'asc' } },
    }),
  ]);

  if (!usuario) redirect('/login');

  return <DashboardClient usuario={usuario as any} tallersAsignados={tallersAsignados as any} citas={citas as any} />;
}

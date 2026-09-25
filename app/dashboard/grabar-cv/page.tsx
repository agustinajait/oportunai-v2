export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import GrabarCVClient from './GrabarCVClient';

export default async function GrabarCVPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [modulosGenerico, usuario] = await Promise.all([
    prisma.configuracionVideo.findMany({
      where:   { tipo_video: 'video_cv' },
      orderBy: { orden: 'asc' },
    }),
    prisma.usuario.findUnique({
      where:  { id: session.userId },
      select: { korai_semaforo: true, cv_datos: true },
    }),
  ]);

  const cvDatos = (usuario?.cv_datos as Record<string, unknown>) ?? {};
  const esMentoress = cvDatos.origen === 'mentoress';

  // Módulos EES: primero buscar en DB con tipo 'video_cv_eess', si no hay usamos fallback.
  let modulosEes: typeof modulosGenerico = [];
  if (esMentoress) {
    modulosEes = await prisma.configuracionVideo.findMany({
      where:   { tipo_video: 'video_cv_eess' as never },
      orderBy: { orden: 'asc' },
    }).catch(() => []);
  }

  const MODULOS_EES_FALLBACK = [
    { id: 'ees-1', tipo_video: 'video_cv_eess', nombre_modulo: 'Presentación', duracion_base: 30, texto_guia: 'Presentate brevemente: tu nombre, de qué zona sos y qué puesto te interesa en una estación de servicio.', orden: 1 },
    { id: 'ees-2', tipo_video: 'video_cv_eess', nombre_modulo: 'Experiencia EES', duracion_base: 30, texto_guia: 'Contá si trabajaste o conocés el rubro: despacho de combustible, tienda, cafetería, lubricentro. ¿Qué sabés hacer?', orden: 2 },
    { id: 'ees-3', tipo_video: 'video_cv_eess', nombre_modulo: 'Por qué yo', duracion_base: 30, texto_guia: '¿Por qué querés trabajar en una estación de servicio y qué te hace un buen candidato para el puesto?', orden: 3 },
  ];

  const modulos = esMentoress
    ? (modulosEes.length > 0 ? modulosEes : MODULOS_EES_FALLBACK)
    : modulosGenerico;

  // Si ya tiene empleo + ingresos + educacion en el semáforo, no repreguntamos
  const semaforo = (usuario?.korai_semaforo as Record<string, unknown>) ?? {};
  const tienePreDiagnostico =
    !!semaforo.empleo && !!semaforo.ingresos && !!semaforo.educacion;

  return (
    <GrabarCVClient
      modulos={modulos}
      session={session}
      tienePreDiagnostico={tienePreDiagnostico}
    />
  );
}

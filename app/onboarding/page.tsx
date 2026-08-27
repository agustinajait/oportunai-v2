export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const usuario = await prisma.usuario.findUnique({
    where:  { id: session.userId },
    select: {
      id:                    true,
      nombre_completo:       true,
      bio:                   true,
      foto_url:              true,
      cv_datos:              true,
      grabaciones_cv:        true,
      korai_semaforo:        true,
      korai_opt_in:          true,
      onboarding_completado: true,
    },
  });

  if (!usuario) redirect('/login');

  // Si ya completó el onboarding, mandarlo al dashboard
  if (usuario.onboarding_completado) redirect('/dashboard');

  const cvDatos = (usuario.cv_datos as Record<string, unknown>) ?? {};

  return (
    <OnboardingClient
      nombre={usuario.nombre_completo}
      bioInicial={usuario.bio ?? ''}
      fotoInicial={usuario.foto_url ?? ''}
      areaLaboral={(cvDatos.area_laboral as string) ?? ''}
      tieneVideo={usuario.grabaciones_cv > 0}
      tieneDiagnostico={!!usuario.korai_semaforo}
      tieneWhatsapp={usuario.korai_opt_in}
    />
  );
}

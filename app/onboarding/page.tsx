export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const usuario = await prisma.usuario.findUnique({
    where:  { id: session.userId },
    select: {
      nombre_completo:       true,
      cv_datos:              true,
      grabaciones_cv:        true,
      onboarding_completado: true,
    },
  });

  if (!usuario) redirect('/login');

  if (usuario.onboarding_completado) {
    cookies().set('onboarding_completado', 'true', {
      httpOnly: false, path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax',
    });
    redirect('/dashboard');
  }

  const cvDatos = (usuario.cv_datos as Record<string, unknown>) ?? {};

  return (
    <OnboardingClient
      nombre={usuario.nombre_completo ?? ''}
      areaLaboral={(cvDatos.area_laboral as string) ?? ''}
      tieneVideo={usuario.grabaciones_cv > 0}
      origen={(cvDatos.origen as string) ?? ''}
    />
  );
}

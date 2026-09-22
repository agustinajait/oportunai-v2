import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentor EES — RRHH para Estaciones de Servicio',
  description: 'La primera plataforma de RRHH exclusiva para estaciones de servicio de Argentina. Candidatos capacitados, con video CV y perfil del rubro.',
};

export default function MentoresLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

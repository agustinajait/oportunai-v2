export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Building2, MapPin, Briefcase, Globe, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';

const MODALIDAD_LABEL: Record<string, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const empresa = await prisma.empresa.findUnique({
    where: { slug: params.slug },
    select: { nombre: true, descripcion: true, logo_url: true, rubro: true, ciudad: true },
  });
  if (!empresa) return {};
  const title = `${empresa.nombre} — Ofertas de trabajo | Oportunai`;
  const description =
    empresa.descripcion ||
    `Conocé las ofertas de trabajo de ${empresa.nombre}${empresa.ciudad ? ` en ${empresa.ciudad}` : ''}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(empresa.logo_url && { images: [{ url: empresa.logo_url }] }),
    },
    twitter: { card: 'summary', title, description },
  };
}

export default async function EmpresaPublicaPage({
  params,
}: {
  params: { slug: string };
}) {
  const empresa = await prisma.empresa.findUnique({
    where: { slug: params.slug },
    include: {
      ofertas: {
        where: { estado: 'activa' },
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!empresa || !empresa.activa) notFound();

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Oportunai" className="w-8 h-8" />
          <span className="font-display text-xl font-semibold text-ink-800">Oportunai</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm">Iniciar sesión</Link>
          <Link href="/register" className="btn-primary text-sm py-2">Registrarse</Link>
        </div>
      </nav>

      {/* Header empresa */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-start gap-6">
            {empresa.logo_url ? (
              <img
                src={empresa.logo_url}
                alt={empresa.nombre}
                className="w-20 h-20 rounded-2xl object-cover border border-ink-200 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-3xl flex-shrink-0">
                {empresa.nombre[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl font-semibold text-ink-900">{empresa.nombre}</h1>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-ink-500">
                {empresa.rubro && <span>{empresa.rubro}</span>}
                {empresa.ciudad && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {empresa.ciudad}
                  </span>
                )}
                {empresa.sitio_web && (
                  <a
                    href={empresa.sitio_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-brand-600 hover:underline"
                  >
                    <Globe size={13} /> {empresa.sitio_web.replace(/https?:\/\/(www\.)?/, '')}
                  </a>
                )}
              </div>
              {empresa.descripcion && (
                <p className="text-ink-500 mt-3 leading-relaxed max-w-xl">{empresa.descripcion}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ofertas */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold text-ink-800">
            Ofertas activas
          </h2>
          <p className="text-ink-500 text-sm mt-1">
            {empresa.ofertas.length === 0
              ? 'No hay ofertas activas por ahora'
              : `${empresa.ofertas.length} ${empresa.ofertas.length === 1 ? 'posición disponible' : 'posiciones disponibles'}`}
          </p>
        </div>

        {empresa.ofertas.length === 0 ? (
          <div className="card p-12 text-center">
            <Briefcase size={36} className="text-ink-300 mx-auto mb-4" />
            <p className="text-ink-500">No hay ofertas activas por ahora.</p>
            <p className="text-ink-400 text-sm mt-1">Volvé pronto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {empresa.ofertas.map((oferta) => (
              <Link key={oferta.id} href={`/ofertas/${oferta.id}`} className="card p-6 hover:shadow-md transition-shadow block no-underline text-inherit">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink-900 text-lg leading-tight mb-1">
                      {oferta.titulo}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-ink-500 text-sm mb-3">
                      {oferta.ciudad && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} /> {oferta.ciudad}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase size={13} /> {MODALIDAD_LABEL[oferta.modalidad] ?? oferta.modalidad}
                      </span>
                      {oferta.area && (
                        <span className="bg-brand-50 text-brand-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                          {oferta.area}
                        </span>
                      )}
                    </div>
                    <p className="text-ink-500 text-sm leading-relaxed line-clamp-2">
                      {oferta.descripcion}
                    </p>
                  </div>
                  <span className="btn-primary text-sm py-2.5 px-5 flex-shrink-0 flex items-center gap-1.5">
                    Ver oferta <ChevronRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer Oportunai */}
        <div className="mt-12 pt-8 border-t border-ink-100 text-center">
          <p className="text-ink-400 text-sm">
            Powered by{' '}
            <Link href="/" className="text-brand-600 hover:underline font-medium">
              Oportunai
            </Link>
            {' '}— Plataforma de selección con Video CV
          </p>
        </div>
      </div>
    </div>
  );
}

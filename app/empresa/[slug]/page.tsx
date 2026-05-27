export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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

  const modalidadLabel: Record<string, string> = {
    presencial: 'Presencial',
    remoto: 'Remoto',
    hibrido: 'Híbrido',
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header empresa */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center gap-6">
            {empresa.logo_url ? (
              <img
                src={empresa.logo_url}
                alt={empresa.nombre}
                className="w-20 h-20 rounded-2xl object-cover border border-ink-200 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-3xl">
                {empresa.nombre[0]}
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink-900">{empresa.nombre}</h1>
              <div className="flex gap-3 mt-1 text-sm text-ink-500">
                {empresa.rubro && <span>{empresa.rubro}</span>}
                {empresa.ciudad && <span>· {empresa.ciudad}</span>}
                {empresa.sitio_web && (
                  <a href={empresa.sitio_web} target="_blank" className="text-brand-600 hover:underline">
                    · {empresa.sitio_web.replace(/https?:\/\//, '')}
                  </a>
                )}
              </div>
              {empresa.descripcion && (
                <p className="text-ink-500 mt-3 max-w-xl leading-relaxed">{empresa.descripcion}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ofertas */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="font-display text-xl font-semibold text-ink-800 mb-6">
          Ofertas activas ({empresa.ofertas.length})
        </h2>

        {empresa.ofertas.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-ink-400">No hay ofertas activas por ahora</p>
          </div>
        ) : (
          <div className="space-y-4">
            {empresa.ofertas.map(oferta => (
              <div key={oferta.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <h3 className="font-semibold text-ink-900 text-lg mb-2">{oferta.titulo}</h3>
                  <p className="text-ink-500 text-sm leading-relaxed line-clamp-3 mb-3">
                    {oferta.descripcion}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {oferta.area && (
                      <span className="bg-brand-50 text-brand-700 text-xs px-2.5 py-1 rounded-full">
                        {oferta.area}
                      </span>
                    )}
                    {oferta.ciudad && (
                      <span className="text-xs text-ink-400">📍 {oferta.ciudad}</span>
                    )}
                    <span className="text-xs text-ink-400">
                      💼 {modalidadLabel[oferta.modalidad]}
                    </span>
                  </div>
                  {oferta.requisitos && (
                    <div className="mt-3 bg-ink-50 rounded-lg px-4 py-3">
                      <p className="text-xs font-medium text-ink-600 mb-1">Requisitos</p>
                      <p className="text-xs text-ink-500 leading-relaxed">{oferta.requisitos}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-ink-100">
                  <Link
                    href="/dashboard"
                    className="btn-primary text-sm py-2 px-5"
                  >
                    Aplicar con mi Video CV →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

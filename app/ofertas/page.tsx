export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Building2, MapPin, Briefcase, ExternalLink, ArrowLeft } from 'lucide-react';

const MODALIDAD_LABEL: Record<string, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

const FUENTE_LABEL: Record<string, string> = {
  computrabajo: 'Computrabajo',
  zonajobs: 'ZonaJobs',
  bumeran: 'Bumeran',
  linkedin: 'LinkedIn',
  vicentelopez: 'Vicente López',
  sanfernando: 'San Fernando',
  gcba: 'GCBA',
  empleogob: 'empleo.gob.ar',
};

export default async function OfertasPage() {
  const [ofertasInternas, ofertasExternas] = await Promise.all([
    prisma.oferta.findMany({
      where: { estado: 'activa' },
      include: { empresa: { select: { nombre: true, logo_url: true, slug: true } } },
      orderBy: { created_at: 'desc' },
    }),
    prisma.ofertaExterna.findMany({
      where: { activa: true },
      orderBy: { created_at: 'desc' },
      take: 200,
    }),
  ]);

  const total = ofertasInternas.length + ofertasExternas.length;

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Nav */}
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

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600 transition-colors mb-6">
          <ArrowLeft size={15} /> Volver al inicio
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink-900 mb-2">Ofertas de trabajo</h1>
          <p className="text-ink-500">{total} {total === 1 ? 'oferta activa' : 'ofertas activas'}</p>
        </div>

        {total === 0 ? (
          <div className="card p-12 text-center">
            <Briefcase size={40} className="text-ink-300 mx-auto mb-4" />
            <p className="text-ink-500">No hay ofertas activas por el momento.</p>
            <p className="text-ink-400 text-sm mt-1">Volvé pronto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Ofertas internas (empresas registradas) */}
            {ofertasInternas.map((o) => (
              <Link key={o.id} href={`/ofertas/${o.id}`} className="card p-6 hover:shadow-md transition-shadow block no-underline text-inherit">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {(o.logo_url ?? o.empresa.logo_url)
                        ? <img src={o.logo_url ?? o.empresa.logo_url!} alt={o.nombre_marca ?? o.empresa.nombre} className="w-full h-full object-cover" />
                        : <Building2 size={20} className="text-ink-400" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-ink-900 text-lg leading-tight mb-1">{o.titulo}</h2>
                      <p className="text-brand-600 text-sm font-medium mb-2">{o.nombre_marca ?? o.empresa.nombre}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-ink-500 text-sm mb-3">
                        {o.ciudad && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} /> {o.ciudad}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Briefcase size={13} /> {MODALIDAD_LABEL[o.modalidad] ?? o.modalidad}
                        </span>
                        {o.area && <span className="text-ink-400">{o.area}</span>}
                      </div>

                      <p className="text-ink-500 text-sm line-clamp-2 leading-relaxed">{o.descripcion}</p>
                    </div>
                  </div>

                  <span className="btn-primary text-sm py-2.5 px-5 flex-shrink-0">Ver oferta</span>
                </div>
              </Link>
            ))}

            {/* Ofertas externas (Computrabajo, ZonaJobs, etc.) */}
            {ofertasExternas.map((o) => (
              <a
                key={o.id}
                href={o.url_original}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-6 hover:shadow-md transition-shadow block no-underline text-inherit"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {o.logo_url
                        ? <img src={o.logo_url} alt={o.empresa_nombre} className="w-full h-full object-cover" />
                        : <Building2 size={20} className="text-ink-400" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-semibold text-ink-900 text-lg leading-tight">{o.titulo}</h2>
                        <ExternalLink size={14} className="text-ink-400 flex-shrink-0" />
                      </div>
                      <p className="text-brand-600 text-sm font-medium mb-2">{o.empresa_nombre}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-ink-500 text-sm mb-3">
                        {o.ciudad && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} /> {o.ciudad}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Briefcase size={13} /> {MODALIDAD_LABEL[o.modalidad] ?? o.modalidad}
                        </span>
                        {o.area && <span className="text-ink-400">{o.area}</span>}
                        <span className="text-xs text-ink-300 bg-ink-100 px-2 py-0.5 rounded-full">
                          {FUENTE_LABEL[o.fuente] ?? o.fuente}
                        </span>
                      </div>

                      {o.descripcion && (
                        <p className="text-ink-500 text-sm line-clamp-2 leading-relaxed">{o.descripcion}</p>
                      )}
                    </div>
                  </div>

                  <span className="btn-secondary text-sm py-2.5 px-5 flex-shrink-0 whitespace-nowrap">
                    Ver oferta
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Building2, MapPin, Briefcase, ChevronRight, ArrowLeft } from 'lucide-react';

const MODALIDAD_LABEL: Record<string, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

export default async function OfertasPage() {
  const ofertas = await prisma.oferta.findMany({
    where: { estado: 'activa' },
    include: { empresa: { select: { nombre: true, logo_url: true, slug: true } } },
    orderBy: { created_at: 'desc' },
  });

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
          <p className="text-ink-500">{ofertas.length} {ofertas.length === 1 ? 'oferta activa' : 'ofertas activas'}</p>
        </div>

        {ofertas.length === 0 ? (
          <div className="card p-12 text-center">
            <Briefcase size={40} className="text-ink-300 mx-auto mb-4" />
            <p className="text-ink-500">No hay ofertas activas por el momento.</p>
            <p className="text-ink-400 text-sm mt-1">Volvé pronto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ofertas.map((o) => (
              <div key={o.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Logo marca o empresa */}
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

                  <Link
                    href={`/register?oferta_id=${o.id}`}
                    className="btn-primary text-sm py-2.5 px-5 flex-shrink-0"
                  >
                    Postularme
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

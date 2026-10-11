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
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d14' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-4xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Oportunai" className="w-7 h-7" />
          <span className="font-bold text-base" style={{ color: 'rgba(255,255,255,0.9)' }}>Oportunai</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm px-3 py-2 rounded-xl transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }}>Iniciar sesión</Link>
          <Link href="/register" className="text-sm px-4 py-2 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>Registrarse</Link>
        </div>
      </nav>

      {/* Header */}
      <div className="relative px-4 pt-8 pb-8" style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4B33CC 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-5 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft size={15} /> Volver al inicio
          </Link>
          <h1 className="font-bold text-3xl text-white mb-1.5">Ofertas de trabajo</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>{total} {total === 1 ? 'oferta activa' : 'ofertas activas'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 w-full space-y-3">

        {total === 0 ? (
          <div className="rounded-2xl p-14 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Briefcase size={40} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>No hay ofertas activas por el momento.</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Volvé pronto.</p>
          </div>
        ) : (
          <>
            {ofertasInternas.map((o) => (
              <Link
                key={o.id}
                href={`/ofertas/${o.id}`}
                className="flex items-start justify-between gap-4 p-5 rounded-2xl block transition-all no-underline text-inherit group"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    {(o.logo_url ?? o.empresa.logo_url)
                      ? <img src={o.logo_url ?? o.empresa.logo_url!} alt={o.nombre_marca ?? o.empresa.nombre} className="w-full h-full object-cover" />
                      : <Building2 size={20} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-base leading-tight mb-0.5" style={{ color: 'rgba(255,255,255,0.9)' }}>{o.titulo}</h2>
                    <p className="text-sm font-medium mb-2" style={{ color: '#a78bfa' }}>{o.nombre_marca ?? o.empresa.nombre}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {o.ciudad && <span className="flex items-center gap-1"><MapPin size={12} /> {o.ciudad}</span>}
                      <span className="flex items-center gap-1"><Briefcase size={12} /> {MODALIDAD_LABEL[o.modalidad] ?? o.modalidad}</span>
                      {o.area && <span>{o.area}</span>}
                    </div>
                    <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{o.descripcion}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold px-4 py-2 rounded-xl flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>Ver oferta</span>
              </Link>
            ))}

            {ofertasExternas.map((o) => (
              <a
                key={o.id}
                href={o.url_original}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-4 p-5 rounded-2xl block transition-all no-underline text-inherit"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    {o.logo_url
                      ? <img src={o.logo_url} alt={o.empresa_nombre} className="w-full h-full object-cover" />
                      : <Building2 size={20} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="font-semibold text-base leading-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>{o.titulo}</h2>
                      <ExternalLink size={13} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                    </div>
                    <p className="text-sm font-medium mb-2" style={{ color: '#a78bfa' }}>{o.empresa_nombre}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {o.ciudad && <span className="flex items-center gap-1"><MapPin size={12} /> {o.ciudad}</span>}
                      <span className="flex items-center gap-1"><Briefcase size={12} /> {MODALIDAD_LABEL[o.modalidad] ?? o.modalidad}</span>
                      {o.area && <span>{o.area}</span>}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                        {FUENTE_LABEL[o.fuente] ?? o.fuente}
                      </span>
                    </div>
                    {o.descripcion && (
                      <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{o.descripcion}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold px-4 py-2 rounded-xl flex-shrink-0 whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>Ver oferta</span>
              </a>
            ))}
          </>
        )}
      </div>

      <footer className="text-center py-10 text-sm mt-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <span className="font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>OPORTUNAI</span>
        {' · '}
        <Link href="/" className="hover:underline">Inicio</Link>
        {' · '}
        <Link href="/register" className="hover:underline">Registrarse</Link>
      </footer>
    </div>
  );
}

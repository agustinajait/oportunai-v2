export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  Building2, Clock, DollarSign, ChevronRight,
  ArrowLeft, Layers, ShieldCheck, BookOpen,
} from 'lucide-react';

function formatPrecio(precio_hora: number | null | undefined, horas_modulo: number | null) {
  if (!precio_hora) return null;
  return `$${precio_hora.toLocaleString('es-AR')}/hs`;
}

function formatTotal(precio_hora: number | null | undefined, horas_modulo: number | null) {
  if (!precio_hora || !horas_modulo) return null;
  const total = precio_hora * horas_modulo;
  return `$${total.toLocaleString('es-AR')} total`;
}

export default async function ServiciosPublicosPage() {
  const [session, servicios] = await Promise.all([
    getSession(),
    prisma.servicio.findMany({
      where: { estado: 'activo' },
      include: {
        empresa: { select: { id: true, nombre: true, logo_url: true, slug: true } },
        capacitacion: { select: { id: true, titulo: true } },
        _count: { select: { postulaciones: true } },
      },
      orderBy: { created_at: 'desc' },
    }),
  ]);

  const isCandidate = session && session.role !== 'empleador';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d14' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-4xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Oportunai" className="w-7 h-7" />
          <span className="font-bold text-base" style={{ color: 'rgba(255,255,255,0.9)' }}>Oportunai</span>
        </Link>
        <div className="flex items-center gap-2">
          {isCandidate ? (
            <Link href="/dashboard" className="text-sm px-3 py-2 rounded-xl" style={{ color: 'rgba(255,255,255,0.55)' }}>Mi panel</Link>
          ) : (
            <>
              <Link href="/login" className="text-sm px-3 py-2 rounded-xl" style={{ color: 'rgba(255,255,255,0.55)' }}>Iniciar sesión</Link>
              <Link href="/register" className="text-sm px-4 py-2 rounded-xl font-semibold text-white hidden sm:inline-flex" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>Registrarse gratis</Link>
            </>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="relative px-4 pt-8 pb-8" style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4B33CC 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-5 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft size={15} /> Volver al inicio
          </Link>
          <h1 className="font-bold text-3xl text-white mb-1.5">Servicios disponibles</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>
            {servicios.length === 0
              ? 'No hay servicios activos por el momento.'
              : `${servicios.length} ${servicios.length === 1 ? 'servicio activo' : 'servicios activos'} — Aplicá y trabajá por módulos.`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 w-full space-y-4">

        {!isCandidate && (
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(112,72,240,0.1)', border: '1px solid rgba(112,72,240,0.25)' }}>
            <ShieldCheck size={17} style={{ color: '#a78bfa', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Creá tu cuenta para aplicar</p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Registrarte es gratis y sólo toma 2 minutos.{' '}
                <Link href="/register" className="underline font-medium" style={{ color: '#a78bfa' }}>Empezar →</Link>
              </p>
            </div>
          </div>
        )}

        {servicios.length === 0 ? (
          <div className="rounded-2xl p-14 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Layers size={40} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>No hay servicios activos por el momento.</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Volvé pronto.</p>
          </div>
        ) : (
          servicios.map((s) => {
            const precio = formatPrecio(s.precio_hora?.toNumber(), s.horas_modulo);
            const totalPrecio = formatTotal(s.precio_hora?.toNumber(), s.horas_modulo);
            const protocolo = (s.protocolo as { item: string; descripcion?: string }[]) ?? [];
            const href = isCandidate ? `/servicios/${s.id}` : `/register?redirect=/servicios/${s.id}`;
            return (
              <Link
                key={s.id}
                href={href}
                className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-5 rounded-2xl block transition-all group no-underline text-inherit"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    {s.empresa.logo_url
                      ? <img src={s.empresa.logo_url} alt={s.empresa.nombre} className="w-full h-full object-cover" />
                      : <Building2 size={20} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-base leading-tight mb-0.5" style={{ color: 'rgba(255,255,255,0.9)' }}>{s.titulo}</h2>
                    <p className="text-sm font-medium mb-2" style={{ color: '#a78bfa' }}>{s.empresa.nombre}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {precio && (
                        <span className="flex items-center gap-1 font-semibold" style={{ color: '#34d399' }}>
                          <DollarSign size={12} /> {precio}
                          {totalPrecio && <span className="font-normal" style={{ color: 'rgba(52,211,153,0.7)' }}>· {totalPrecio}</span>}
                        </span>
                      )}
                      {s.horas_modulo && <span className="flex items-center gap-1"><Clock size={12} /> {s.horas_modulo} hs / módulo</span>}
                      {s.duracion_jornada && <span>{s.duracion_jornada}</span>}
                      <span>{s._count.postulaciones} postulantes</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.descripcion}</p>
                    {protocolo.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {protocolo.slice(0, 4).map((p, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }}>{p.item}</span>
                        ))}
                        {protocolo.length > 4 && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>+{protocolo.length - 4} más</span>}
                      </div>
                    )}
                    {s.capacitacion && (
                      <div className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ color: '#a78bfa', background: 'rgba(112,72,240,0.15)', border: '1px solid rgba(112,72,240,0.25)' }}>
                        <BookOpen size={10} /> Capacitación: {s.capacitacion.titulo}
                      </div>
                    )}
                  </div>
                </div>
                <div className="sm:flex-shrink-0">
                  <span className="w-full sm:w-auto text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1 text-white" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>
                    Ver oferta <ChevronRight size={13} />
                  </span>
                </div>
              </Link>
            );
          })
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

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
  if (horas_modulo) {
    const total = precio_hora * horas_modulo;
    return `$${precio_hora.toLocaleString('es-AR')}/hs · $${total.toLocaleString('es-AR')} total`;
  }
  return `$${precio_hora.toLocaleString('es-AR')}/hs`;
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
    <div className="min-h-screen bg-ink-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Oportunai" className="w-8 h-8" />
          <span className="font-display text-xl font-semibold text-ink-800">Oportunai</span>
        </Link>
        <div className="flex items-center gap-3">
          {isCandidate ? (
            <Link href="/dashboard" className="btn-ghost text-sm">Mi panel</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">Iniciar sesión</Link>
              <Link href="/register" className="btn-primary text-sm py-2">Registrarse gratis</Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600 transition-colors mb-6">
          <ArrowLeft size={15} /> Volver al inicio
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink-900 mb-2">Servicios disponibles</h1>
          <p className="text-ink-500">
            {servicios.length === 0
              ? 'No hay servicios activos por el momento.'
              : `${servicios.length} ${servicios.length === 1 ? 'servicio activo' : 'servicios activos'} — Aplicá y trabajá por módulos.`}
          </p>
        </div>

        {!isCandidate && (
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <ShieldCheck size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-brand-800">Creá tu cuenta para aplicar</p>
              <p className="text-sm text-brand-700 mt-0.5">
                Registrarte es gratis y sólo toma 2 minutos.{' '}
                <Link href="/register" className="underline font-medium">Empezar →</Link>
              </p>
            </div>
          </div>
        )}

        {servicios.length === 0 ? (
          <div className="card p-12 text-center">
            <Layers size={40} className="text-ink-300 mx-auto mb-4" />
            <p className="text-ink-500">No hay servicios activos por el momento.</p>
            <p className="text-ink-400 text-sm mt-1">Volvé pronto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {servicios.map((s) => {
              const precio = formatPrecio(s.precio_hora?.toNumber(), s.horas_modulo);
              const protocolo = (s.protocolo as { item: string; descripcion?: string }[]) ?? [];
              return (
                <div key={s.id} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Logo empresa */}
                      <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {s.empresa.logo_url
                          ? <img src={s.empresa.logo_url} alt={s.empresa.nombre} className="w-full h-full object-cover" />
                          : <Building2 size={20} className="text-ink-400" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-ink-900 text-lg leading-tight mb-1">{s.titulo}</h2>
                        <p className="text-brand-600 text-sm font-medium mb-2">{s.empresa.nombre}</p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-ink-500 text-sm mb-3">
                          {precio && (
                            <span className="flex items-center gap-1 text-teal-700 font-semibold">
                              <DollarSign size={13} /> {precio}
                            </span>
                          )}
                          {s.horas_modulo && (
                            <span className="flex items-center gap-1">
                              <Clock size={13} /> {s.horas_modulo} hs / módulo
                            </span>
                          )}
                          {s.duracion_jornada && (
                            <span className="text-ink-400">{s.duracion_jornada}</span>
                          )}
                          <span className="text-ink-400">{s._count.postulaciones} postulantes</span>
                        </div>

                        <p className="text-ink-500 text-sm line-clamp-2 leading-relaxed mb-3">{s.descripcion}</p>

                        {protocolo.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {protocolo.slice(0, 4).map((p, i) => (
                              <span key={i} className="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">
                                {p.item}
                              </span>
                            ))}
                            {protocolo.length > 4 && (
                              <span className="text-xs text-ink-400">+{protocolo.length - 4} más</span>
                            )}
                          </div>
                        )}

                        {s.capacitacion && (
                          <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full w-fit">
                            <BookOpen size={11} /> Capacitación requerida: {s.capacitacion.titulo}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {isCandidate ? (
                        <Link
                          href={`/servicios/${s.id}`}
                          className="btn-primary text-sm py-2.5 px-5 flex items-center gap-1"
                        >
                          Ver y aplicar <ChevronRight size={14} />
                        </Link>
                      ) : (
                        <Link
                          href={`/register?redirect=/servicios/${s.id}`}
                          className="btn-primary text-sm py-2.5 px-5 flex items-center gap-1"
                        >
                          Aplicar <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer mini */}
      <footer className="text-center py-10 text-ink-400 text-sm">
        <span className="font-display font-semibold text-ink-600">OPORTUNAI</span>
        {' · '}
        <Link href="/" className="hover:underline">Inicio</Link>
        {' · '}
        <Link href="/register" className="hover:underline">Registrarse</Link>
      </footer>
    </div>
  );
}

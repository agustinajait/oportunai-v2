export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  Building2, Clock, DollarSign, ArrowLeft,
  CheckCircle, BookOpen, FileText, ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import ServicioAplicarButton from '@/components/ui/ServicioAplicarButton';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await prisma.servicio.findUnique({
    where: { id: params.id },
    select: { titulo: true, empresa: { select: { nombre: true } } },
  });
  if (!s) return { title: 'Servicio no encontrado' };
  return {
    title: `${s.titulo} · ${s.empresa.nombre} | Oportunai`,
    description: `Aplicá al servicio "${s.titulo}" en ${s.empresa.nombre} a través de Oportunai.`,
  };
}

function parseDocLabel(d: string): string {
  const MAP: Record<string, string> = {
    dni: 'DNI',
    antecedentes_penales: 'Antecedentes Penales',
    manipulacion_alimentos: 'Manip. Alimentos',
    libreta_sanitaria: 'Libreta Sanitaria',
    registro_conducir: 'Registro de Conducir',
  };
  if (d.startsWith('otro:')) return d.slice(5) || 'Otro documento';
  return MAP[d] ?? d;
}

export default async function ServicioDetallePage({ params }: Props) {
  const [session, servicio] = await Promise.all([
    getSession(),
    prisma.servicio.findUnique({
      where: { id: params.id },
      include: {
        empresa: { select: { id: true, nombre: true, logo_url: true, slug: true } },
        capacitacion: { select: { id: true, titulo: true } },
        _count: { select: { postulaciones: true } },
      },
    }),
  ]);

  if (!servicio || servicio.estado !== 'activo') notFound();

  const isCandidate = session && session.role !== 'empleador';

  // Check if user already applied
  let yaAplico = false;
  if (isCandidate) {
    const existing = await prisma.postulacionServicio.findUnique({
      where: {
        servicio_id_usuario_id: {
          servicio_id: params.id,
          usuario_id: session.userId,
        },
      },
    });
    yaAplico = !!existing;
  }

  const protocolo = (servicio.protocolo as { item: string; descripcion?: string }[]) ?? [];
  const docs = (servicio.docs_requeridos as string[]) ?? [];
  const precio = servicio.precio_hora ? servicio.precio_hora.toNumber() : null;
  const horas = servicio.horas_modulo;

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
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

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/servicios" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600 transition-colors mb-6">
          <ArrowLeft size={15} /> Todos los servicios
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px] items-start">
          {/* Main content */}
          <div className="space-y-5">
            {/* Header */}
            <div className="card p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-ink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {servicio.empresa.logo_url
                    ? <img src={servicio.empresa.logo_url} alt={servicio.empresa.nombre} className="w-full h-full object-cover" />
                    : <Building2 size={24} className="text-ink-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">{servicio.titulo}</h1>
                  <Link href={`/empresa/${servicio.empresa.slug}`} className="text-brand-600 font-medium hover:underline">
                    {servicio.empresa.nombre}
                  </Link>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {precio && horas && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    <DollarSign size={14} />
                    ${precio.toLocaleString('es-AR')}/hs · ${(precio * horas).toLocaleString('es-AR')} total
                  </span>
                )}
                {precio && !horas && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    <DollarSign size={14} />
                    ${precio.toLocaleString('es-AR')}/hs
                  </span>
                )}
                {horas && (
                  <span className="inline-flex items-center gap-1 text-sm text-ink-600 bg-ink-100 px-3 py-1 rounded-full">
                    <Clock size={13} /> {horas} hs / módulo
                  </span>
                )}
                {servicio.duracion_jornada && (
                  <span className="inline-flex items-center gap-1 text-sm text-ink-600 bg-ink-100 px-3 py-1 rounded-full">
                    <Clock size={13} /> {servicio.duracion_jornada}
                  </span>
                )}
                <span className="text-sm text-ink-400 bg-ink-50 border border-ink-200 px-3 py-1 rounded-full">
                  {servicio._count.postulaciones} postulantes
                </span>
              </div>

              <p className="text-ink-600 leading-relaxed">{servicio.descripcion}</p>
            </div>

            {/* Protocolo */}
            {protocolo.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-teal-600" />
                  Protocolo de trabajo
                </h2>
                <div className="space-y-3">
                  {protocolo.map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-ink-800 text-sm">{p.item}</p>
                        {p.descripcion && <p className="text-ink-500 text-xs mt-0.5">{p.descripcion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentos requeridos */}
            {docs.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-purple-600" />
                  Documentación requerida
                </h2>
                <div className="flex flex-wrap gap-2">
                  {docs.map((d, i) => (
                    <span key={i} className="text-sm bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full">
                      {parseDocLabel(d)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Capacitación */}
            {servicio.capacitacion && (
              <div className="card p-6">
                <h2 className="font-semibold text-ink-900 mb-2 flex items-center gap-2">
                  <BookOpen size={18} className="text-brand-600" />
                  Capacitación sugerida
                </h2>
                <p className="text-ink-600 text-sm">{servicio.capacitacion.titulo}</p>
                {isCandidate && (
                  <Link href="/dashboard?tab=capacitaciones" className="text-sm text-brand-600 hover:underline mt-2 inline-block">
                    Ver en mi panel →
                  </Link>
                )}
              </div>
            )}

            {/* Contrato */}
            {servicio.contrato_template && (
              <div className="card p-6">
                <h2 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-teal-600" />
                  Acuerdo de servicio
                </h2>
                <div className="bg-ink-50 border border-ink-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <pre className="text-xs text-ink-600 whitespace-pre-wrap font-sans leading-relaxed">
                    {servicio.contrato_template}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-6">
            {isCandidate ? (
              <ServicioAplicarButton
                servicioId={params.id}
                yaAplico={yaAplico}
              />
            ) : (
              <div className="card p-5">
                <p className="font-semibold text-ink-900 mb-1">¿Te interesa este servicio?</p>
                <p className="text-sm text-ink-500 mb-4">Registrate gratis y aplicá en segundos.</p>
                <Link
                  href={`/register?redirect=/servicios/${params.id}`}
                  className="btn-primary w-full text-center py-3 flex items-center justify-center gap-2"
                >
                  Registrarse y aplicar <ChevronRight size={15} />
                </Link>
                <Link
                  href={`/login?redirect=/servicios/${params.id}`}
                  className="btn-ghost w-full text-center py-2.5 mt-2 block text-sm"
                >
                  Ya tengo cuenta — Iniciar sesión
                </Link>
              </div>
            )}

            {/* Quick info */}
            <div className="card p-4 space-y-2 text-sm text-ink-600">
              <p className="font-semibold text-ink-800 mb-2">Detalles del módulo</p>
              {precio && <p className="flex items-center gap-2"><DollarSign size={14} className="text-teal-600" /> ${precio.toLocaleString('es-AR')}/hora</p>}
              {horas && <p className="flex items-center gap-2"><Clock size={14} className="text-teal-600" /> {horas} horas totales</p>}
              {precio && horas && <p className="flex items-center gap-2 font-semibold text-teal-700"><DollarSign size={14} /> Total: ${(precio * horas).toLocaleString('es-AR')}</p>}
              {servicio.duracion_jornada && <p className="flex items-center gap-2"><Clock size={14} /> {servicio.duracion_jornada}</p>}
              {servicio.deadline && <p className="text-xs text-ink-400">Fecha límite: {new Date(servicio.deadline).toLocaleDateString('es-AR')}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Footer mini */}
      <footer className="text-center py-10 text-ink-400 text-sm">
        <span className="font-display font-semibold text-ink-600">OPORTUNAI</span>
        {' · '}
        <Link href="/" className="hover:underline">Inicio</Link>
        {' · '}
        <Link href="/servicios" className="hover:underline">Todos los servicios</Link>
      </footer>
    </div>
  );
}

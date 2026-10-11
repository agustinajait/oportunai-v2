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

const card = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px' };

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
              <Link href="/register" className="text-sm px-4 py-2 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>Registrarse gratis</Link>
            </>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="relative px-4 pt-8 pb-8" style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4B33CC 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <Link href="/servicios" className="inline-flex items-center gap-1.5 text-sm mb-5 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft size={15} /> Todos los servicios
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {servicio.empresa.logo_url
                ? <img src={servicio.empresa.logo_url} alt={servicio.empresa.nombre} className="w-full h-full object-cover" />
                : <Building2 size={22} style={{ color: 'rgba(255,255,255,0.5)' }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-2xl text-white leading-tight mb-1">{servicio.titulo}</h1>
              <Link href={`/empresa/${servicio.empresa.slug}`} className="text-sm font-medium hover:underline" style={{ color: '#a78bfa' }}>
                {servicio.empresa.nombre}
              </Link>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {precio && horas && (
              <span className="inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full" style={{ color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <DollarSign size={13} />
                ${precio.toLocaleString('es-AR')}/hs · ${(precio * horas).toLocaleString('es-AR')} total
              </span>
            )}
            {precio && !horas && (
              <span className="inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full" style={{ color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <DollarSign size={13} />
                ${precio.toLocaleString('es-AR')}/hs
              </span>
            )}
            {horas && (
              <span className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full" style={{ color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.1)' }}>
                <Clock size={12} /> {horas} hs / módulo
              </span>
            )}
            {servicio.duracion_jornada && (
              <span className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full" style={{ color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.1)' }}>
                {servicio.duracion_jornada}
              </span>
            )}
            <span className="text-xs px-3 py-1 rounded-full" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.07)' }}>
              {servicio._count.postulaciones} postulantes
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 w-full">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px] items-start">

          {/* Main content */}
          <div className="space-y-4">

            {/* Descripción */}
            <div style={card}>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{servicio.descripcion}</p>
            </div>

            {/* Protocolo */}
            {protocolo.length > 0 && (
              <div style={card}>
                <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <CheckCircle size={16} style={{ color: '#34d399' }} />
                  Protocolo de trabajo
                </h2>
                <div className="space-y-3">
                  {protocolo.map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{p.item}</p>
                        {p.descripcion && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{p.descripcion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentos requeridos */}
            {docs.length > 0 && (
              <div style={card}>
                <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <FileText size={16} style={{ color: '#a78bfa' }} />
                  Documentación requerida
                </h2>
                <div className="flex flex-wrap gap-2">
                  {docs.map((d, i) => (
                    <span key={i} className="text-sm px-3 py-1 rounded-full" style={{ color: '#a78bfa', background: 'rgba(112,72,240,0.15)', border: '1px solid rgba(112,72,240,0.25)' }}>
                      {parseDocLabel(d)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Capacitación */}
            {servicio.capacitacion && (
              <div style={card}>
                <h2 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <BookOpen size={16} style={{ color: '#a78bfa' }} />
                  Capacitación sugerida
                </h2>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{servicio.capacitacion.titulo}</p>
                {isCandidate && (
                  <Link href="/dashboard?tab=capacitaciones" className="text-sm hover:underline mt-2 inline-block" style={{ color: '#a78bfa' }}>
                    Ver en mi panel →
                  </Link>
                )}
              </div>
            )}

            {/* Contrato */}
            {servicio.contrato_template && (
              <div style={card}>
                <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <ShieldCheck size={16} style={{ color: '#34d399' }} />
                  Acuerdo de servicio
                </h2>
                <div className="rounded-xl p-4 max-h-48 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <pre className="text-xs leading-relaxed font-sans whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.55)' }}>
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
              <div style={card}>
                <p className="font-semibold text-sm mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>¿Te interesa este servicio?</p>
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Registrate gratis y aplicá en segundos.</p>
                <Link
                  href={`/register?redirect=/servicios/${params.id}`}
                  className="w-full text-center py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 16px rgba(109,40,217,0.35)' }}
                >
                  Registrarse y aplicar <ChevronRight size={14} />
                </Link>
                <Link
                  href={`/login?redirect=/servicios/${params.id}`}
                  className="w-full text-center py-2.5 mt-2 block text-sm"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Ya tengo cuenta — Iniciar sesión
                </Link>
              </div>
            )}

            {/* Detalles del módulo */}
            <div style={{ ...card, padding: '16px 20px' }}>
              <p className="font-semibold text-sm mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>Detalles del módulo</p>
              <div className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {precio && <p className="flex items-center gap-2"><DollarSign size={13} style={{ color: '#34d399' }} /> ${precio.toLocaleString('es-AR')}/hora</p>}
                {horas && <p className="flex items-center gap-2"><Clock size={13} style={{ color: '#34d399' }} /> {horas} horas totales</p>}
                {precio && horas && <p className="flex items-center gap-2 font-semibold" style={{ color: '#34d399' }}><DollarSign size={13} /> Total: ${(precio * horas).toLocaleString('es-AR')}</p>}
                {servicio.duracion_jornada && <p className="flex items-center gap-2"><Clock size={13} /> {servicio.duracion_jornada}</p>}
                {servicio.deadline && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Fecha límite: {new Date(servicio.deadline).toLocaleDateString('es-AR')}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-10 text-sm mt-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <span className="font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>OPORTUNAI</span>
        {' · '}
        <Link href="/" className="hover:underline">Inicio</Link>
        {' · '}
        <Link href="/servicios" className="hover:underline">Todos los servicios</Link>
      </footer>
    </div>
  );
}

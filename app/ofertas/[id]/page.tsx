export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Video, GraduationCap, Star, MapPin, Briefcase,
  ArrowLeft, Send, Building2, Shield,
} from 'lucide-react';
import type { Metadata } from 'next';

const MODALIDAD_LABEL: Record<string, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const oferta = await prisma.oferta.findUnique({
    where: { id: params.id },
    select: { titulo: true, descripcion: true, empresa: { select: { nombre: true, logo_url: true } } },
  });
  if (!oferta) return {};
  const nombre = oferta.empresa?.nombre ?? '';
  return {
    title: `${oferta.titulo} — ${nombre} | Oportunai`,
    description: oferta.descripcion.slice(0, 160),
    openGraph: {
      title: `${oferta.titulo} — ${nombre}`,
      description: oferta.descripcion.slice(0, 160),
      ...(oferta.empresa?.logo_url && { images: [{ url: oferta.empresa.logo_url }] }),
    },
  };
}

export default async function OfertaDetailPage({ params }: Props) {
  const oferta = await prisma.oferta.findUnique({
    where: { id: params.id },
    include: {
      empresa: {
        select: { id: true, nombre: true, slug: true, logo_url: true, descripcion: true, rubro: true, ciudad: true, imagenes: true },
      },
    },
  });

  if (!oferta || oferta.estado !== 'activa' || !oferta.empresa) notFound();

  const empresa = oferta.empresa;
  const nombreMarca = oferta.nombre_marca ?? empresa.nombre;
  const logoUrl = oferta.logo_url ?? empresa.logo_url;
  const heroImg = empresa.imagenes?.[0] ?? null;

  const tieneCapacitaciones = await prisma.capacitacion.count({
    where: { empresa_id: empresa.id, activa: true },
  }).then(n => n > 0);

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#f3f4f6' }}>

      {/* ── NAV ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <img src="/logo.png" alt="Oportunai" className="w-7 h-7" />
            <span className="font-bold text-lg text-gray-900">Oportunai</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-500 text-sm font-medium no-underline hover:text-gray-700">Iniciar sesión</Link>
            <Link href="/register" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg no-underline hover:bg-blue-700">Empezar gratis</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: '#0d1117', minHeight: 480 }}
      >
        {/* Background photo */}
        {heroImg && (
          <>
            <img
              src={heroImg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center right' }}
            />
            {/* Left dark overlay for text readability, fades out to the right */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, rgba(13,17,23,0.98) 40%, rgba(13,17,23,0.55) 70%, rgba(13,17,23,0.2) 100%)' }}
            />
          </>
        )}

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

          {/* Back */}
          <Link
            href="/ofertas"
            className="inline-flex items-center gap-1.5 text-white/50 text-sm no-underline hover:text-white/80 mb-8"
          >
            <ArrowLeft size={14} /> Volver a ofertas
          </Link>

          <div className="flex flex-col lg:flex-row gap-10 items-start">

            {/* ── LEFT: main content ── */}
            <div className="flex-1 min-w-0">

              {/* Active badge */}
              <span className="inline-flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5"
                style={{ background: '#22c55e', letterSpacing: '0.05em' }}>
                🔥 BÚSQUEDA ACTIVA
              </span>

              {/* Company line */}
              <div className="flex items-center gap-3 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt={nombreMarca} className="w-12 h-12 rounded-xl object-cover border-2 border-white/20 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white/70 font-bold text-xl flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    {nombreMarca[0].toUpperCase()}
                  </div>
                )}
                <span className="text-white/70 text-sm font-medium">{nombreMarca}</span>
              </div>

              <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-1">TE ESTAMOS BUSCANDO</p>
              <h1
                className="font-black uppercase leading-none mb-5"
                style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', color: '#4ade80', letterSpacing: '-0.01em' }}
              >
                {oferta.titulo}
              </h1>
              <p className="text-white/75 text-base leading-relaxed mb-8" style={{ maxWidth: 520 }}>
                {oferta.descripcion}
              </p>

              {/* Benefit chips */}
              <div className="flex flex-wrap gap-3 mb-8">
                <BenefitChip
                  icon={<Video size={16} color="#fff" />}
                  iconBg="#2563eb"
                  title="GRABÁ TU VIDEOCV"
                  sub="En 60 segundos"
                />
                {tieneCapacitaciones && (
                  <BenefitChip
                    icon={<GraduationCap size={16} color="#fff" />}
                    iconBg="#059669"
                    title="CAPACITACIONES"
                    titleColor="#4ade80"
                    sub="Gratis"
                  />
                )}
                <BenefitChip
                  icon={<Star size={16} color="#fff" fill="#fff" />}
                  iconBg="#7c3aed"
                  title="DESTACATE"
                  sub="antes que otros postulantes"
                />
              </div>

              {/* CTA row */}
              <div className="flex items-center gap-5 flex-wrap">
                <Link
                  href={`/register?oferta_id=${oferta.id}`}
                  className="inline-flex items-center gap-2.5 text-white font-black text-base uppercase no-underline rounded-xl transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: '#22c55e',
                    padding: '14px 36px',
                    letterSpacing: '0.06em',
                    boxShadow: '0 4px 24px rgba(34,197,94,0.45)',
                  }}
                >
                  <Send size={18} />
                  POSTULARME
                  <span style={{ fontSize: 20, marginLeft: 2 }}>›</span>
                </Link>
                <span className="text-white/40 text-sm flex items-center gap-1.5">
                  👥 Búsqueda activa
                </span>
              </div>
            </div>

            {/* ── RIGHT: info card ── */}
            <div
              className="hidden lg:block flex-shrink-0 bg-white rounded-2xl p-6 shadow-xl"
              style={{ width: 260 }}
            >
              {oferta.ciudad && (
                <InfoRow icon={<MapPin size={16} className="text-gray-400" />} label="UBICACIÓN" value={oferta.ciudad} />
              )}
              <InfoRow
                icon={<Briefcase size={16} className="text-gray-400" />}
                label="MODALIDAD"
                value={MODALIDAD_LABEL[oferta.modalidad] ?? oferta.modalidad}
              />
              {oferta.area && (
                <InfoRow icon={<Building2 size={16} className="text-gray-400" />} label="ÁREA" value={oferta.area} />
              )}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <Link
                  href={`/register?oferta_id=${oferta.id}`}
                  className="w-full flex items-center justify-center gap-2 text-white font-bold text-sm uppercase no-underline rounded-xl py-3 transition-all hover:opacity-90"
                  style={{ background: '#22c55e', letterSpacing: '0.05em' }}
                >
                  <Send size={14} /> POSTULARME
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CARDS BELOW ── */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* VideoCV card */}
          <BottomCard
            icon={<div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0"><Video size={22} color="#fff" /></div>}
            title="GRABÁ TU VIDEOCV"
            titleColor="#2563eb"
            body={`Contanos quién sos y por qué querés trabajar en ${nombreMarca}.`}
            cta="Más información →"
            ctaHref={`/register?oferta_id=${oferta.id}`}
          />

          {/* Capacitaciones card — only if empresa has them */}
          {tieneCapacitaciones && (
            <BottomCard
              icon={<div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0"><GraduationCap size={22} color="#fff" /></div>}
              title="CAPACITACIONES GRATIS"
              titleColor="#059669"
              body={`Accedé a cursos exclusivos para postulantes de ${nombreMarca}.`}
              cta="Más información →"
              ctaHref={`/register?oferta_id=${oferta.id}`}
            />
          )}

          {/* Company card */}
          <BottomCard
            icon={
              logoUrl
                ? <img src={logoUrl} alt={nombreMarca} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 font-bold text-xl">{nombreMarca[0].toUpperCase()}</div>
            }
            title={nombreMarca}
            body={empresa.descripcion ?? `${empresa.rubro ? `${empresa.rubro}. ` : ''}Sumate a nuestro equipo.`}
            cta="Conocé más →"
            ctaHref={`/empresa/${empresa.slug}`}
          />
        </div>

        {/* Requisitos */}
        {oferta.requisitos && (
          <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-widest">Requisitos</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{oferta.requisitos}</p>
          </div>
        )}

        {/* Privacy footer */}
        <div className="mt-8 bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Tu información está segura</p>
            <p className="text-gray-500 text-xs mt-0.5">En Oportunai protegemos tus datos y solo los compartimos con la empresa.</p>
          </div>
        </div>

        {/* CTA mobile sticky replacement */}
        <div className="lg:hidden mt-6">
          <Link
            href={`/register?oferta_id=${oferta.id}`}
            className="w-full flex items-center justify-center gap-2.5 text-white font-black text-base uppercase no-underline rounded-xl py-4 transition-all hover:opacity-90"
            style={{ background: '#22c55e', letterSpacing: '0.06em', boxShadow: '0 4px 24px rgba(34,197,94,0.35)' }}
          >
            <Send size={18} /> POSTULARME
          </Link>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          Powered by{' '}
          <Link href="/" className="text-blue-500 hover:underline">Oportunai</Link>
          {' '}— Selección con Video CV
        </p>
      </div>

    </div>
  );
}

/* ── Sub-components ── */

function BenefitChip({
  icon, iconBg, title, titleColor = '#fff', sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  titleColor?: string;
  sub: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-2.5"
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold uppercase" style={{ color: titleColor, letterSpacing: '0.05em' }}>{title}</div>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{sub}</div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">{label}</p>
        <p className="text-gray-900 font-semibold text-sm mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function BottomCard({
  icon, title, titleColor = '#111827', body, cta, ctaHref,
}: {
  icon: React.ReactNode;
  title: string;
  titleColor?: string;
  body: string;
  cta: string;
  ctaHref: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-start gap-4 mb-3">
        {icon}
        <div>
          <p className="font-bold text-sm uppercase" style={{ color: titleColor, letterSpacing: '0.04em' }}>{title}</p>
        </div>
      </div>
      <p className="text-gray-500 text-sm leading-relaxed mb-4">{body}</p>
      <Link href={ctaHref} className="text-sm font-semibold no-underline hover:underline" style={{ color: titleColor !== '#111827' ? titleColor : '#2563eb' }}>
        {cta}
      </Link>
    </div>
  );
}

export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  Video, GraduationCap, Star, MapPin, Briefcase,
  Send, Building2, Shield, Users, CheckCircle,
} from 'lucide-react';
import type { Metadata } from 'next';

const MODALIDAD_LABEL: Record<string, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [22, 163, 74];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function derivePalette(primaryHex: string) {
  const [r, g, b] = hexToRgb(primaryHex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const heroBg = hslToHex(h, Math.max(Math.round(s * 0.75), 25), 12);
  const pageBg = hslToHex(h, Math.min(Math.round(s * 0.35), 25), 97);
  const colorLight = hslToHex(h, Math.min(s + 8, 100), Math.min(l + 18, 80));
  const colorDark = hslToHex(h, Math.min(s + 5, 100), Math.max(l - 8, 22));
  return { heroBg, pageBg, colorLight, colorDark };
}

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
        select: { id: true, nombre: true, slug: true, logo_url: true, descripcion: true, rubro: true, ciudad: true, imagenes: true, color_primario: true },
      },
    },
  });

  if (!oferta || oferta.estado !== 'activa' || !oferta.empresa) notFound();

  const empresa = oferta.empresa;
  const nombreMarca = oferta.nombre_marca ?? empresa.nombre;
  const logoUrl = oferta.logo_url ?? empresa.logo_url;
  const heroImg = (empresa.imagenes as string[])?.[0] ?? null;
  const color = (empresa.color_primario as string | null) ?? '#16a34a';
  const heroTitle = (oferta as any).titulo_hero || oferta.titulo;
  const { heroBg, pageBg, colorLight, colorDark } = derivePalette(color);

  const [tieneCapacitaciones, session] = await Promise.all([
    prisma.capacitacion.count({ where: { empresa_id: empresa.id, activa: true } }).then(n => n > 0),
    getSession(),
  ]);

  let tieneVideoCV = false;
  if (session) {
    const videoCV = await prisma.video.findFirst({
      where: { user_id: session.userId, tipo: 'video_cv', oferta_id: null, es_fragmento: false },
      select: { id: true },
    });
    tieneVideoCV = !!videoCV;
  }

  const postularHref = session
    ? (tieneVideoCV ? `/dashboard?tab=ofertas&oferta_id=${oferta.id}` : `/dashboard/grabar-cv?oferta_id=${oferta.id}`)
    : `/register?oferta_id=${oferta.id}`;

  return (
    <div style={{ fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif', background: pageBg, minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Oportunai" style={{ width: 28, height: 28 }} />
            <span style={{ fontWeight: 700, fontSize: 18, color: '#0f172a' }}>Oportunai</span>
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Iniciar sesión</Link>
            <Link href="/register" style={{ background: '#2563eb', color: '#fff', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Empezar gratis</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO CARD ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{
          background: heroBg,
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex',
          minHeight: 320,
          position: 'relative',
        }}>
          {/* Grain texture overlay */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")",
            opacity: 0.04,
          }} />

          {/* LEFT: text */}
          <div style={{
            flex: 1, padding: '36px 40px', position: 'relative', zIndex: 10,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            backgroundImage: `radial-gradient(circle, ${color}22 1px, transparent 1px)`,
            backgroundSize: '22px 22px',
          }}>

            {/* Badge */}
            <div style={{ marginBottom: 18 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: `${colorLight}22`, color: colorLight,
                border: `1px solid ${colorLight}50`,
                fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                padding: '5px 12px', borderRadius: 999,
                textTransform: 'uppercase',
              }}>
                🔥 BÚSQUEDA ACTIVA
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              color: colorLight, fontWeight: 900,
              fontSize: 'clamp(26px, 3.5vw, 44px)',
              textTransform: 'uppercase', letterSpacing: '-0.01em',
              margin: '0 0 8px 0', lineHeight: 1.05,
            }}>
              {heroTitle}
            </h1>
            {/* Decorative underline */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              <div style={{ width: 48, height: 3, background: colorLight, borderRadius: 999 }} />
              <div style={{ width: 12, height: 3, background: `${colorLight}70`, borderRadius: 999 }} />
              <div style={{ width: 6, height: 3, background: `${colorLight}35`, borderRadius: 999 }} />
            </div>
            <p style={{
              color: 'rgba(226,232,240,0.75)', fontSize: 14, lineHeight: 1.6,
              margin: '0 0 22px 0', maxWidth: 480,
            }}>
              {oferta.descripcion}
            </p>

            {/* Benefit chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              <Chip
                icon={<Video size={14} color="#fff" />}
                bg="#2563eb"
                label="Grabá tu VideoCV"
                sub="En 60 segundos"
              />
              {tieneCapacitaciones && (
                <Chip
                  icon={<GraduationCap size={14} color="#fff" />}
                  bg={color}
                  label="Accedé a capacitaciones"
                  labelColor="#fff"
                  sub="Gratis"
                />
              )}
              <Chip
                icon={<Star size={14} color="#fff" fill="#fff" />}
                bg="#7c3aed"
                label="Destacate"
                sub="antes que otros postulantes"
              />
            </div>

            {/* CTA row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link href={postularHref} style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: colorDark, color: '#fff',
                padding: '13px 32px', borderRadius: 10,
                fontSize: 15, fontWeight: 900, textDecoration: 'none',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                boxShadow: `0 4px 20px ${colorDark}80`,
              }}>
                <Send size={16} /> POSTULARME ›
              </Link>
              <span style={{ color: 'rgba(148,163,184,0.8)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={14} style={{ opacity: 0.6 }} /> 1 posición disponible
              </span>
            </div>
          </div>

          {/* RIGHT: photo */}
          {heroImg ? (
            <div style={{ width: '42%', flexShrink: 0, position: 'relative' }}>
              <img
                src={heroImg}
                alt={nombreMarca}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Color tint filter */}
              <div style={{
                position: 'absolute', inset: 0,
                background: color,
                opacity: 0.22,
                mixBlendMode: 'multiply',
              }} />
              {/* Left fade to blend with dark left panel */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(to right, ${heroBg} 0%, ${heroBg}4D 40%, transparent 70%)`,
              }} />
              {/* Info card over photo */}
              <div style={{
                position: 'absolute', bottom: 24, right: 24,
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: 14, padding: '16px 18px',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)', minWidth: 190, zIndex: 10,
              }}>
                {oferta.ciudad && (
                  <InfoRow icon={<MapPin size={14} />} label="UBICACIÓN" value={oferta.ciudad} />
                )}
                <InfoRow
                  icon={<Briefcase size={14} />}
                  label="MODALIDAD"
                  value={MODALIDAD_LABEL[oferta.modalidad] ?? oferta.modalidad}
                />
                {oferta.area && (
                  <InfoRow icon={<Building2 size={14} />} label="ÁREA" value={oferta.area} />
                )}
              </div>
              {/* Logo marca top-right */}
              {logoUrl && (
                <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
                  <img src={logoUrl} alt={nombreMarca} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                </div>
              )}
            </div>
          ) : (
            /* No photo: show info card directly in right area */
            <div style={{ width: 240, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '24px 32px 24px 0' }}>
              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
                {oferta.ciudad && (
                  <InfoRowDark icon={<MapPin size={14} />} label="UBICACIÓN" value={oferta.ciudad} />
                )}
                <InfoRowDark
                  icon={<Briefcase size={14} />}
                  label="MODALIDAD"
                  value={MODALIDAD_LABEL[oferta.modalidad] ?? oferta.modalidad}
                />
                {oferta.area && (
                  <InfoRowDark icon={<Building2 size={14} />} label="ÁREA" value={oferta.area} />
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── CARDS BELOW ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>

          {tieneVideoCV ? (
            <BottomCard
              icon={<div style={{ width: 48, height: 48, borderRadius: 12, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckCircle size={22} color="#fff" /></div>}
              title="TU VIDEO CV ESTÁ LISTO"
              titleColor="#059669"
              body="Ya tenés tu Video CV grabado. Podés postularte directamente."
              cta="Postularme →"
              ctaHref={postularHref}
            />
          ) : (
            <BottomCard
              icon={<div style={{ width: 48, height: 48, borderRadius: 12, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Video size={22} color="#fff" /></div>}
              title="GRABÁ TU VIDEOCV"
              titleColor="#2563eb"
              body={`Contanos quién sos y por qué querés trabajar en ${nombreMarca}.`}
              cta="Más información →"
              ctaHref={postularHref}
            />
          )}

          {tieneCapacitaciones && (
            <BottomCard
              icon={<div style={{ width: 48, height: 48, borderRadius: 12, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><GraduationCap size={22} color="#fff" /></div>}
              title="CAPACITACIONES GRATIS"
              titleColor="#059669"
              body={`Accedé a cursos exclusivos para postulantes de ${nombreMarca}.`}
              cta="Más información →"
              ctaHref={postularHref}
            />
          )}

          <BottomCard
            icon={
              logoUrl
                ? <img src={logoUrl} alt={nombreMarca} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: 20, color: '#64748b' }}>{nombreMarca[0]}</div>
            }
            title={nombreMarca.toUpperCase()}
            body={empresa.descripcion ?? `${empresa.rubro ? `${empresa.rubro}. ` : ''}Sumate a nuestro equipo.`}
            cta="Conocé más →"
            ctaHref={`/empresa/${empresa.slug}`}
          />
        </div>

        {oferta.requisitos && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <p style={{ fontWeight: 700, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Requisitos</p>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{oferta.requisitos}</p>
          </div>
        )}

        {/* Privacy */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #e2e8f0' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={18} color="#3b82f6" />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', margin: 0 }}>Tu información está segura</p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>En Oportunai protegemos tus datos y solo los compartimos con la empresa.</p>
          </div>
        </div>

        {/* CTA mobile */}
        <div style={{ marginTop: 16 }}>
          <Link href={postularHref} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: colorDark, color: '#fff', padding: '15px 32px', borderRadius: 12,
            fontSize: 15, fontWeight: 900, textDecoration: 'none', textTransform: 'uppercase',
            letterSpacing: '0.07em', boxShadow: `0 4px 20px ${colorDark}66`,
          }}>
            <Send size={18} /> POSTULARME ›
          </Link>
        </div>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 24 }}>
          Powered by <Link href="/" style={{ color: '#3b82f6' }}>Oportunai</Link> — Selección con Video CV
        </p>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Chip({ icon, bg, label, labelColor = '#fff', sub }: {
  icon: React.ReactNode; bg: string; label: string; labelColor?: string; sub: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '8px 12px',
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ color: labelColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.2 }}>{label}</div>
        <div style={{ color: 'rgba(148,163,184,0.8)', fontSize: 10, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
      <div style={{ color: '#94a3b8', marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{label}</p>
        <p style={{ color: '#0f172a', fontWeight: 600, fontSize: 13, margin: '2px 0 0' }}>{value}</p>
      </div>
    </div>
  );
}

function InfoRowDark({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
      <div style={{ color: 'rgba(148,163,184,0.6)', marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ color: 'rgba(148,163,184,0.6)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{label}</p>
        <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, margin: '2px 0 0' }}>{value}</p>
      </div>
    </div>
  );
}

function BottomCard({ icon, title, titleColor = '#0f172a', body, cta, ctaHref }: {
  icon: React.ReactNode; title: string; titleColor?: string; body: string; cta: string; ctaHref: string;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        {icon}
        <p style={{ color: titleColor, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{title}</p>
      </div>
      <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, margin: '0 0 12px' }}>{body}</p>
      <Link href={ctaHref} style={{ color: titleColor !== '#0f172a' ? titleColor : '#2563eb', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
        {cta}
      </Link>
    </div>
  );
}

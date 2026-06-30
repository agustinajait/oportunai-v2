export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  MapPin, Briefcase, Globe, ChevronRight, Users, Send,
  Utensils, Coffee, Wine,
  Package, Truck, Boxes,
  Laptop, Code, Cpu,
  ShoppingBag, Tag, ShoppingCart,
  Heart, Activity, Stethoscope,
  BookOpen, GraduationCap, Pencil,
  HardHat, Hammer, Wrench,
  TrendingUp, DollarSign, BarChart2,
  Plane, MapIcon, Compass,
  Car, Gauge, Fuel,
  Leaf, Sun, Flower2,
  Scissors, Shirt, Sparkles,
} from 'lucide-react';
import type { Metadata } from 'next';
import HeroGallery from '@/components/ui/HeroGallery';
import { resolveFont } from '@/lib/fonts';

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

const RUBRO_ICONS: Record<string, any[]> = {
  gastronomia:  [Utensils, Coffee, Wine],
  logistica:    [Package, Truck, Boxes],
  tecnologia:   [Laptop, Code, Cpu],
  retail:       [ShoppingBag, Tag, ShoppingCart],
  salud:        [Heart, Activity, Stethoscope],
  educacion:    [BookOpen, GraduationCap, Pencil],
  construccion: [HardHat, Hammer, Wrench],
  finanzas:     [TrendingUp, DollarSign, BarChart2],
  turismo:      [Plane, MapIcon, Compass],
  automotriz:   [Car, Gauge, Fuel],
  agro:         [Leaf, Sun, Flower2],
  moda:         [Scissors, Shirt, Sparkles],
};

const DECO_POSITIONS = [
  { top: '6%',  left:  '1%',   size: 58, rot: -14 },
  { top: '28%', left:  '2%',   size: 40, rot:  20 },
  { top: '58%', left:  '0.8%', size: 50, rot:  -6 },
  { top: '82%', left:  '3%',   size: 36, rot:  24 },
  { top: '12%', right: '1%',   size: 46, rot:  16 },
  { top: '42%', right: '0.8%', size: 54, rot: -20 },
  { top: '72%', right: '2%',   size: 38, rot:   9 },
];

function getDecoIcons(rubro?: string | null): any[] {
  if (!rubro) return [];
  const normalized = rubro.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [key, icons] of Object.entries(RUBRO_ICONS)) {
    if (normalized.includes(key) || key.includes(normalized.split(' ')[0])) return icons;
  }
  return [];
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const empresa = await prisma.empresa.findUnique({
    where: { slug: params.slug },
    select: { nombre: true, descripcion: true, logo_url: true, rubro: true, ciudad: true },
  });
  if (!empresa) return {};
  const title = `${empresa.nombre} — Ofertas de trabajo | Oportunai`;
  const description =
    empresa.descripcion ||
    `Conocé las ofertas de trabajo de ${empresa.nombre}${empresa.ciudad ? ` en ${empresa.ciudad}` : ''}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(empresa.logo_url && { images: [{ url: empresa.logo_url }] }),
    },
    twitter: { card: 'summary', title, description },
  };
}

export default async function EmpresaPublicaPage({ params }: { params: { slug: string } }) {
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

  const imagenes = (empresa.imagenes as string[]) ?? [];
  const heroImg = imagenes[0] ?? null;
  const color = (empresa.color_primario as string | null) ?? '#16a34a';
  const bienvenida = (empresa.mensaje_bienvenida as string | null) || 'QUEREMOS CONOCERTE';
  const totalOfertas = (empresa as any).ofertas?.length ?? 0;
  const { heroBg, pageBg, colorLight, colorDark } = derivePalette(color);
  const decoIcons = getDecoIcons(empresa.rubro);
  const font = resolveFont((empresa as any).fuente);

  return (
    <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    {font.url && <link href={font.url} rel="stylesheet" />}
    <div style={{ fontFamily: font.family, background: pageBg, minHeight: '100vh' }}>
    <style>{`
      .oferta-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
      .oferta-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.12); }
    `}</style>

      {/* NAV */}
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

      {/* HERO CARD */}
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

            {/* Logo */}
            {empresa.logo_url && (
              <div style={{ marginBottom: 16 }}>
                <img
                  src={empresa.logo_url}
                  alt={empresa.nombre}
                  style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                />
              </div>
            )}

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
                🔥 {empresa.rubro ?? 'BUSCAMOS TALENTO'}
              </span>
            </div>

            {/* Bienvenida */}
            <p style={{
              color: '#e2e8f0', fontWeight: 800, fontSize: 22,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              margin: '0 0 6px 0', lineHeight: 1.2,
            }}>
              {bienvenida}
            </p>

            {/* Nombre empresa */}
            <h1 style={{
              color: colorLight,
              fontWeight: 900,
              fontSize: 'clamp(26px, 3.5vw, 44px)',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              margin: '0 0 8px 0',
              lineHeight: 1.05,
            }}>
              {empresa.nombre}
            </h1>
            {/* Decorative underline */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              <div style={{ width: 48, height: 3, background: colorLight, borderRadius: 999 }} />
              <div style={{ width: 12, height: 3, background: `${colorLight}70`, borderRadius: 999 }} />
              <div style={{ width: 6, height: 3, background: `${colorLight}35`, borderRadius: 999 }} />
            </div>

            {empresa.descripcion && (
              <p style={{
                color: 'rgba(226,232,240,0.75)', fontSize: 14, lineHeight: 1.6,
                margin: '0 0 22px 0', maxWidth: 480,
              }}>
                {empresa.descripcion}
              </p>
            )}

            {/* CTA row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <a href="#ofertas" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: colorDark, color: '#fff',
                padding: '13px 32px', borderRadius: 10,
                fontSize: 15, fontWeight: 900, textDecoration: 'none',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                boxShadow: `0 4px 20px ${colorDark}80`,
              }}>
                <Send size={16} /> VER OFERTAS ›
              </a>
              {totalOfertas > 0 && (
                <span style={{ color: 'rgba(148,163,184,0.8)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={14} style={{ opacity: 0.6 }} />
                  {totalOfertas} {totalOfertas === 1 ? 'posición disponible' : 'posiciones disponibles'}
                </span>
              )}
            </div>
          </div>

          {/* RIGHT: photo gallery or dark info panel */}
          {imagenes.length > 0 ? (
            <HeroGallery
              images={imagenes}
              alt={empresa.nombre}
              color={color}
              colorLight={colorLight}
              heroBg={heroBg}
              ciudad={empresa.ciudad}
              rubro={empresa.rubro}
              sitioWeb={(empresa as any).sitio_web}
              logoUrl={empresa.logo_url}
            />
          ) : (
            <div style={{ width: 240, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '24px 32px 24px 0' }}>
              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
                {empresa.ciudad && (
                  <InfoRowDark icon={<MapPin size={14} />} label="UBICACIÓN" value={empresa.ciudad} />
                )}
                {empresa.rubro && (
                  <InfoRowDark icon={<Briefcase size={14} />} label="RUBRO" value={empresa.rubro} />
                )}
                {(empresa as any).sitio_web && (
                  <InfoRowDark icon={<Globe size={14} />} label="WEB" value={(empresa as any).sitio_web.replace(/https?:\/\/(www\.)?/, '')} />
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* OFERTAS — gradient background + industry decorations */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Gradient blobs */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(circle 500px at 8% 35%, ${color}10 0%, transparent 65%),
            radial-gradient(circle 350px at 92% 65%, ${color}08 0%, transparent 55%),
            radial-gradient(circle 250px at 50% 90%, ${color}06 0%, transparent 50%)
          `,
        }} />

        {/* Industry deco icons */}
        {decoIcons.length > 0 && DECO_POSITIONS.map((pos, i) => {
          const Icon = decoIcons[i % decoIcons.length];
          return (
            <div key={i} style={{
              position: 'absolute',
              top: (pos as any).top, left: (pos as any).left, right: (pos as any).right,
              transform: `rotate(${pos.rot}deg)`,
              opacity: 0.06,
              pointerEvents: 'none',
              userSelect: 'none',
              color: colorLight,
              zIndex: 0,
            }}>
              <Icon size={pos.size} strokeWidth={1} />
            </div>
          );
        })}

        <div id="ofertas" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 40px', position: 'relative', zIndex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: 11, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, borderBottom: `2px solid ${color}`, paddingBottom: 8, display: 'inline-block' }}>
          Posiciones abiertas
        </p>

        {totalOfertas === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '56px 24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            {empresa.logo_url ? (
              <img src={empresa.logo_url} alt={empresa.nombre} style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', display: 'block', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 14, background: pageBg, border: `2px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26, fontWeight: 900, color }}>
                {empresa.nombre[0]}
              </div>
            )}
            <p style={{ color: '#0f172a', fontWeight: 700, fontSize: 15, margin: '0 0 6px' }}>No hay ofertas activas por ahora.</p>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Volvé pronto para encontrar nuevas oportunidades.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(empresa as any).ofertas.map((oferta: any) => (
              <Link
                key={oferta.id}
                href={`/ofertas/${oferta.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="oferta-card" style={{
                  background: '#fff', borderRadius: 16, padding: '20px 24px',
                  border: '1px solid #e2e8f0', borderLeft: `4px solid ${color}`,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', margin: 0 }}>{oferta.titulo}</p>
                      <span style={{ background: `${color}15`, color, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                        ACTIVA
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: '#64748b' }}>
                      {oferta.ciudad && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} /> {oferta.ciudad}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Briefcase size={13} /> {MODALIDAD_LABEL[oferta.modalidad] ?? oferta.modalidad}
                      </span>
                      {oferta.area && (
                        <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>
                          {oferta.area}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    background: colorDark, color: '#fff',
                    borderRadius: 10, fontSize: 13, fontWeight: 700,
                    padding: '10px 22px', flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    boxShadow: `0 4px 14px ${colorDark}50`,
                  }}>
                    Ver oferta <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 32 }}>
          Powered by <Link href="/" style={{ color: '#3b82f6' }}>Oportunai</Link> — Selección con Video CV
        </p>
        </div>
      </div>
    </div>
    </>
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

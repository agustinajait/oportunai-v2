'use client';

import Link from 'next/link';
import { ArrowLeft, Printer, ExternalLink, Phone, Briefcase, GraduationCap } from 'lucide-react';

interface CvDatos {
  resumen?: string;
  habilidades?: string[];
  experiencia?: { empresa: string; cargo: string; periodo: string; descripcion: string }[];
  educacion?: { institucion: string; titulo: string; periodo: string }[];
  idiomas?: string[];
}

interface Props {
  usuario: {
    id: string;
    nombre_completo: string;
    telefono: string;
    bio: string | null;
    foto_url: string | null;
    slug: string;
    alfa_digital: string | null;
    alfa_score: number | null;
    cv_datos: CvDatos | null;
    videos: { video_url: string }[];
  };
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function alfaEmoji(badge: string) {
  if (badge === 'Perfil nativo digital') return '🚀';
  if (badge === 'Usuario digital activo') return '⚡';
  return '🌱';
}

export default function FlyerClient({ usuario }: Props) {
  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://oportunai.korai.lat'}/u/${usuario.slug}/cv`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=3B2B9E&bgcolor=FFFFFF&data=${encodeURIComponent(profileUrl)}`;

  const cv = usuario.cv_datos as CvDatos | null;
  const descripcion = usuario.bio || cv?.resumen || '';
  const habilidades = cv?.habilidades ?? [];
  const expReciente = cv?.experiencia?.[0] ?? null;
  const eduReciente = cv?.educacion?.[0] ?? null;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #flyer-print, #flyer-print * { visibility: visible !important; }
          #flyer-print {
            position: fixed !important;
            top: 0; left: 0;
            width: 148mm; height: 210mm;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
          }
          @page { size: A5 portrait; margin: 0; }
        }
      `}</style>

      {/* ── Screen wrapper ── */}
      <div style={{ minHeight: '100vh', background: '#F0F0F8', padding: '32px 16px' }}>

        {/* Nav */}
        <div style={{ maxWidth: 480, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5B3FE0', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Volver al dashboard
          </Link>
          <button onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#4B33CC,#6D5AE6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(91,63,224,0.35)' }}>
            <Printer size={15} /> Imprimir / Guardar PDF
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#9090A8', marginBottom: 24 }}>
          Hacé click en "Imprimir / Guardar PDF" → elegí "Guardar como PDF".
        </p>

        {/* ── FLYER ── */}
        <div id="flyer-print"
          style={{
            maxWidth: 420, margin: '0 auto',
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
            overflow: 'hidden',
            fontFamily: "'DM Sans', sans-serif",
          }}>

          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #3A28B8 0%, #5B3FE0 55%, #0A9485 100%)',
            padding: '28px 28px 24px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
              {/* Avatar / photo */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.2)',
                border: '2.5px solid rgba(255,255,255,0.4)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 800, color: '#fff',
              }}>
                {usuario.foto_url
                  ? <img src={usuario.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getInitials(usuario.nombre_completo)
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                  {usuario.nombre_completo}
                </h1>
                {expReciente && (
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '4px 0 0', fontWeight: 500 }}>
                    {expReciente.cargo} · {expReciente.empresa}
                  </p>
                )}
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '4px 0 0' }}>
                  Video CV disponible en Oportunai
                </p>
                {usuario.alfa_digital && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 20, padding: '3px 10px',
                    fontSize: 11, color: '#fff', fontWeight: 600, marginTop: 8,
                  }}>
                    {alfaEmoji(usuario.alfa_digital)} {usuario.alfa_digital}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ display: 'flex' }}>

            {/* Info column */}
            <div style={{ flex: 1, padding: '20px 20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

              {/* Descripción */}
              {descripcion && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Sobre mí</p>
                  <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.65 }}>
                    {descripcion.length > 160 ? descripcion.slice(0, 160) + '…' : descripcion}
                  </p>
                </div>
              )}

              {/* Experiencia reciente */}
              {expReciente && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Experiencia</p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <Briefcase size={12} color="#5B3FE0" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#111118', margin: 0 }}>{expReciente.cargo}</p>
                      <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{expReciente.empresa} · {expReciente.periodo}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Educación */}
              {eduReciente && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Educación</p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <GraduationCap size={12} color="#0A9485" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#111118', margin: 0 }}>{eduReciente.titulo}</p>
                      <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{eduReciente.institucion}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Habilidades */}
              {habilidades.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Habilidades</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {habilidades.slice(0, 5).map((h, i) => (
                      <span key={i} style={{ background: '#ECE9FB', color: '#5B3FE0', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>{h}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contacto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #F0F0F8' }}>
                {usuario.telefono && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={11} color="#5B3FE0" />
                    <span style={{ fontSize: 11, color: '#374151' }}>{usuario.telefono}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ExternalLink size={11} color="#5B3FE0" />
                  <span style={{ fontSize: 10, color: '#6B7280', wordBreak: 'break-all' }}>
                    oportunai.korai.lat/u/{usuario.slug}/cv
                  </span>
                </div>
              </div>

            </div>

            {/* QR column */}
            <div style={{
              width: 140, flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '20px 16px',
              borderLeft: '1px solid #F0F0F8',
              background: '#FAFAFF',
              gap: 8,
            }}>
              <img src={qrUrl} alt="QR" width={110} height={110}
                style={{ borderRadius: 10, border: '1px solid #E8E8F0' }} />
              <p style={{ fontSize: 9, color: '#9090A8', textAlign: 'center', lineHeight: 1.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
                Escaneame para<br />ver mi Video CV
              </p>
            </div>

          </div>

          {/* ── Footer ── */}
          <div style={{ background: '#F8F8FC', borderTop: '1px solid #F0F0F8', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#4B33CC,#7048F0)', overflow: 'hidden' }}>
                <img src="/logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#111118', letterSpacing: '0.04em' }}>OPORTUNAI</span>
            </div>
            <span style={{ fontSize: 10, color: '#B0B0C4' }}>Video CV · Capacitaciones</span>
          </div>

        </div>

        {/* Tips */}
        <div style={{ maxWidth: 420, margin: '24px auto 0', background: '#fff', borderRadius: 14, padding: '18px 22px', border: '1px solid rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111118', marginBottom: 8 }}>¿Cómo usar tu flyer?</p>
          <ul style={{ fontSize: 13, color: '#64748b', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
            <li>Guardá como PDF e imprimí en cualquier copistería</li>
            <li>Compartí el PDF por WhatsApp o email</li>
            <li>Dejalo en empresas cuando vayas a dejar tu CV</li>
            <li>El código QR lleva directo a tu Video CV</li>
          </ul>
          <p style={{ fontSize: 12, color: '#9090A8', marginTop: 10 }}>
            💡 Completá tu bio, experiencia y educación desde el dashboard para que aparezcan en el flyer.
          </p>
        </div>

      </div>
    </>
  );
}

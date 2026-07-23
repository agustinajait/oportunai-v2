'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Printer, ExternalLink,
  Phone, MapPin, Zap, Video,
} from 'lucide-react';

interface CvDatos {
  habilidades?: string[];
}

interface Props {
  usuario: {
    id: string;
    nombre_completo: string;
    telefono: string;
    bio: string | null;
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
  const flyerRef = useRef<HTMLDivElement>(null);
  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://oportunai.korai.lat'}/u/${usuario.slug}/cv`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=3B2B9E&bgcolor=FFFFFF&data=${encodeURIComponent(profileUrl)}`;
  const habilidades = (usuario.cv_datos as CvDatos | null)?.habilidades ?? [];

  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* Print styles */}
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
          }
          @page { size: A5 portrait; margin: 0; }
        }
      `}</style>

      {/* Screen wrapper */}
      <div style={{ minHeight: '100vh', background: '#F0F0F8', padding: '32px 16px' }}>

        {/* Nav bar */}
        <div style={{ maxWidth: 480, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5B3FE0', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Volver al dashboard
          </Link>
          <button onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#4B33CC,#6D5AE6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(91,63,224,0.35)' }}>
            <Printer size={15} /> Imprimir / Guardar PDF
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#9090A8', marginBottom: 24 }}>
          Hacé click en "Imprimir / Guardar PDF" y elegí "Guardar como PDF" en las opciones de impresión.
        </p>

        {/* ── FLYER ── */}
        <div id="flyer-print" ref={flyerRef}
          style={{
            maxWidth: 420,
            margin: '0 auto',
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
            overflow: 'hidden',
            fontFamily: "'DM Sans', sans-serif",
          }}>

          {/* Header gradient */}
          <div style={{
            background: 'linear-gradient(135deg, #3A28B8 0%, #5B3FE0 55%, #0A9485 100%)',
            padding: '36px 32px 28px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative circle */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

            {/* Avatar initials */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: '#fff',
              marginBottom: 14,
              backdropFilter: 'blur(8px)',
            }}>
              {getInitials(usuario.nombre_completo)}
            </div>

            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              {usuario.nombre_completo}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '6px 0 0' }}>
              Video CV disponible · Oportunai
            </p>

            {usuario.alfa_digital && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 20, padding: '4px 12px',
                fontSize: 12, color: '#fff', fontWeight: 600,
                marginTop: 12,
              }}>
                {alfaEmoji(usuario.alfa_digital)} {usuario.alfa_digital}
              </div>
            )}
          </div>

          {/* QR + info */}
          <div style={{ display: 'flex', gap: 0 }}>

            {/* QR code column */}
            <div style={{
              width: 160, flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '28px 20px',
              borderRight: '1px solid #F0F0F8',
              background: '#FAFAFF',
            }}>
              <img
                src={qrUrl}
                alt="QR a mi Video CV"
                width={120} height={120}
                style={{ borderRadius: 10, border: '1px solid #E8E8F0' }}
              />
              <p style={{ fontSize: 10, color: '#9090A8', textAlign: 'center', marginTop: 10, lineHeight: 1.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Escaneame para<br />ver mi Video CV
              </p>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, color: '#5B3FE0' }}>
                <Video size={12} strokeWidth={2} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#5B3FE0' }}>Video CV</span>
              </div>
            </div>

            {/* Info column */}
            <div style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Bio */}
              {usuario.bio && (
                <div>
                  <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{usuario.bio}</p>
                </div>
              )}

              {/* Habilidades */}
              {habilidades.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Habilidades</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {habilidades.slice(0, 4).map((h, i) => (
                      <span key={i} style={{
                        background: '#ECE9FB', color: '#5B3FE0',
                        fontSize: 10, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 20,
                      }}>{h}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contacto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {usuario.telefono && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={11} color="#5B3FE0" />
                    <span style={{ fontSize: 12, color: '#374151' }}>{usuario.telefono}</span>
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
          </div>

          {/* Footer */}
          <div style={{
            background: '#F8F8FC',
            borderTop: '1px solid #F0F0F8',
            padding: '14px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'linear-gradient(135deg,#4B33CC,#7048F0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#111118', letterSpacing: '0.04em' }}>OPORTUNAI</span>
            </div>
            <span style={{ fontSize: 10, color: '#B0B0C4' }}>Video CV · Capacitaciones</span>
          </div>

        </div>

        {/* Tips */}
        <div style={{ maxWidth: 420, margin: '24px auto 0', background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111118', marginBottom: 10 }}>¿Cómo usar tu flyer?</p>
          <ul style={{ fontSize: 13, color: '#64748b', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
            <li>Guardá como PDF e imprimí en cualquier copistería</li>
            <li>Compartí el PDF por WhatsApp o email</li>
            <li>Dejalo en empresas cuando vayas a dejar tu CV</li>
            <li>El código QR lleva directo a tu Video CV</li>
          </ul>
        </div>

      </div>
    </>
  );
}

'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Download, Share2, Phone, ExternalLink, Loader2 } from 'lucide-react';

interface CvDatos {
  resumen?: string;
  experiencia?: { cargo: string; empresa: string; periodo: string; descripcion: string }[];
  habilidades?: string[];
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
    cv_datos: CvDatos | null;
  };
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function CardClient({ usuario }: Props) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://oportunai.korai.lat';
  const profileUrl = `${origin}/u/${usuario.slug}/cv`;

  const cv = usuario.cv_datos as CvDatos | null;
  const cargo = cv?.experiencia?.[0] ? `${cv.experiencia[0].cargo} · ${cv.experiencia[0].empresa}` : null;
  const descripcion = cv?.resumen ?? usuario.bio ?? '';

  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  function descargarVCard() {
    const tel = usuario.telefono?.replace(/\D/g, '');
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${usuario.nombre_completo}`,
      tel ? `TEL;TYPE=CELL:+54${tel}` : '',
      `URL:${profileUrl}`,
      descripcion ? `NOTE:${descripcion.replace(/\n/g, '\\n').slice(0, 200)}` : '',
      cargo ? `TITLE:${cargo}` : '',
      'ORG:Oportunai',
      'END:VCARD',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([lines], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${usuario.slug}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function capturarCard(): Promise<string> {
    const { toPng } = await import('html-to-image');
    const el = cardRef.current!;
    const W = el.offsetWidth;
    const H = el.offsetHeight;

    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed', top: '0', left: '0',
      width: W + 'px', zIndex: '9999',
      opacity: '0', pointerEvents: 'none',
    });
    const clone = el.cloneNode(true) as HTMLElement;
    Object.assign(clone.style, {
      position: 'static', width: W + 'px',
      maxWidth: 'none', margin: '0',
      boxShadow: 'none', borderRadius: '0',
    });
    container.appendChild(clone);
    document.body.appendChild(container);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      return await toPng(clone, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff', width: W, height: H });
    } finally {
      document.body.removeChild(container);
    }
  }

  async function descargarImagen() {
    setDownloading(true);
    try {
      const dataUrl = await capturarCard();
      const a = document.createElement('a');
      a.download = `tarjeta-${usuario.slug}.png`;
      a.href = dataUrl;
      a.click();
    } catch { alert('No se pudo generar la imagen.'); }
    finally { setDownloading(false); }
  }

  async function compartir() {
    setSharing(true);
    try {
      const dataUrl = await capturarCard();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `tarjeta-${usuario.slug}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: usuario.nombre_completo, text: profileUrl });
      } else {
        const a = document.createElement('a');
        a.download = `tarjeta-${usuario.slug}.png`;
        a.href = dataUrl;
        a.click();
      }
    } catch (e: any) { if (e?.name !== 'AbortError') alert('No se pudo compartir.'); }
    finally { setSharing(false); }
  }

  function compartirWhatsApp() {
    const txt = encodeURIComponent(`Mirá mi perfil laboral en Oportunai 👇\n${profileUrl}`);
    window.open(`https://wa.me/?text=${txt}`, '_blank');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F0F8', padding: '32px 16px' }}>

      {/* Nav */}
      <div style={{ maxWidth: 400, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5B3FE0', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Volver
        </Link>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mi tarjeta digital</span>
      </div>

      {/* ── TARJETA ── */}
      <div ref={cardRef}
        style={{ maxWidth: 360, margin: '0 auto', background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(59,40,204,0.18)', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #3A28B8 0%, #5B3FE0 60%, #0A9485 100%)', padding: '32px 24px 28px', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

          {/* Avatar */}
          <div style={{ width: 88, height: 88, borderRadius: '50%', margin: '0 auto 14px', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.45)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: '#fff', position: 'relative', zIndex: 1 }}>
            {usuario.foto_url
              ? <img src={usuario.foto_url} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : getInitials(usuario.nombre_completo)}
          </div>

          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px', lineHeight: 1.2, letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>
            {usuario.nombre_completo}
          </h1>
          {cargo && (
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '0 0 4px', fontWeight: 500, position: 'relative', zIndex: 1 }}>
              {cargo}
            </p>
          )}
          {usuario.alfa_digital && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '3px 12px', fontSize: 11, color: '#fff', fontWeight: 600, marginTop: 8, position: 'relative', zIndex: 1 }}>
              🚀 {usuario.alfa_digital}
            </div>
          )}
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '22px 24px' }}>

          {descripcion && (
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: '0 0 18px', borderBottom: '1px solid #F0F0F8', paddingBottom: 18 }}>
              {descripcion.length > 180 ? descripcion.slice(0, 180) + '…' : descripcion}
            </p>
          )}

          {/* Contacto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {usuario.telefono && (
              <a href={`tel:${usuario.telefono}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ECE9FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={14} color="#5B3FE0" />
                </div>
                <span style={{ fontSize: 14, color: '#111118', fontWeight: 600 }}>{usuario.telefono}</span>
              </a>
            )}
            <a href={profileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ECE9FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ExternalLink size={14} color="#5B3FE0" />
              </div>
              <span style={{ fontSize: 12, color: '#5B3FE0', fontWeight: 500, wordBreak: 'break-all' }}>
                oportunai.korai.lat/u/{usuario.slug}/cv
              </span>
            </a>
          </div>

          {/* QR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: '#FAFAFF', borderRadius: 16, padding: '18px 16px', border: '1px solid #EEEEF5' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 8, border: '1px solid #E8E8F0' }}>
              <QRCodeSVG value={profileUrl} size={110} fgColor="#3B28CC" bgColor="#ffffff" level="M" />
            </div>
            <p style={{ fontSize: 11, color: '#9090A8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center', margin: 0 }}>
              Escaneame para ver mi Video CV
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#F8F8FC', borderTop: '1px solid #EEEEF5', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg,#4B33CC,#7048F0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>O</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#111118', letterSpacing: '0.05em' }}>OPORTUNAI</span>
          </div>
          <span style={{ fontSize: 9.5, color: '#B0B0C4' }}>Tarjeta digital</span>
        </div>
      </div>

      {/* ── Acciones ── */}
      <div style={{ maxWidth: 360, margin: '16px auto 0', background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <p style={{ fontSize: 11.5, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Compartir y guardar</p>

        {/* Guardar contacto — acción principal */}
        <button onClick={descargarVCard}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#4B33CC,#6D5AE6)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 10, boxShadow: '0 4px 16px rgba(91,63,224,0.3)' }}>
          <Download size={16} /> Guardar en contactos (.vcf)
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <button onClick={descargarImagen} disabled={downloading}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: '#F0F0F8', color: '#5B3FE0', border: '1.5px solid #D0C8F8', borderRadius: 12, padding: '10px 8px', fontWeight: 600, fontSize: 11.5, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1 }}>
            {downloading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
            {downloading ? '...' : 'PNG'}
          </button>
          <button onClick={compartir} disabled={sharing}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: '#F0F0F8', color: '#5B3FE0', border: '1.5px solid #D0C8F8', borderRadius: 12, padding: '10px 8px', fontWeight: 600, fontSize: 11.5, cursor: sharing ? 'not-allowed' : 'pointer', opacity: sharing ? 0.7 : 1 }}>
            {sharing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Share2 size={16} />}
            {sharing ? '...' : 'Compartir'}
          </button>
          <button onClick={compartirWhatsApp}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: '#25D366', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 8px', fontWeight: 600, fontSize: 11.5, cursor: 'pointer' }}>
            <WhatsAppIcon />
            WhatsApp
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#B0B0C4', marginTop: 10, lineHeight: 1.5, margin: '10px 0 0' }}>
          💡 <strong>Guardar en contactos</strong>: el receptor abre el archivo y lo agrega directo a su teléfono.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

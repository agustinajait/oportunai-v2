'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Printer, ExternalLink, Phone, Briefcase, GraduationCap, Plus, X, Check, Loader2, Edit3, Camera, Download, Share2, Mail } from 'lucide-react';

interface CvDatos {
  resumen?: string;
  habilidades?: string[];
  experiencia?: { empresa: string; cargo: string; periodo: string; descripcion: string }[];
  educacion?: { institucion: string; titulo: string; periodo: string }[];
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

// WhatsApp icon SVG inline
function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function FlyerClient({ usuario }: Props) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://oportunai.korai.lat';
  const profileUrl = `${origin}/u/${usuario.slug}/cv`;

  const cv = usuario.cv_datos as CvDatos | null;

  const flyerRef = useRef<HTMLDivElement>(null);

  // Editable state
  const [fotoUrl, setFotoUrl] = useState<string | null>(usuario.foto_url ?? null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [resumen, setResumen] = useState(cv?.resumen ?? usuario.bio ?? '');
  const [habilidades, setHabilidades] = useState<string[]>(cv?.habilidades ?? []);
  const [habilidadInput, setHabilidadInput] = useState('');
  const [experiencias, setExperiencias] = useState<{ empresa: string; cargo: string; periodo: string; descripcion: string }[]>(cv?.experiencia ?? []);
  const [educaciones, setEducaciones] = useState<{ institucion: string; titulo: string; periodo: string }[]>(cv?.educacion ?? []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const expReciente = experiencias[0] ?? null;
  const eduReciente = educaciones[0] ?? null;

  async function uploadFoto(file: File) {
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/perfil/foto', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al subir foto');
      setFotoUrl(data.foto_url);
    } catch (err: any) {
      alert('No se pudo subir la foto: ' + (err.message ?? 'error desconocido'));
    } finally {
      setUploadingFoto(false);
    }
  }

  async function guardar() {
    setSaving(true);
    setSaveError(null);
    try {
      const nuevoCvDatos: CvDatos = {
        ...(cv ?? {}),
        resumen: resumen || undefined,
        experiencia: experiencias.length ? experiencias : undefined,
        educacion: educaciones.length ? educaciones : undefined,
        habilidades: habilidades.length ? habilidades : undefined,
      };
      const res = await fetch('/api/users/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_datos: nuevoCvDatos }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Error al guardar');
      }
      setEditing(false);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err: any) {
      setSaveError(err.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function addHabilidad() {
    if (habilidadInput.trim()) {
      setHabilidades(p => [...p, habilidadInput.trim()]);
      setHabilidadInput('');
    }
  }

  async function capturarFlyer(): Promise<string> {
    const { toPng } = await import('html-to-image');
    const el = flyerRef.current!;
    const W = el.offsetWidth;
    const H = el.offsetHeight;

    // html-to-image se confunde con la posición del elemento en la página
    // (margin:auto desplaza el origen). Lo clonamos en un contenedor fijo
    // en (0,0) para que siempre capture desde el ángulo correcto.
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

    // Dos frames para que el browser layoutee el clon
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      return await toPng(clone, {
        cacheBust: true, pixelRatio: 2,
        backgroundColor: '#ffffff', width: W, height: H,
      });
    } finally {
      document.body.removeChild(container);
    }
  }

  async function descargarImagen() {
    if (!flyerRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await capturarFlyer();
      const link = document.createElement('a');
      link.download = `flyer-${usuario.slug}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('No se pudo generar la imagen. Intentá con "Imprimir / PDF".');
    } finally {
      setDownloading(false);
    }
  }

  async function compartir() {
    setSharing(true);
    try {
      const dataUrl = await capturarFlyer();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `flyer-${usuario.slug}.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Flyer de ${usuario.nombre_completo}`, text: `Mirá mi CV en Oportunai: ${profileUrl}` });
      } else {
        const link = document.createElement('a');
        link.download = `flyer-${usuario.slug}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') alert('No se pudo compartir. Intentá descargar la imagen.');
    } finally {
      setSharing(false);
    }
  }

  function compartirWhatsApp() {
    const texto = encodeURIComponent(`¡Mirá mi CV digital en Oportunai! 👇\n${profileUrl}`);
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  }

  function compartirEmail() {
    const subject = encodeURIComponent(`CV de ${usuario.nombre_completo} — Oportunai`);
    const body = encodeURIComponent(`Hola,\n\nTe comparto mi CV digital en Oportunai:\n${profileUrl}\n\nSaludos,\n${usuario.nombre_completo}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
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

      <div style={{ minHeight: '100vh', background: '#F0F0F8', padding: '32px 16px' }}>

        {/* Nav */}
        <div style={{ maxWidth: 560, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5B3FE0', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Volver
          </Link>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {savedOk && <span style={{ fontSize: 13, color: '#0A9485', fontWeight: 600 }}>✓ Guardado</span>}
            <button onClick={() => setEditing(e => !e)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: editing ? '#F0F0F8' : '#fff', color: '#5B3FE0', border: '1px solid #D0C8F8', borderRadius: 10, padding: '9px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              <Edit3 size={14} /> {editing ? 'Ver flyer' : 'Editar datos'}
            </button>
            <button onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#374151', border: '1px solid #E0E0F0', borderRadius: 10, padding: '9px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              <Printer size={14} /> PDF
            </button>
          </div>
        </div>

        {/* ── EDIT PANEL ── */}
        {editing && (
          <div style={{ maxWidth: 560, margin: '0 auto 24px', background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #E0D8FC', boxShadow: '0 4px 20px rgba(91,63,224,0.08)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111118', marginBottom: 18 }}>Completá los datos del flyer</h3>

            {/* Foto */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: fotoUrl ? 'transparent' : 'linear-gradient(135deg,#4B33CC,#7048F0)', border: '3px solid #E0D8FC', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {fotoUrl ? <img src={fotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(usuario.nombre_completo)}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5B3FE0', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Foto de perfil</label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: uploadingFoto ? '#F0F0F8' : '#ECE9FB', color: '#5B3FE0', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: uploadingFoto ? 'default' : 'pointer' }}>
                  {uploadingFoto ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={13} />}
                  {uploadingFoto ? 'Subiendo...' : fotoUrl ? 'Cambiar foto' : 'Subir foto'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingFoto}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadFoto(f); e.currentTarget.value = ''; }} />
                </label>
              </div>
            </div>

            {/* Resumen */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#5B3FE0', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sobre mí / Resumen</label>
              <textarea value={resumen} onChange={e => setResumen(e.target.value)} rows={3}
                placeholder="Breve descripción de tu perfil y objetivos..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #E0E0F0', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
            </div>

            {/* Experiencia */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5B3FE0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Experiencia laboral</label>
                <button onClick={() => setExperiencias(p => [...p, { empresa: '', cargo: '', periodo: '', descripcion: '' }])}
                  style={{ fontSize: 12, color: '#5B3FE0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <Plus size={13} /> Agregar
                </button>
              </div>
              {experiencias.map((e, i) => (
                <div key={i} style={{ background: '#F8F8FC', borderRadius: 10, padding: '12px', marginBottom: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input value={e.cargo} onChange={ev => setExperiencias(p => p.map((x, j) => j === i ? { ...x, cargo: ev.target.value } : x))}
                      placeholder="Cargo / puesto" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0F0', fontSize: 12, fontFamily: 'inherit' }} />
                    <input value={e.empresa} onChange={ev => setExperiencias(p => p.map((x, j) => j === i ? { ...x, empresa: ev.target.value } : x))}
                      placeholder="Empresa" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0F0', fontSize: 12, fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={e.periodo} onChange={ev => setExperiencias(p => p.map((x, j) => j === i ? { ...x, periodo: ev.target.value } : x))}
                      placeholder="Período (ej: 2020–2023)" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0F0', fontSize: 12, fontFamily: 'inherit' }} />
                    <button onClick={() => setExperiencias(p => p.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '0 8px' }}><X size={14} /></button>
                  </div>
                </div>
              ))}
              {experiencias.length === 0 && <p style={{ fontSize: 12, color: '#B0B0C4', fontStyle: 'italic' }}>Sin experiencia cargada</p>}
            </div>

            {/* Educación */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5B3FE0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Educación</label>
                <button onClick={() => setEducaciones(p => [...p, { institucion: '', titulo: '', periodo: '' }])}
                  style={{ fontSize: 12, color: '#5B3FE0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <Plus size={13} /> Agregar
                </button>
              </div>
              {educaciones.map((e, i) => (
                <div key={i} style={{ background: '#F8F8FC', borderRadius: 10, padding: '12px', marginBottom: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input value={e.titulo} onChange={ev => setEducaciones(p => p.map((x, j) => j === i ? { ...x, titulo: ev.target.value } : x))}
                      placeholder="Título / carrera" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0F0', fontSize: 12, fontFamily: 'inherit' }} />
                    <input value={e.institucion} onChange={ev => setEducaciones(p => p.map((x, j) => j === i ? { ...x, institucion: ev.target.value } : x))}
                      placeholder="Institución" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0F0', fontSize: 12, fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={e.periodo} onChange={ev => setEducaciones(p => p.map((x, j) => j === i ? { ...x, periodo: ev.target.value } : x))}
                      placeholder="Período (ej: 2018–2022)" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0F0', fontSize: 12, fontFamily: 'inherit' }} />
                    <button onClick={() => setEducaciones(p => p.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '0 8px' }}><X size={14} /></button>
                  </div>
                </div>
              ))}
              {educaciones.length === 0 && <p style={{ fontSize: 12, color: '#B0B0C4', fontStyle: 'italic' }}>Sin educación cargada</p>}
            </div>

            {/* Habilidades */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#5B3FE0', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Habilidades</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {habilidades.map((h, i) => (
                  <span key={i} style={{ background: '#ECE9FB', color: '#5B3FE0', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {h}
                    <button onClick={() => setHabilidades(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B6CF6', padding: 0, lineHeight: 1 }}><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={habilidadInput} onChange={e => setHabilidadInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { addHabilidad(); e.preventDefault(); } }}
                  placeholder="Escribí una habilidad y presioná Enter"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0F0', fontSize: 12, fontFamily: 'inherit' }} />
                <button onClick={addHabilidad}
                  style={{ background: '#ECE9FB', color: '#5B3FE0', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {saveError && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#B91C1C' }}>
                ⚠️ {saveError}
              </div>
            )}

            <button onClick={guardar} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#4B33CC,#6D5AE6)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={15} />}
              {saving ? 'Guardando...' : 'Guardar y ver flyer'}
            </button>
          </div>
        )}

        {/* ── FLYER ── */}
        {!editing && (
          <>
            {/* Flyer card */}
            <div ref={flyerRef} id="flyer-print"
              style={{ maxWidth: 420, margin: '0 auto', background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.14)', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #3A28B8 0%, #5B3FE0 55%, #0A9485 100%)', padding: '26px 24px 22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.2)', border: '2.5px solid rgba(255,255,255,0.4)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff' }}>
                    {fotoUrl
                      ? <img src={fotoUrl} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : getInitials(usuario.nombre_completo)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{usuario.nombre_completo}</h1>
                    {expReciente && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '4px 0 0', fontWeight: 500 }}>{expReciente.cargo} · {expReciente.empresa}</p>}
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: '4px 0 0' }}>Video CV disponible en Oportunai</p>
                    {usuario.alfa_digital && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#fff', fontWeight: 600, marginTop: 8 }}>
                        {alfaEmoji(usuario.alfa_digital)} {usuario.alfa_digital}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ display: 'flex' }}>
                <div style={{ flex: 1, padding: '18px 18px 18px 22px', display: 'flex', flexDirection: 'column', gap: 13, minWidth: 0 }}>

                  {resumen && (
                    <div>
                      <p style={{ fontSize: 9.5, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Sobre mí</p>
                      <p style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.65 }}>{resumen.length > 160 ? resumen.slice(0, 160) + '…' : resumen}</p>
                    </div>
                  )}

                  {expReciente && (
                    <div>
                      <p style={{ fontSize: 9.5, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Experiencia</p>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <Briefcase size={12} color="#5B3FE0" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#111118', margin: 0 }}>{expReciente.cargo}</p>
                          <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{expReciente.empresa} · {expReciente.periodo}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {eduReciente && (
                    <div>
                      <p style={{ fontSize: 9.5, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Educación</p>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <GraduationCap size={12} color="#0A9485" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#111118', margin: 0 }}>{eduReciente.titulo}</p>
                          <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{eduReciente.institucion}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {habilidades.length > 0 && (
                    <div>
                      <p style={{ fontSize: 9.5, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Habilidades</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {habilidades.slice(0, 5).map((h, i) => (
                          <span key={i} style={{ background: '#ECE9FB', color: '#5B3FE0', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>{h}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!resumen && !expReciente && !eduReciente && habilidades.length === 0 && (
                    <div style={{ padding: '12px', background: '#FFF8EC', borderRadius: 10, border: '1px dashed #F59E0B' }}>
                      <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>
                        ⚠️ Hacé click en <strong>Editar datos</strong> para completar tu flyer.
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #F0F0F8' }}>
                    {usuario.telefono && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={11} color="#5B3FE0" />
                        <span style={{ fontSize: 11, color: '#374151' }}>{usuario.telefono}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ExternalLink size={11} color="#5B3FE0" />
                      <span style={{ fontSize: 10, color: '#6B7280', wordBreak: 'break-all' }}>oportunai.korai.lat/u/{usuario.slug}/cv</span>
                    </div>
                  </div>
                </div>

                {/* QR — generado en el browser, sin CORS */}
                <div style={{ width: 136, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 14px', borderLeft: '1px solid #F0F0F8', background: '#FAFAFF', gap: 8 }}>
                  <div style={{ width: 108, height: 108, borderRadius: 10, border: '1px solid #E8E8F0', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QRCodeSVG value={profileUrl} size={100} fgColor="#3B28CC" bgColor="#ffffff" level="M" />
                  </div>
                  <p style={{ fontSize: 8.5, color: '#9090A8', textAlign: 'center', lineHeight: 1.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
                    Escaneame<br />para ver mi<br />Video CV
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={{ background: '#F8F8FC', borderTop: '1px solid #F0F0F8', padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#4B33CC,#7048F0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>O</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#111118', letterSpacing: '0.04em' }}>OPORTUNAI</span>
                </div>
                <span style={{ fontSize: 10, color: '#B0B0C4' }}>Video CV · Capacitaciones</span>
              </div>
            </div>

            {/* ── Acciones de compartir ── */}
            <div style={{ maxWidth: 420, margin: '16px auto 0', background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9090A8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Compartir y descargar</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                {/* Descargar imagen */}
                <button onClick={descargarImagen} disabled={downloading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'linear-gradient(135deg,#4B33CC,#6D5AE6)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 14px', fontWeight: 700, fontSize: 13, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1 }}>
                  {downloading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
                  {downloading ? 'Generando...' : 'Descargar PNG'}
                </button>
                {/* Compartir nativo / link */}
                <button onClick={compartir} disabled={sharing}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#F0F0F8', color: '#5B3FE0', border: '1.5px solid #D0C8F8', borderRadius: 12, padding: '12px 14px', fontWeight: 700, fontSize: 13, cursor: sharing ? 'not-allowed' : 'pointer', opacity: sharing ? 0.7 : 1 }}>
                  {sharing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Share2 size={14} />}
                  {sharing ? 'Compartiendo...' : 'Compartir'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {/* WhatsApp */}
                <button onClick={compartirWhatsApp}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#25D366', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  <WhatsAppIcon /> WhatsApp
                </button>
                {/* Email */}
                <button onClick={compartirEmail}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#F8F8FC', color: '#374151', border: '1.5px solid #E0E0F0', borderRadius: 12, padding: '12px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  <Mail size={14} /> Email
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#B0B0C4', marginTop: 10, lineHeight: 1.5 }}>
                💡 <strong>Descargar PNG</strong>: imagen tal cual se ve. <strong>WhatsApp/Email</strong>: comparte el link de tu CV.
                En celular, <strong>Compartir</strong> abre el menú del teléfono para enviar la imagen directo.
              </p>
            </div>
          </>
        )}

      </div>
    </>
  );
}

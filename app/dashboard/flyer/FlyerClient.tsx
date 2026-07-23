'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, ExternalLink, Phone, Briefcase, GraduationCap, Plus, X, Check, Loader2, Edit3 } from 'lucide-react';

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

export default function FlyerClient({ usuario }: Props) {
  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://oportunai.korai.lat'}/u/${usuario.slug}/cv`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=3B2B9E&bgcolor=FFFFFF&data=${encodeURIComponent(profileUrl)}`;

  const cv = usuario.cv_datos as CvDatos | null;

  // Editable state
  const [resumen, setResumen] = useState(cv?.resumen ?? usuario.bio ?? '');
  const [habilidades, setHabilidades] = useState<string[]>(cv?.habilidades ?? []);
  const [habilidadInput, setHabilidadInput] = useState('');
  const [experiencias, setExperiencias] = useState<{ empresa: string; cargo: string; periodo: string; descripcion: string }[]>(cv?.experiencia ?? []);
  const [educaciones, setEducaciones] = useState<{ institucion: string; titulo: string; periodo: string }[]>(cv?.educacion ?? []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const expReciente = experiencias[0] ?? null;
  const eduReciente = educaciones[0] ?? null;

  async function guardar() {
    setSaving(true);
    const nuevoCvDatos: CvDatos = {
      ...(cv ?? {}),
      resumen: resumen || undefined,
      experiencia: experiencias.length ? experiencias : undefined,
      educacion: educaciones.length ? educaciones : undefined,
      habilidades: habilidades.length ? habilidades : undefined,
    };
    await fetch('/api/users/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv_datos: nuevoCvDatos }),
    });
    setSaving(false);
    setEditing(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
  }

  function addHabilidad() {
    if (habilidadInput.trim()) {
      setHabilidades(p => [...p, habilidadInput.trim()]);
      setHabilidadInput('');
    }
  }

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

      <div style={{ minHeight: '100vh', background: '#F0F0F8', padding: '32px 16px' }}>

        {/* Nav */}
        <div style={{ maxWidth: 560, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5B3FE0', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Volver
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {savedOk && <span style={{ fontSize: 13, color: '#0A9485', fontWeight: 600 }}>✓ Guardado</span>}
            <button onClick={() => setEditing(e => !e)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: editing ? '#F0F0F8' : '#fff', color: '#5B3FE0', border: '1px solid #D0C8F8', borderRadius: 10, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              <Edit3 size={14} /> {editing ? 'Ver flyer' : 'Editar datos'}
            </button>
            <button onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#4B33CC,#6D5AE6)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(91,63,224,0.3)' }}>
              <Printer size={14} /> Imprimir / PDF
            </button>
          </div>
        </div>

        {/* ── EDIT PANEL ── */}
        {editing && (
          <div style={{ maxWidth: 560, margin: '0 auto 24px', background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #E0D8FC', boxShadow: '0 4px 20px rgba(91,63,224,0.08)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111118', marginBottom: 18 }}>Completá los datos del flyer</h3>

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
            <div id="flyer-print"
              style={{ maxWidth: 420, margin: '0 auto', background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.14)', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>

              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #3A28B8 0%, #5B3FE0 55%, #0A9485 100%)', padding: '26px 24px 22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.2)', border: '2.5px solid rgba(255,255,255,0.4)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff' }}>
                    {usuario.foto_url ? <img src={usuario.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(usuario.nombre_completo)}
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

                {/* QR */}
                <div style={{ width: 136, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 14px', borderLeft: '1px solid #F0F0F8', background: '#FAFAFF', gap: 8 }}>
                  <img src={qrUrl} alt="QR" width={108} height={108} style={{ borderRadius: 10, border: '1px solid #E8E8F0' }} />
                  <p style={{ fontSize: 8.5, color: '#9090A8', textAlign: 'center', lineHeight: 1.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
                    Escaneame<br />para ver mi<br />Video CV
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={{ background: '#F8F8FC', borderTop: '1px solid #F0F0F8', padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#4B33CC,#7048F0)', overflow: 'hidden' }}>
                    <img src="/logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#111118', letterSpacing: '0.04em' }}>OPORTUNAI</span>
                </div>
                <span style={{ fontSize: 10, color: '#B0B0C4' }}>Video CV · Capacitaciones</span>
              </div>
            </div>

            <div style={{ maxWidth: 420, margin: '20px auto 0', background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#111118', marginBottom: 8 }}>¿Cómo usar tu flyer?</p>
              <ul style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
                <li>Guardá como PDF e imprimí en cualquier copistería</li>
                <li>Compartí el PDF por WhatsApp o email</li>
                <li>El código QR lleva directo a tu Video CV</li>
              </ul>
            </div>
          </>
        )}

      </div>
    </>
  );
}

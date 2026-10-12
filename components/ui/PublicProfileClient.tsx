'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, Video, Mic, Phone, Mail, MapPin,
  Download, Share2, Check,
  ChevronRight, FileVideo,
  Briefcase, GraduationCap, Wrench, Calendar,
  ShieldCheck, Building2, Star, FileText
} from 'lucide-react';

interface VideoItem { id: string; tipo: string; video_url: string; created_at: string }
interface ArchivoItem { id: string; file_url: string; file_type: string }
interface DocumentoItem { tipo: string; file_url: string }
interface ReferenciaItem { id: string; empresa_nombre: string; referidor_nombre: string; referidor_cargo: string | null; referidor_email: string | null; mensaje: string | null; fecha_validada: string | null }
interface CvDatos {
  resumen?: string;
  experiencia?: { empresa: string; cargo: string; periodo: string }[];
  educacion?: { institucion: string; titulo: string; periodo: string }[];
  habilidades?: string[];
  idiomas?: string[];
}

type SemaforoColor = 'verde' | 'amarillo' | 'rojo';
interface KoraiSemaforo {
  empleo?: SemaforoColor;
  educacion?: SemaforoColor;
  ingresos?: SemaforoColor;
  salud?: SemaforoColor;
  vivienda?: SemaforoColor;
  red?: SemaforoColor;
  ultima_actualizacion?: string;
}

interface UsuarioPublico {
  nombre_completo: string;
  bio: string | null;
  slug: string;
  foto_url?: string | null;
  email: string;
  telefono: string;
  direccion: string;
  alfa_digital?: string | null;
  alfa_score?: number | null;
  fecha_nacimiento?: string | null;
  cv_datos?: CvDatos | null;
  pagado?: boolean;
  videos: VideoItem[];
  archivos: ArchivoItem[];
  documentos?: DocumentoItem[];
  referencias?: ReferenciaItem[];
  korai_semaforo?: KoraiSemaforo | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  sitio_web?: string | null;
  capacitate_progreso?: Array<{
    puntaje_final: number | null;
    aprobada_en: string | null;
    competencias_ok: unknown;
    contenido: { titulo: string; icono: string | null; categoria: string; slug: string };
  }>;
}

const DOCS_LABELS: Record<string, string> = {
  dni: 'DNI',
  antecedentes_penales: 'Antecedentes penales',
  manipulacion_alimentos: 'Manip. alimentos',
  libreta_sanitaria: 'Libreta sanitaria',
  registro_conducir: 'Reg. de conducir',
  otro: 'Otro documento',
};

function calcularEdad(fechaNac: string | null | undefined): number | null {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function extraerCiudad(direccion: string | null | undefined): string {
  if (!direccion) return '';
  const partes = direccion.split(',');
  return partes.length >= 2 ? partes[partes.length - 2].trim() : partes[0].trim();
}

interface Props {
  usuario: UsuarioPublico;
  tipo: 'cv' | 'pitch';
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
};

export default function PublicProfileClient({ usuario, tipo }: Props) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [downloading, setDownloading] = useState(false);

  const video    = usuario.videos[0] ?? null;
  const archivo  = usuario.archivos[0] ?? null;
  const isCv     = tipo === 'cv';
  const firstName = usuario.nombre_completo.split(' ')[0];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const profileUrl = `${appUrl}/u/${usuario.slug}/${tipo}`;

  const shareTitle = isCv
    ? `${usuario.nombre_completo} — Perfil laboral en Oportunai`
    : `${usuario.nombre_completo} — Video Pitch en Oportunai`;
  const shareText = isCv
    ? `Mirá este talento en Oportunai 👇`
    : `Mirá este Video Pitch en Oportunai 👇`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: profileUrl });
        setShareState('shared');
        setTimeout(() => setShareState('idle'), 2500);
      } catch (err: any) {
        if (err?.name !== 'AbortError') fallbackCopy();
      }
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = async () => {
    const textToCopy = `${shareText} ${profileUrl}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const input = document.createElement('input');
      input.value = textToCopy;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setShareState('copied');
    setTimeout(() => setShareState('idle'), 2500);
  };

  const handleDownloadVideo = async () => {
    if (!video) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/videos/download?id=${video.id}`);
      if (!res.ok) throw new Error('No se pudo descargar el video');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${isCv ? 'video-cv' : 'video-pitch'}-${usuario.slug}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[download]', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0d0d14' }}>

      {/* ── NAV ── */}
      <nav style={{ background: 'rgba(26,15,60,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)' }} className="sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>Oportunai</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95"
              style={shareState !== 'idle'
                ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
              }
            >
              {shareState !== 'idle' ? <><Check size={11} /> Copiado</> : <><Share2 size={11} /> Compartir</>}
            </button>
            <Link href="/login" className="text-xs font-medium px-3 py-1.5 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* ── CONTEXTO ── */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#34d399' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{firstName}</span> está buscando trabajo · Perfil laboral digital
          </span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4 pb-28 sm:pb-8">

        {/* ── HERO ── */}
        <div style={{ ...card, overflow: 'hidden' }}>

          {/* Header con gradiente oscuro */}
          <div className="relative px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg,#1a0f3c,#2d1b69)' }}>
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #4B33CC 0%, transparent 55%)' }} />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xl text-white ring-2 shadow-lg"
                style={{ background: usuario.foto_url ? 'transparent' : 'rgba(255,255,255,0.15)', ringColor: 'rgba(255,255,255,0.2)' }}>
                {usuario.foto_url
                  ? <img src={usuario.foto_url} alt="" className="w-full h-full object-cover" />
                  : usuario.nombre_completo.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                }
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-white text-lg leading-tight">
                  {usuario.nombre_completo}
                </h1>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/15 text-white px-2 py-0.5 rounded-full">
                    {isCv ? <Video size={9} /> : <Mic size={9} />}
                    {isCv ? 'Video CV' : 'Video Pitch'}
                  </span>
                  {usuario.alfa_digital && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/10 text-white/80 px-2 py-0.5 rounded-full">
                      {usuario.alfa_digital === 'Perfil nativo digital' ? '🚀' : usuario.alfa_digital === 'Usuario digital activo' ? '⚡' : '🌱'}
                      {usuario.alfa_digital}
                    </span>
                  )}
                  {(usuario.referencias?.length ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                      <Star size={9} fill="currentColor" />
                      {usuario.referencias!.length} ref.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio + quick info */}
          <div className="px-5 py-4 space-y-3">
            {usuario.bio && (
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{usuario.bio}</p>
            )}
            {(() => {
              const edad = calcularEdad(usuario.fecha_nacimiento);
              const ciudad = extraerCiudad(usuario.direccion);
              return (edad || ciudad) ? (
                <div className="flex flex-wrap gap-3">
                  {edad && (
                    <span className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <Calendar size={11} color="rgba(255,255,255,0.3)" /> {edad} años
                    </span>
                  )}
                  {ciudad && (
                    <span className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <MapPin size={11} color="rgba(255,255,255,0.3)" /> {ciudad}
                    </span>
                  )}
                </div>
              ) : null;
            })()}

            {/* CTA principal — desktop */}
            <div className="hidden sm:flex gap-2 pt-1">
              <button
                onClick={() => setShowContactModal(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }}
              >
                <Phone size={14} /> Ver datos de contacto
              </button>
              {archivo && (
                <a
                  href={`/api/cv/public/${usuario.slug}`}
                  download
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
                >
                  <Download size={14} /> CV
                </a>
              )}
            </div>
          </div>

          {/* ── Video ── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
              {isCv ? <Video size={12} color="#a78bfa" /> : <Mic size={12} color="#34d399" />}
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {isCv ? 'Video CV' : 'Video Pitch'}
              </p>
            </div>
            {video && usuario.pagado ? (
              <>
                <video
                  src={video.video_url}
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full aspect-video bg-black"
                />
                <div className="px-4 py-3 flex gap-2">
                  <button
                    onClick={handleShare}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-95"
                    style={shareState !== 'idle'
                      ? { background: 'rgba(52,211,153,0.12)', color: '#34d399' }
                      : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
                    }
                  >
                    {shareState !== 'idle' ? <><Check size={12} /> ¡Copiado!</> : <><Share2 size={12} /> Compartir perfil</>}
                  </button>
                  <button
                    onClick={handleDownloadVideo}
                    disabled={downloading}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-95 disabled:opacity-60"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    {downloading
                      ? <><span className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'transparent' }} /> ...</>
                      : <><FileVideo size={12} /> Descargar video</>}
                  </button>
                </div>
              </>
            ) : video && !usuario.pagado ? (
              <div className="mx-4 mb-4 rounded-xl bg-gray-900 aspect-video flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                <video
                  src={video.video_url}
                  preload="metadata"
                  playsInline
                  className="w-full h-full object-cover absolute inset-0 opacity-20 blur-sm"
                />
                <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={22} className="text-white/80" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Video en activación</p>
                    <p className="text-white/50 text-xs mt-1 leading-relaxed">
                      {firstName} está configurando su perfil.<br />Podés contactarle directamente.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-4 mb-4 rounded-xl bg-gray-900 aspect-video flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  {isCv ? <Video size={20} className="text-violet-400 opacity-60" /> : <Mic size={20} className="text-emerald-400 opacity-60" />}
                </div>
                <p className="text-white/40 text-xs">Sin video todavía</p>
              </div>
            )}
          </div>
        </div>

        {/* ── SECCIÓN PRINCIPAL: 2 columnas ── */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_280px] gap-4 items-start">

          {/* ── COLUMNA IZQUIERDA ── */}
          <div className="space-y-4">

            {/* Perfil del candidato */}
            {(() => {
              const cv = usuario.cv_datos;
              const tieneContenido = cv?.resumen || (cv?.experiencia?.length ?? 0) > 0
                || (cv?.educacion?.length ?? 0) > 0 || (cv?.habilidades?.length ?? 0) > 0
                || (cv?.idiomas?.length ?? 0) > 0;
              if (!tieneContenido) return null;
              return (
                <div style={{ ...card, padding: '20px' }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      <Briefcase size={14} color="#a78bfa" /> Perfil profesional
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                      <Check size={9} strokeWidth={3} /> CV cargado
                    </span>
                  </div>

                  {cv?.resumen && (
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{cv.resumen}</p>
                  )}

                  {(cv?.experiencia?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <Briefcase size={10} /> Experiencia
                      </p>
                      <div className="space-y-2">
                        {cv!.experiencia!.map((e, i) => (
                          <div key={i} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{e.cargo}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{e.empresa}{e.periodo ? ` · ${e.periodo}` : ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(cv?.educacion?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <GraduationCap size={10} /> Educación
                      </p>
                      <div className="space-y-2">
                        {cv!.educacion!.map((e, i) => (
                          <div key={i} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{e.titulo}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{e.institucion}{e.periodo ? ` · ${e.periodo}` : ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(cv?.habilidades?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <Wrench size={10} /> Habilidades
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {cv!.habilidades!.map((h, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>{h}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(cv?.idiomas?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cv!.idiomas!.map((l, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{l}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Documentos */}
            {(usuario.documentos?.length ?? 0) > 0 && (
              <div style={{ ...card, padding: '16px' }} className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={14} color="#a78bfa" />
                  <h3 className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Documentos</h3>
                  <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                    <Check size={9} strokeWidth={3} /> {usuario.documentos!.length} cargados
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {usuario.documentos!.map(doc => (
                    <a
                      key={doc.tipo}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                      style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}
                    >
                      <FileText size={11} />
                      {DOCS_LABELS[doc.tipo] ?? doc.tipo}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Referencias verificadas */}
            {(usuario.referencias?.length ?? 0) > 0 && (
              <div style={{ ...card, padding: '16px' }} className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} color="#fbbf24" />
                  <h3 className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Referencias verificadas</h3>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
                    <Star size={9} fill="currentColor" /> {usuario.referencias!.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {usuario.referencias!.map(r => (
                    <div key={r.id} className="rounded-xl p-3.5 space-y-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,191,36,0.15)' }}>
                            <Building2 size={14} color="#fbbf24" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm leading-tight" style={{ color: 'rgba(255,255,255,0.85)' }}>{r.empresa_nombre}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                              {r.referidor_nombre}{r.referidor_cargo ? ` · ${r.referidor_cargo}` : ''}
                            </p>
                            {r.referidor_email && (
                              <a href={`mailto:${r.referidor_email}`} className="text-xs transition-colors" style={{ color: '#a78bfa' }}>
                                {r.referidor_email}
                              </a>
                            )}
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 font-semibold" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                          <Check size={9} strokeWidth={3} /> Verificado
                        </span>
                      </div>
                      {r.mensaje && (
                        <p className="text-sm italic leading-relaxed pl-10" style={{ color: 'rgba(255,255,255,0.55)' }}>"{r.mensaje}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── COLUMNA DERECHA ── */}
          <div className="space-y-4">

            {/* Capacitaciones aprobadas */}
            {usuario.capacitate_progreso && usuario.capacitate_progreso.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(45,212,191,0.25)' }}>
                <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #2dd4bf, #0d9488)' }} />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🎓</span>
                    <div>
                      <h2 className="font-bold text-sm leading-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>Capacitaciones</h2>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{usuario.capacitate_progreso.length} {usuario.capacitate_progreso.length === 1 ? 'certificación' : 'certificaciones'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {usuario.capacitate_progreso.map((p, i) => (
                      <div key={i} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)' }}>
                        {p.contenido.icono && (
                          <span className="text-sm leading-none flex-shrink-0">{p.contenido.icono}</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-tight" style={{ color: '#2dd4bf' }}>{p.contenido.titulo}</p>
                          {p.puntaje_final != null && (
                            <p className="text-[10px] font-medium" style={{ color: 'rgba(45,212,191,0.7)' }}>{p.puntaje_final}% · Aprobada</p>
                          )}
                        </div>
                        <Star size={10} color="#2dd4bf" fill="#2dd4bf" className="flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

{false && null /* semáforo Korai removido del perfil público */}
          </div>

        </div>{/* fin grid 2 columnas */}

        {/* ── SWITCH CV / PITCH ── */}
        <div style={{ ...card, padding: '16px' }} className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {isCv ? '¿Querés ver su Video Pitch?' : '¿Querés ver su Video CV?'}
          </p>
          <Link
            href={`/u/${usuario.slug}/${isCv ? 'pitch' : 'cv'}`}
            className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: '#a78bfa' }}
          >
            {isCv ? <Mic size={14} /> : <Video size={14} />}
            {isCv ? 'Ver Pitch' : 'Ver Video CV'}
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* ── FOOTER ── */}
        <p className="text-center text-xs pb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Perfil creado en{' '}
          <Link href="/" className="transition-colors font-medium" style={{ color: '#a78bfa' }}>Oportunai</Link>
        </p>
      </main>

      {/* ── STICKY MOBILE CTA ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-3" style={{ background: 'linear-gradient(to top, #0d0d14 70%, transparent)' }}>
        <div className="flex gap-2">
          <button
            onClick={() => setShowContactModal(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.35)' }}
          >
            <Phone size={16} /> Ver contacto
          </button>
          {archivo && (
            <a
              href={`/api/cv/public/${usuario.slug}`}
              download
              className="inline-flex items-center justify-center gap-1.5 px-4 py-4 rounded-2xl text-sm font-semibold transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
            >
              <Download size={16} />
            </a>
          )}
        </div>
      </div>

      {/* ── MODAL DE CONTACTO ── */}
      {showContactModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="rounded-2xl w-full max-w-sm overflow-hidden"
            style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.1)', animation: 'slideUp 0.2s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{ background: usuario.foto_url ? 'transparent' : 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>
                  {usuario.foto_url
                    ? <img src={usuario.foto_url} alt="" className="w-full h-full object-cover" />
                    : usuario.nombre_completo.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                  }
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>{usuario.nombre_completo}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Datos de contacto</p>
                </div>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xl leading-none transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.07)' }}
              >
                ×
              </button>
            </div>

            <div className="px-4 pb-4 space-y-2">
              {usuario.telefono && (
                <a href={`tel:${usuario.telefono}`}
                  className="flex items-center gap-3 p-3.5 rounded-xl transition-colors group"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>
                    <Phone size={15} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>Teléfono</p>
                    <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{usuario.telefono}</p>
                  </div>
                </a>
              )}
              {usuario.email && (
                <a href={`mailto:${usuario.email}`}
                  className="flex items-center gap-3 p-3.5 rounded-xl transition-colors group"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>
                    <Mail size={15} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>Email</p>
                    <p className="text-sm font-bold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>{usuario.email}</p>
                  </div>
                </a>
              )}
              {usuario.direccion && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <MapPin size={15} color="rgba(255,255,255,0.5)" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>Ubicación</p>
                    <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.7)' }}>{usuario.direccion}</p>
                  </div>
                </div>
              )}

              {(usuario.linkedin_url || usuario.instagram_url || usuario.sitio_web) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {usuario.linkedin_url && (
                    <a href={usuario.linkedin_url.startsWith('http') ? usuario.linkedin_url : `https://${usuario.linkedin_url}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
                      style={{ color: '#93c5fd', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </a>
                  )}
                  {usuario.instagram_url && (
                    <a href={usuario.instagram_url.startsWith('http') ? usuario.instagram_url : `https://instagram.com/${usuario.instagram_url.replace('@', '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
                      style={{ color: '#f9a8d4', background: 'rgba(244,114,182,0.12)', border: '1px solid rgba(244,114,182,0.2)' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      Instagram
                    </a>
                  )}
                  {usuario.sitio_web && (
                    <a href={usuario.sitio_web.startsWith('http') ? usuario.sitio_web : `https://${usuario.sitio_web}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
                      style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      🌐 Sitio web
                    </a>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowContactModal(false)}
                className="w-full mt-1 py-3 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

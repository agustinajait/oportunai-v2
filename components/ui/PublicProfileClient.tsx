'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, Video, Mic, Phone, Mail, MapPin,
  Download, Eye, EyeOff, Share2, Check,
  User, ChevronRight, FileVideo, Link2,
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

export default function PublicProfileClient({ usuario, tipo }: Props) {
  const [showContact, setShowContact] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [downloading, setDownloading] = useState(false);

  const video    = usuario.videos[0] ?? null;
  const archivo  = usuario.archivos[0] ?? null;
  const isCv     = tipo === 'cv';
  const firstName = usuario.nombre_completo.split(' ')[0];

  // Build the profile URL using the configured app URL (avoids showing vercel deploy URLs)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const profileUrl = `${appUrl}/u/${usuario.slug}/${tipo}`;

  const shareTitle = isCv
    ? `${usuario.nombre_completo} — Perfil laboral en Oportunai`
    : `${usuario.nombre_completo} — Video Pitch en Oportunai`;
  const shareText = isCv
    ? `Mirá este talento en Oportunai 👇`
    : `Mirá este Video Pitch en Oportunai 👇`;

  // ── Share handler: native on mobile, clipboard fallback on desktop ──
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: profileUrl });
        setShareState('shared');
        setTimeout(() => setShareState('idle'), 2500);
      } catch (err: any) {
        // User cancelled — silently ignore AbortError
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

  // ── Video download via backend endpoint ──────────────────────────
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

  const accentClass = isCv
    ? { badge: 'bg-brand-100 text-brand-700', icon: 'text-brand-500', btn: 'btn-primary', ring: 'bg-brand-600/20' }
    : { badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-500', btn: 'inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl active:scale-95 transition-all text-sm', ring: 'bg-emerald-600/20' };

  return (
    <div className="min-h-screen bg-ink-50">

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-ink-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-ink-800">Oportunai</span>
          </Link>
          <Link href="/login" className="btn-ghost text-sm py-2 px-4">
            Iniciar sesión
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* ── HEADER CARD ───────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xl text-white flex-shrink-0"
                style={{ background: usuario.foto_url ? 'transparent' : 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>
                {usuario.foto_url
                  ? <img src={usuario.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : usuario.nombre_completo.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                }
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold text-ink-900 leading-tight truncate">
                  {usuario.nombre_completo}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`badge ${accentClass.badge} flex items-center gap-1`}>
                    {isCv ? <Video size={11} /> : <Mic size={11} />}
                    {isCv ? 'Video CV' : 'Video Pitch'}
                  </span>
                  {usuario.alfa_digital && (
                    <span className="badge bg-purple-100 text-purple-700 flex items-center gap-1">
                      {usuario.alfa_digital === 'Perfil nativo digital' ? '🚀' : usuario.alfa_digital === 'Usuario digital activo' ? '⚡' : '🌱'}
                      {usuario.alfa_digital}
                    </span>
                  )}
                  {(usuario.referencias?.length ?? 0) > 0 && (
                    <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1">
                      <Star size={11} fill="currentColor" />
                      {usuario.referencias!.length} {usuario.referencias!.length === 1 ? 'referencia' : 'referencias'} verificadas
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {usuario.bio ? (
            <p className="mt-4 text-ink-600 text-sm leading-relaxed border-t border-ink-100 pt-4">
              {usuario.bio}
            </p>
          ) : (
            <p className="mt-4 text-ink-300 text-sm italic border-t border-ink-100 pt-4">
              Este usuario aún no agregó una bio.
            </p>
          )}
        </div>

        {/* ── SEMÁFORO KORAI ────────────────────────────────────── */}
        {(() => {
          const sem = usuario.korai_semaforo ?? null;
          const DIMS = [
            { key: 'empleo' as const,    label: 'Empleo',    icon: '💼' },
            { key: 'educacion' as const, label: 'Educación', icon: '📚' },
            { key: 'ingresos' as const,  label: 'Ingresos',  icon: '💰' },
            { key: 'salud' as const,     label: 'Salud',     icon: '❤️' },
            { key: 'vivienda' as const,  label: 'Vivienda',  icon: '🏠' },
            { key: 'red' as const,       label: 'Red',       icon: '🤝' },
          ];
          const tieneDiag = sem && DIMS.some(d => sem[d.key]);
          if (!tieneDiag) return null;

          const colorDot = (c?: SemaforoColor) =>
            c === 'verde'    ? 'bg-emerald-500' :
            c === 'amarillo' ? 'bg-amber-400'   :
            c === 'rojo'     ? 'bg-red-500'     : 'bg-gray-200';
          const colorText = (c?: SemaforoColor) =>
            c === 'verde'    ? 'text-emerald-700' :
            c === 'amarillo' ? 'text-amber-700'   :
            c === 'rojo'     ? 'text-red-600'     : 'text-gray-400';
          const colorLabel = (c?: SemaforoColor) =>
            c === 'verde'    ? 'Bien'        :
            c === 'amarillo' ? 'Atención'    :
            c === 'rojo'     ? 'Prioritario' : '—';

          const rojas    = DIMS.filter(d => sem![d.key] === 'rojo');
          const amarillas = DIMS.filter(d => sem![d.key] === 'amarillo');

          return (
            <div className="card p-5 border border-amber-100 bg-gradient-to-br from-amber-50/40 to-white">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚦</span>
                  <div>
                    <h2 className="font-semibold text-ink-800 text-sm leading-tight">Contexto de vida</h2>
                    <p className="text-[10px] text-ink-400">Diagnóstico de bienestar — Korai</p>
                  </div>
                </div>
                {sem?.ultima_actualizacion && (
                  <span className="text-[10px] text-ink-300">
                    {new Date(sem.ultima_actualizacion).toLocaleDateString('es-AR')}
                  </span>
                )}
              </div>

              {/* 6 dimensiones */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                {DIMS.map(d => (
                  <div key={d.key} className="flex flex-col items-center gap-1 bg-white rounded-xl border border-gray-100 px-2 py-2.5">
                    <span className="text-base">{d.icon}</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${colorDot(sem![d.key])}`} />
                    <p className="text-[10px] font-medium text-ink-600 text-center leading-tight">{d.label}</p>
                    <p className={`text-[9px] font-semibold ${colorText(sem![d.key])}`}>
                      {colorLabel(sem![d.key])}
                    </p>
                  </div>
                ))}
              </div>

              {/* Resumen contextual */}
              {rojas.length > 0 && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 leading-relaxed">
                  <span className="font-semibold">Áreas prioritarias:</span> {rojas.map(d => d.label).join(', ')}. El candidato puede necesitar flexibilidad o apoyo en estas dimensiones.
                </p>
              )}
              {rojas.length === 0 && amarillas.length > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                  <span className="font-semibold">En proceso de mejora:</span> {amarillas.map(d => d.label).join(', ')}.
                </p>
              )}
              {rojas.length === 0 && amarillas.length === 0 && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 leading-relaxed">
                  🌟 <span className="font-semibold">Situación estable</span> en todas las dimensiones.
                </p>
              )}
            </div>
          );
        })()}

        {/* ── CAPACITACIONES APROBADAS ──────────────────────────── */}
        {usuario.capacitate_progreso && usuario.capacitate_progreso.length > 0 && (
          <div className="card p-5 border border-teal-100 bg-gradient-to-br from-teal-50/40 to-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🎓</span>
              <div>
                <h2 className="font-semibold text-ink-800 text-sm leading-tight">Capacitaciones aprobadas</h2>
                <p className="text-[10px] text-ink-400">{usuario.capacitate_progreso.length} {usuario.capacitate_progreso.length === 1 ? 'certificación obtenida' : 'certificaciones obtenidas'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {usuario.capacitate_progreso.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white border border-teal-100 rounded-xl px-3 py-2 shadow-sm"
                >
                  {p.contenido.icono && (
                    <span className="text-base leading-none">{p.contenido.icono}</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-800 leading-tight truncate max-w-[140px]">
                      {p.contenido.titulo}
                    </p>
                    {p.puntaje_final != null && (
                      <p className="text-[10px] text-teal-600 font-medium">{p.puntaje_final}% · Aprobada</p>
                    )}
                  </div>
                  <Star size={12} className="text-teal-500 fill-teal-500 flex-shrink-0 ml-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VIDEO PLAYER ──────────────────────────────────────── */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 flex items-center gap-2">
            {isCv
              ? <Video size={18} className={accentClass.icon} />
              : <Mic   size={18} className={accentClass.icon} />}
            <h2 className="font-display text-lg font-semibold text-ink-800">
              {isCv ? `Video CV de ${firstName}` : `Video Pitch de ${firstName}`}
            </h2>
          </div>

          {/* Player */}
          {video ? (
            <video
              src={video.video_url}
              controls
              preload="metadata"
              playsInline
              className="w-full aspect-video bg-black"
            />
          ) : (
            <div className="mx-6 mb-6 rounded-xl bg-ink-900 aspect-video flex flex-col items-center justify-center gap-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${accentClass.ring}`}>
                {isCv
                  ? <Video size={28} className="text-brand-400 opacity-60" />
                  : <Mic   size={28} className="text-emerald-400 opacity-60" />}
              </div>
              <p className="text-white/40 text-sm">El video aún no está disponible</p>
            </div>
          )}

          {/* ── ACTION BAR below the video ──────────────────────── */}
          {video && (
            <div className="px-4 py-4 flex flex-wrap gap-3 border-t border-ink-100">

              {/* Share — native on mobile, clipboard on desktop */}
              <button
                onClick={handleShare}
                className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 ${
                  shareState === 'idle'
                    ? 'bg-ink-800 hover:bg-ink-700 text-white'
                    : shareState === 'copied'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand-600 text-white'
                }`}
              >
                {shareState === 'copied' ? (
                  <><Check size={16} /> Link copiado</>
                ) : shareState === 'shared' ? (
                  <><Check size={16} /> ¡Compartido!</>
                ) : (
                  <><Share2 size={16} /> Compartir perfil</>
                )}
              </button>

              {/* Download video */}
              <button
                onClick={handleDownloadVideo}
                disabled={downloading}
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 transition-all active:scale-95 disabled:opacity-60"
              >
                {downloading ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-ink-400 border-t-transparent animate-spin" />Descargando...</>
                ) : (
                  <><FileVideo size={16} /> Descargar video</>
                )}
              </button>

              {/* Copy link — always visible as a third option */}
              <button
                onClick={fallbackCopy}
                title="Copiar link"
                className="w-11 h-11 rounded-xl bg-white border border-ink-200 hover:bg-ink-50 text-ink-500 flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
              >
                {shareState === 'copied' ? <Check size={16} className="text-emerald-600" /> : <Link2 size={16} />}
              </button>
            </div>
          )}
        </div>

        {/* ── CONTACT + CV FILE ─────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Contact */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-ink-800 text-sm">Contacto</h3>
              <button
                onClick={() => setShowContact(!showContact)}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
              >
                {showContact ? <EyeOff size={13} /> : <Eye size={13} />}
                {showContact ? 'Ocultar' : 'Ver contacto'}
              </button>
            </div>

            {showContact ? (
              <div className="space-y-2.5 animate-fade-in">
                <a href={`tel:${usuario.telefono}`} className="flex items-center gap-2 text-sm text-ink-700 hover:text-brand-600 transition-colors">
                  <Phone size={14} className="text-brand-500 flex-shrink-0" />
                  {usuario.telefono}
                </a>
                <a href={`mailto:${usuario.email}`} className="flex items-center gap-2 text-sm text-ink-700 hover:text-brand-600 transition-colors min-w-0">
                  <Mail size={14} className="text-brand-500 flex-shrink-0" />
                  <span className="truncate">{usuario.email}</span>
                </a>
                <div className="flex items-start gap-2 text-sm text-ink-700">
                  <MapPin size={14} className="text-brand-500 flex-shrink-0 mt-0.5" />
                  <span>{usuario.direccion}</span>
                </div>
                {(usuario.linkedin_url || usuario.instagram_url || usuario.sitio_web) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {usuario.linkedin_url && (
                      <a href={usuario.linkedin_url.startsWith('http') ? usuario.linkedin_url : `https://${usuario.linkedin_url}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-full">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                      </a>
                    )}
                    {usuario.instagram_url && (
                      <a href={usuario.instagram_url.startsWith('http') ? usuario.instagram_url : `https://instagram.com/${usuario.instagram_url.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-pink-600 hover:underline bg-pink-50 px-2 py-1 rounded-full">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        Instagram
                      </a>
                    )}
                    {usuario.sitio_web && (
                      <a href={usuario.sitio_web.startsWith('http') ? usuario.sitio_web : `https://${usuario.sitio_web}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-ink-600 hover:underline bg-ink-50 px-2 py-1 rounded-full">
                        🌐 Sitio web
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-ink-400 leading-relaxed">
                Hacé clic en "Ver contacto" para ver teléfono, email y dirección.
              </p>
            )}
          </div>

          {/* CV generado por Oportunai */}
          <div className="card p-5">
            <h3 className="font-medium text-ink-800 text-sm mb-1">Currículum</h3>
            {(() => {
              const cv = usuario.cv_datos as any;
              const tieneCv = cv?.resumen || (cv?.experiencia?.length ?? 0) > 0 || (cv?.habilidades?.length ?? 0) > 0;
              return tieneCv ? (
                <div className="space-y-2">
                  <p className="text-xs text-ink-400 mb-2">Generado y optimizado por Oportunai</p>
                  <a
                    href={`/api/cv/public/${usuario.slug}`}
                    download
                    className="btn-primary w-full justify-center text-sm py-2.5"
                  >
                    <Download size={15} />
                    Descargar CV (.docx)
                  </a>
                </div>
              ) : (
                <p className="text-xs text-ink-400 leading-relaxed mt-2">
                  Este candidato aún no completó su CV.
                </p>
              );
            })()}
          </div>
        </div>

        {/* ── PERFIL / CV GENERADO ──────────────────────────────── */}
        {(() => {
          const edad = calcularEdad(usuario.fecha_nacimiento);
          const ciudad = extraerCiudad(usuario.direccion);
          const cv = usuario.cv_datos;
          const tieneContenido = edad || ciudad || cv?.resumen || (cv?.experiencia?.length ?? 0) > 0
            || (cv?.educacion?.length ?? 0) > 0 || (cv?.habilidades?.length ?? 0) > 0
            || (cv?.idiomas?.length ?? 0) > 0;
          return (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink-800 flex items-center gap-2">
                  <Briefcase size={15} className="text-brand-500" />
                  Perfil del candidato
                </h3>
                {tieneContenido && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={10} strokeWidth={3} /> CV cargado
                  </span>
                )}
              </div>

              {!tieneContenido ? (
                <p className="text-sm text-ink-300 italic">
                  Este candidato aún no completó su perfil profesional.
                </p>
              ) : (
                <>
                  {/* Datos básicos */}
                  {(edad || ciudad) && (
                    <div className="flex flex-wrap gap-3">
                      {edad && (
                        <span className="flex items-center gap-1.5 text-sm text-ink-600 bg-ink-50 rounded-lg px-3 py-1.5">
                          <Calendar size={13} className="text-ink-400" /> {edad} años
                        </span>
                      )}
                      {ciudad && (
                        <span className="flex items-center gap-1.5 text-sm text-ink-600 bg-ink-50 rounded-lg px-3 py-1.5">
                          <MapPin size={13} className="text-ink-400" /> {ciudad}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Resumen */}
                  {cv?.resumen && (
                    <p className="text-sm text-ink-600 leading-relaxed">{cv.resumen}</p>
                  )}

                  {/* Experiencia */}
                  {(cv?.experiencia?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Briefcase size={12} /> Experiencia
                      </p>
                      <div className="space-y-2">
                        {cv!.experiencia!.map((e, i) => (
                          <div key={i} className="bg-ink-50 rounded-xl px-3 py-2.5">
                            <p className="text-sm font-medium text-ink-800">{e.cargo}</p>
                            <p className="text-xs text-ink-500">{e.empresa}{e.periodo ? ` · ${e.periodo}` : ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Educación */}
                  {(cv?.educacion?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <GraduationCap size={12} /> Educación
                      </p>
                      <div className="space-y-2">
                        {cv!.educacion!.map((e, i) => (
                          <div key={i} className="bg-ink-50 rounded-xl px-3 py-2.5">
                            <p className="text-sm font-medium text-ink-800">{e.titulo}</p>
                            <p className="text-xs text-ink-500">{e.institucion}{e.periodo ? ` · ${e.periodo}` : ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Habilidades */}
                  {(cv?.habilidades?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Wrench size={12} /> Habilidades
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {cv!.habilidades!.map((h, i) => (
                          <span key={i} className="text-xs bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full">{h}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Idiomas */}
                  {(cv?.idiomas?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cv!.idiomas!.map((l, i) => (
                        <span key={i} className="text-xs bg-ink-100 text-ink-600 px-2.5 py-1 rounded-full">{l}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* ── DOCUMENTOS ────────────────────────────────────────── */}
        {(usuario.documentos?.length ?? 0) > 0 && (
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-brand-500" />
              <h3 className="font-semibold text-ink-800 text-sm">Documentos</h3>
              <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check size={10} strokeWidth={3} /> {usuario.documentos!.length} cargados
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {usuario.documentos!.map(doc => (
                <a
                  key={doc.tipo}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors"
                >
                  <FileText size={11} />
                  {DOCS_LABELS[doc.tipo] ?? doc.tipo}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── REFERENCIAS VERIFICADAS ───────────────────────────── */}
        {(usuario.referencias?.length ?? 0) > 0 && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-500" />
              <h3 className="font-semibold text-ink-800">Referencias verificadas</h3>
              <span className="ml-auto badge bg-amber-100 text-amber-700 flex items-center gap-1">
                <Star size={10} fill="currentColor" />
                {usuario.referencias!.length}
              </span>
            </div>
            <div className="space-y-3">
              {usuario.referencias!.map(r => (
                <div key={r.id} className="bg-ink-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 size={15} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-ink-800 text-sm">{r.empresa_nombre}</p>
                        <p className="text-xs text-ink-500">
                          {r.referidor_nombre}{r.referidor_cargo ? ` · ${r.referidor_cargo}` : ''}
                        </p>
                        {r.referidor_email && (
                          <a href={`mailto:${r.referidor_email}`} className="text-xs text-brand-500 hover:text-brand-700 transition-colors">
                            {r.referidor_email}
                          </a>
                        )}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      <Check size={10} strokeWidth={3} /> Verificado
                    </span>
                  </div>
                  {r.mensaje && (
                    <p className="text-sm text-ink-600 italic leading-relaxed pl-4 sm:pl-12">"{r.mensaje}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SWITCH CV / PITCH ─────────────────────────────────── */}
        <div className="card p-4 flex items-center justify-between">
          <p className="text-sm text-ink-500">
            {isCv ? '¿Querés ver su Video Pitch?' : '¿Querés ver su Video CV?'}
          </p>
          <Link
            href={`/u/${usuario.slug}/${isCv ? 'pitch' : 'cv'}`}
            className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            {isCv ? <Mic size={14} /> : <Video size={14} />}
            {isCv ? 'Ver Pitch' : 'Ver Video CV'}
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <p className="text-center text-ink-300 text-xs pb-4">
          Perfil creado en{' '}
          <Link href="/" className="text-brand-400 hover:text-brand-500 transition-colors">Oportunai</Link>
        </p>
      </main>
    </div>
  );
}

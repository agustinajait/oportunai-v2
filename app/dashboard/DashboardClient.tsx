'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import {
  Video, Mic, FileText, Edit3, Check, X, Upload,
  ExternalLink, Copy, CheckCheck, Clock, Circle,
  BookOpen, ChevronDown, ArrowRight, Zap, Briefcase, ShieldCheck
} from 'lucide-react';
import OfertasTab from '@/components/ui/OfertasTab';

interface VideoItem {
  id: string; tipo: string; video_url: string; created_at: string;
  taller: { id: string; nombre: string } | null;
  oferta_id: string | null;
}
interface Archivo { id: string; file_url: string; file_type: string; created_at: string }
interface TallerModulo { id: string; tipo_video: string; nombre_modulo: string; duracion_base: number; texto_guia: string; orden: number; }
interface Taller { id: string; nombre: string; descripcion: string | null; habilita_cv: boolean; habilita_pitch: boolean; modulos: TallerModulo[]; }
interface TallerUsuario { taller: Taller; estado: string; asignado_en: string; }
interface Usuario {
  id: string; nombre_completo: string; email: string; telefono: string;
  bio: string | null; slug: string; role: 'super_admin' | 'admin' | 'user';
  created_at: string; videos: VideoItem[]; archivos: Archivo[];
}

interface Documento {
  id: string;
  tipo: string;
  file_url: string;
  created_at: string;
}

const DOCS_CONFIG = [
  { tipo: 'dni', label: 'DNI', descripcion: 'Documento Nacional de Identidad' },
  { tipo: 'antecedentes_penales', label: 'Antecedentes Penales', descripcion: 'Certificado de antecedentes penales' },
  { tipo: 'manipulacion_alimentos', label: 'Manipulación de Alimentos', descripcion: 'Certificado del curso' },
  { tipo: 'libreta_sanitaria', label: 'Libreta Sanitaria', descripcion: 'Libreta sanitaria vigente' },
  { tipo: 'otro', label: 'Otro documento', descripcion: 'Cualquier otro documento relevante' },
];

export default function DashboardClient({
  usuario,
  tallersAsignados,
}: {
  usuario: Usuario;
  tallersAsignados: TallerUsuario[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'perfil' | 'ofertas' | 'documentos'>(
    searchParams.get('tab') === 'ofertas' ? 'ofertas' : 'perfil'
  );
  const initialOfertaId = searchParams.get('oferta_id') ?? undefined;
  const [bio, setBio] = useState(usuario.bio ?? '');
  const [editingBio, setEditingBio] = useState(false);
  const [bioSaving, setBioSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [docMsg, setDocMsg] = useState<string | null>(null);

  const [selectedTaller, setSelectedTaller] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<'video_cv' | 'video_pitch'>('video_cv');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const cvUrl = `${appUrl}/u/${usuario.slug}/cv`;
  const pitchUrl = `${appUrl}/u/${usuario.slug}/pitch`;

  const videoCV = usuario.videos.find(v => v.tipo === 'video_cv' && !v.taller && !v.oferta_id);
  const videoPitch = usuario.videos.find(v => v.tipo === 'video_pitch' && !v.taller && !v.oferta_id);
  const archivoCV = usuario.archivos[0] ?? null;

  useEffect(() => {
    if (tab === 'documentos') cargarDocumentos();
  }, [tab]);

  async function cargarDocumentos() {
    const res = await fetch('/api/documentos');
    const data = await res.json();
    if (data.documentos) setDocumentos(data.documentos);
  }

  async function subirDocumento(e: React.ChangeEvent<HTMLInputElement>, tipo: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(tipo);
    setDocMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('tipo', tipo);
    const res = await fetch('/api/documentos', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.ok) {
      setDocMsg('Documento subido correctamente ✓');
      cargarDocumentos();
    } else {
      setDocMsg(data.error ?? 'Error al subir');
    }
    setUploadingDoc(null);
    setTimeout(() => setDocMsg(null), 3000);
  }

  const saveBio = async () => {
    setBioSaving(true);
    await fetch('/api/users/bio', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio }),
    });
    setBioSaving(false);
    setEditingBio(false);
  };

  const copyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/files/upload', { method: 'POST', body: fd });
    setUploading(false);
    if (res.ok) {
      setUploadMsg('CV subido correctamente ✓');
      setTimeout(() => router.refresh(), 1200);
    } else {
      const j = await res.json();
      setUploadMsg(j.error ?? 'Error al subir');
    }
  };

  const tallerSeleccionado = tallersAsignados.find(t => t.taller.id === selectedTaller)?.taller;
  const tiposDisponibles = tallerSeleccionado
    ? [
        ...(tallerSeleccionado.habilita_cv ? [{ value: 'video_cv', label: 'Video CV' }] : []),
        ...(tallerSeleccionado.habilita_pitch ? [{ value: 'video_pitch', label: 'Video Pitch' }] : []),
      ]
    : [];

  const handleIrATaller = () => {
    if (!selectedTaller) return;
    router.push(`/dashboard/grabar-taller?taller_id=${selectedTaller}&tipo=${selectedTipo}`);
  };

  const tieneDocumento = (tipo: string) => documentos.some(d => d.tipo === tipo);
  const getDocumento = (tipo: string) => documentos.find(d => d.tipo === tipo);

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar session={{ nombre: usuario.nombre_completo, role: usuario.role, slug: usuario.slug }} />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-light text-ink-900">
              Hola, <span className="font-semibold italic">{usuario.nombre_completo.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-ink-400 mt-1 text-sm">Administrá tu perfil y tus contenidos</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setTab('perfil')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'perfil' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <Video size={14} />
              Mi perfil
            </button>
            <button
              onClick={() => setTab('documentos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'documentos' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <ShieldCheck size={14} />
              Mis documentos
            </button>
            <button
              onClick={() => setTab('ofertas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'ofertas' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <Briefcase size={14} />
              Ofertas
            </button>
          </div>
        </div>

        {/* Tab Ofertas */}
        {tab === 'ofertas' && (
          <OfertasTab videos={usuario.videos} initialOfertaId={initialOfertaId} />
        )}

        {/* Tab Documentos */}
        {tab === 'documentos' && (
          <div className="max-w-2xl space-y-4">
            <p className="text-ink-500 text-sm mb-6">
              Subí tus documentos para que las empresas puedan verificar tu perfil al revisar tu postulación.
            </p>
            {docMsg && (
              <div className={`rounded-lg px-4 py-3 text-sm font-medium mb-4 ${
                docMsg.includes('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {docMsg}
              </div>
            )}
            {DOCS_CONFIG.map(doc => {
              const tiene = tieneDocumento(doc.tipo);
              const documento = getDocumento(doc.tipo);
              const cargando = uploadingDoc === doc.tipo;
              return (
                <div key={doc.tipo} className="card p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      tiene ? 'bg-emerald-100' : 'bg-ink-100'
                    }`}>
                      {tiene
                        ? <Check size={18} className="text-emerald-600" />
                        : <FileText size={18} className="text-ink-400" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-ink-800 text-sm">{doc.label}</p>
                        {tiene && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            ✓ Cargado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-400">{doc.descripcion}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {tiene && documento && (
                      <a
                        href={documento.file_url}
                        target="_blank"
                        className="text-brand-600 hover:text-brand-700"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <label className={`border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-gray-50 transition-colors ${cargando ? 'opacity-50 pointer-events-none' : ''}`}>
                      {cargando ? 'Subiendo...' : tiene ? 'Reemplazar' : 'Subir'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={e => subirDocumento(e, doc.tipo)}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Perfil */}
        {tab === 'perfil' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* ── Columna izquierda ──────────────────────────────── */}
            <div className="space-y-5">
              {/* Bio */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-ink-800">Tu bio</h2>
                  {!editingBio ? (
                    <button onClick={() => setEditingBio(true)} className="btn-ghost py-1 px-2 text-xs gap-1">
                      <Edit3 size={13} /> Editar
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={saveBio} disabled={bioSaving} className="btn-ghost py-1 px-2 text-xs gap-1 text-brand-600">
                        <Check size={13} /> {bioSaving ? '...' : 'Guardar'}
                      </button>
                      <button onClick={() => { setBio(usuario.bio ?? ''); setEditingBio(false); }} className="btn-ghost py-1 px-2 text-xs gap-1 text-red-500">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
                {editingBio ? (
                  <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} rows={4}
                    className="input-field resize-none text-sm" placeholder="Contá algo sobre vos..." />
                ) : (
                  <p className="text-ink-500 text-sm leading-relaxed">
                    {bio || <span className="text-ink-300 italic">Sin bio todavía. ¡Agregá una!</span>}
                  </p>
                )}
                {editingBio && <p className="text-xs text-ink-300 mt-1 text-right">{bio.length}/500</p>}
              </div>

              {/* CV File */}
              <div className="card p-6">
                <h2 className="font-semibold text-ink-800 mb-4">Archivo CV</h2>
                {archivoCV ? (
                  <div className="flex items-center gap-3 bg-ink-50 rounded-xl p-3">
                    <div className="w-9 h-9 bg-brand-100 rounded-lg flex items-center justify-center">
                      <FileText size={16} className="text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-700 truncate">CV subido</p>
                      <p className="text-xs text-ink-400">{new Date(archivoCV.created_at).toLocaleDateString('es-AR')}</p>
                    </div>
                    <a href={archivoCV.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
                      <ExternalLink size={15} />
                    </a>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-ink-200 rounded-xl p-6 text-center">
                    <Upload size={20} className="text-ink-300 mx-auto mb-2" />
                    <p className="text-sm text-ink-400 mb-3">PDF o Word · máx 5 MB</p>
                    <label className={`btn-secondary text-xs py-2 px-4 cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                      <Upload size={13} />
                      {uploading ? 'Subiendo...' : 'Subir CV'}
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}
                {uploadMsg && <p className="text-xs mt-2 text-center text-ink-500">{uploadMsg}</p>}
              </div>

              {/* Talleres */}
              {tallersAsignados.length > 0 && (
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={16} className="text-purple-600" />
                    <h2 className="font-semibold text-ink-800">Mis talleres</h2>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-ink-400 mb-1 block">Seleccioná un taller</label>
                      <div className="relative">
                        <select
                          value={selectedTaller}
                          onChange={e => setSelectedTaller(e.target.value)}
                          className="input-field text-sm appearance-none pr-8"
                        >
                          <option value="">— elegí un taller —</option>
                          {tallersAsignados.map(ta => (
                            <option key={ta.taller.id} value={ta.taller.id}>{ta.taller.nombre}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                      </div>
                    </div>

                    {tiposDisponibles.length > 0 && (
                      <div>
                        <label className="text-xs text-ink-400 mb-1 block">Tipo de video</label>
                        <div className="flex gap-2">
                          {tiposDisponibles.map(t => (
                            <button
                              key={t.value}
                              onClick={() => setSelectedTipo(t.value as 'video_cv' | 'video_pitch')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                selectedTipo === t.value
                                  ? t.value === 'video_cv'
                                    ? 'bg-brand-600 text-white border-brand-600'
                                    : 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                              }`}
                            >
                              {t.value === 'video_cv' ? <Video size={14} /> : <Mic size={14} />}
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTaller && (
                      <button
                        onClick={handleIrATaller}
                        className="btn-primary w-full justify-center gap-2 py-3"
                      >
                        <Zap size={15} />
                        Grabar para este taller
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-ink-100 space-y-2">
                    {tallersAsignados.map(ta => (
                      <div key={ta.taller.id} className="flex items-center justify-between text-xs">
                        <span className="text-ink-600">{ta.taller.nombre}</span>
                        <span className={`badge ${
                          ta.estado === 'validado' ? 'bg-emerald-100 text-emerald-700' :
                          ta.estado === 'completado' ? 'bg-blue-100 text-blue-700' :
                          'bg-ink-100 text-ink-500'
                        }`}>{ta.estado}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Columna derecha (2 cols) ───────────────────────── */}
            <div className="lg:col-span-2 space-y-5">
              <VideoCard
                tipo="video_cv" titulo="Video CV"
                descripcion="Presentá tu perfil laboral en 4 módulos guiados"
                icon={Video} color="brand"
                recordHref="/dashboard/grabar-cv"
                video={videoCV}
                shareUrl={cvUrl}
                copied={copied}
                onCopy={() => copyUrl(cvUrl, 'cv')}
                copiedKey="cv"
              />
              <VideoCard
                tipo="video_pitch" titulo="Video Pitch"
                descripcion="Presentá tu emprendimiento en 4 módulos guiados"
                icon={Mic} color="emerald"
                recordHref="/dashboard/grabar-pitch"
                video={videoPitch}
                shareUrl={pitchUrl}
                copied={copied}
                onCopy={() => copyUrl(pitchUrl, 'pitch')}
                copiedKey="pitch"
              />

              {usuario.videos.filter(v => v.taller).length > 0 && (
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={16} className="text-purple-600" />
                    <h2 className="font-semibold text-ink-800">Videos de Talleres</h2>
                  </div>
                  <div className="space-y-3">
                    {usuario.videos.filter(v => v.taller).map(v => (
                      <div key={v.id} className="flex items-center gap-3 bg-ink-50 rounded-xl p-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${v.tipo === 'video_cv' ? 'bg-brand-100' : 'bg-emerald-100'}`}>
                          {v.tipo === 'video_cv'
                            ? <Video size={16} className="text-brand-600" />
                            : <Mic size={16} className="text-emerald-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-700">{v.tipo === 'video_cv' ? 'Video CV' : 'Video Pitch'}</p>
                          <p className="text-xs text-ink-400 truncate">{v.taller?.nombre} · {new Date(v.created_at).toLocaleDateString('es-AR')}</p>
                        </div>
                        <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 flex-shrink-0">
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function VideoCard({
  tipo, titulo, descripcion, icon: Icon, color, recordHref, video, shareUrl, copied, onCopy, copiedKey
}: {
  tipo: string; titulo: string; descripcion: string; icon: any; color: string;
  recordHref: string; video?: VideoItem; shareUrl: string;
  copied: string | null; onCopy: () => void; copiedKey: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  const btnMap: Record<string, string> = {
    brand: 'btn-primary',
    emerald: 'inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl active:scale-95 transition-all text-sm',
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-ink-800">{titulo}</h2>
              {video
                ? <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1"><Check size={10} />Grabado</span>
                : <span className="badge bg-ink-100 text-ink-400 flex items-center gap-1"><Clock size={10} />Pendiente</span>}
            </div>
            <p className="text-xs text-ink-400 mt-0.5">{descripcion}</p>
          </div>
        </div>
        <Link href={shareUrl} target="_blank" className="btn-ghost text-xs gap-1 py-1.5">
          <ExternalLink size={13} /> Ver perfil
        </Link>
      </div>

      {video ? (
        <div className="space-y-3">
          <div className="bg-ink-900 rounded-xl aspect-video">
            <video src={video.video_url} controls className="w-full h-full rounded-xl object-cover" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-ink-50 rounded-lg px-3 py-2 text-xs text-ink-500 font-mono truncate">{shareUrl}</div>
            <button onClick={onCopy} className="btn-ghost text-xs gap-1 py-2 shrink-0">
              {copied === copiedKey ? <CheckCheck size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied === copiedKey ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <Link href={recordHref} className={`${btnMap[color]} text-sm py-2 px-4`}>
            <Circle size={13} /> Volver a grabar
          </Link>
        </div>
      ) : (
        <div className="border-2 border-dashed border-ink-200 rounded-xl p-8 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${colorMap[color]}`}>
            <Icon size={22} />
          </div>
          <p className="text-sm font-medium text-ink-600 mb-1">Todavía no grabaste tu {titulo}</p>
          <p className="text-xs text-ink-400 mb-5">El flujo es guiado — solo seguí las instrucciones en pantalla</p>
          <Link href={recordHref} className={btnMap[color]}>
            <Circle size={15} /> Grabar {titulo}
          </Link>
        </div>
      )}
    </div>
  );
}

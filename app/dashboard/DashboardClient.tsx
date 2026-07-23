'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/layout/Navbar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import {
  Video, Mic, FileText, Edit3, Check, X, Upload,
  ExternalLink, Copy, CheckCheck, Clock, Circle,
  BookOpen, ChevronDown, ArrowRight, Zap, Briefcase, ShieldCheck,
  CalendarDays, MapPin, Loader2, Plus, GraduationCap, Briefcase as BriefcaseIcon, Wrench,
  Star, Building2, Link2, Trash2, PlayCircle
} from 'lucide-react';
import OfertasTab from '@/components/ui/OfertasTab';
import CapacitacionPlayer from '@/components/ui/CapacitacionPlayer';
import VideoThumbnail from '@/components/ui/VideoThumbnail';

interface VideoItem {
  id: string; tipo: string; video_url: string; created_at: string;
  taller: { id: string; nombre: string } | null;
  oferta_id: string | null;
}
interface Archivo { id: string; file_url: string; file_type: string; created_at: string }
interface TallerModulo { id: string; tipo_video: string; nombre_modulo: string; duracion_base: number; texto_guia: string; orden: number; }
interface Taller { id: string; nombre: string; descripcion: string | null; habilita_cv: boolean; habilita_pitch: boolean; modulos: TallerModulo[]; }
interface TallerUsuario { taller: Taller; estado: string; asignado_en: string; }
interface Referencia {
  id: string;
  empresa_nombre: string;
  referidor_nombre: string;
  token: string;
  estado: string;
  created_at: string;
}

interface CapacitacionItem {
  id: string;
  titulo: string;
  descripcion: string | null;
  video_url: string;
  pregunta: string;
  opciones: string[];
  completada: boolean;
  empresa: { nombre: string };
  _count: { completadas: number };
}

interface CvDatos {
  resumen?: string;
  experiencia?: { empresa: string; cargo: string; periodo: string; descripcion: string }[];
  educacion?: { institucion: string; titulo: string; periodo: string }[];
  habilidades?: string[];
  idiomas?: string[];
}

interface Usuario {
  id: string; nombre_completo: string; email: string; telefono: string;
  bio: string | null; foto_url: string | null; slug: string; role: 'super_admin' | 'admin' | 'user';
  cv_datos: CvDatos | null;
  alfa_digital: string | null; alfa_score: number | null;
  fecha_nacimiento: string | null;
  created_at: string; videos: VideoItem[]; archivos: Archivo[];
}

interface Documento {
  id: string;
  tipo: string;
  file_url: string;
  created_at: string;
}

interface CitaInvitado {
  id: string;
  estado: 'pendiente' | 'confirmada' | 'rechazada';
  cita: {
    fecha: string;
    modalidad: 'presencial' | 'virtual';
    lugar: string;
    mensaje: string | null;
    grupal: boolean;
    empresa: { nombre: string; logo_url: string | null };
    oferta: { titulo: string } | null;
  };
}

const DOCS_CONFIG = [
  { tipo: 'dni', label: 'DNI', descripcion: 'Documento Nacional de Identidad' },
  { tipo: 'antecedentes_penales', label: 'Antecedentes Penales', descripcion: 'Certificado de antecedentes penales' },
  { tipo: 'manipulacion_alimentos', label: 'Manipulación de Alimentos', descripcion: 'Certificado del curso' },
  { tipo: 'libreta_sanitaria', label: 'Libreta Sanitaria', descripcion: 'Libreta sanitaria vigente' },
  { tipo: 'registro_conducir', label: 'Registro de Conducir', descripcion: 'Licencia de conducir vigente' },
  { tipo: 'otro', label: 'Otro documento', descripcion: 'Cualquier otro documento relevante' },
];

export default function DashboardClient({
  usuario,
  tallersAsignados,
  citas,
}: {
  usuario: Usuario;
  tallersAsignados: TallerUsuario[];
  citas: CitaInvitado[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'perfil' | 'ofertas' | 'documentos' | 'citas'>(() => {
    const t = searchParams.get('tab');
    if (t === 'ofertas') return 'ofertas';
    if (t === 'documentos') return 'documentos';
    if (t === 'citas') return 'citas';
    return 'perfil';
  });
  const [citasState, setCitasState] = useState<CitaInvitado[]>(citas);
  const [respondiendo, setRespondiendo] = useState<string | null>(null);
  const citasPendientes = citasState.filter(c => c.estado === 'pendiente').length;

  async function responderCita(id: string, estado: 'confirmada' | 'rechazada') {
    setRespondiendo(id);
    try {
      const res = await fetch(`/api/citas/${id}/responder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      if (res.ok) {
        setCitasState(prev => prev.map(c => c.id === id ? { ...c, estado } : c));
      }
    } finally {
      setRespondiendo(null);
    }
  }
  const initialOfertaId = searchParams.get('oferta_id') ?? undefined;
  const [bio, setBio] = useState(usuario.bio ?? '');
  const [editingBio, setEditingBio] = useState(false);
  const [bioSaving, setBioSaving] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(usuario.foto_url ?? null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [analyzingCV, setAnalyzingCV] = useState(false);
  const [cvDatos, setCvDatos] = useState<CvDatos | null>(usuario.cv_datos);

  // Formulario de datos del perfil
  const [editandoDatos, setEditandoDatos] = useState(false);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [datosMsgOk, setDatosMsgOk] = useState(false);
  const [fechaNac, setFechaNac] = useState(
    usuario.fecha_nacimiento ? new Date(usuario.fecha_nacimiento).toISOString().slice(0, 10) : ''
  );
  const [resumenPerfil, setResumenPerfil] = useState(usuario.cv_datos?.resumen ?? '');
  const [experiencias, setExperiencias] = useState<{ empresa: string; cargo: string; periodo: string; descripcion: string }[]>(
    usuario.cv_datos?.experiencia ?? []
  );
  const [educaciones, setEducaciones] = useState<{ institucion: string; titulo: string; periodo: string }[]>(
    usuario.cv_datos?.educacion ?? []
  );
  const [habilidades, setHabilidades] = useState<string[]>(usuario.cv_datos?.habilidades ?? []);
  const [habilidadInput, setHabilidadInput] = useState('');

  async function guardarDatos() {
    setGuardandoDatos(true);
    const nuevoCvDatos: CvDatos = {
      ...(usuario.cv_datos ?? {}),
      resumen: resumenPerfil || undefined,
      experiencia: experiencias.length ? experiencias : undefined,
      educacion: educaciones.length ? educaciones : undefined,
      habilidades: habilidades.length ? habilidades : undefined,
    };
    await fetch('/api/users/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha_nacimiento: fechaNac || null, cv_datos: nuevoCvDatos }),
    });
    setCvDatos(nuevoCvDatos);
    setGuardandoDatos(false);
    setEditandoDatos(false);
    setDatosMsgOk(true);
    setTimeout(() => setDatosMsgOk(false), 3000);
  }
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [docMsg, setDocMsg] = useState<string | null>(null);

  const [selectedTaller, setSelectedTaller] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<'video_cv' | 'video_pitch'>('video_cv');
  const [alfaBadge, setAlfaBadge] = useState(usuario.alfa_digital);

  // Referencias
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [refEmpresa, setRefEmpresa] = useState('');
  const [refNombre, setRefNombre] = useState('');
  const [addingRef, setAddingRef] = useState(false);
  const [refMsg, setRefMsg] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Capacitaciones
  const [capacitaciones, setCapacitaciones] = useState<CapacitacionItem[]>([]);
  const [playerCap, setPlayerCap] = useState<CapacitacionItem | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const cvUrl = `${appUrl}/u/${usuario.slug}/cv`;
  const pitchUrl = `${appUrl}/u/${usuario.slug}/pitch`;

  const videoCV = usuario.videos.find(v => v.tipo === 'video_cv' && !v.taller && !v.oferta_id);
  const videoPitch = usuario.videos.find(v => v.tipo === 'video_pitch' && !v.taller && !v.oferta_id);
  const archivoCV = usuario.archivos[0] ?? null;

  useEffect(() => {
    if (tab === 'documentos') cargarDocumentos();
    if (tab === 'perfil' && referencias.length === 0) cargarReferencias();
    if (tab === 'perfil' && capacitaciones.length === 0) cargarCapacitaciones();
  }, [tab]);

  async function cargarReferencias() {
    setLoadingRefs(true);
    const res = await fetch('/api/referencias');
    const data = await res.json();
    if (data.referencias) setReferencias(data.referencias);
    setLoadingRefs(false);
  }

  async function cargarCapacitaciones() {
    const res = await fetch('/api/capacitaciones');
    const data = await res.json();
    if (data.capacitaciones) setCapacitaciones(data.capacitaciones);
  }

  async function agregarReferencia() {
    if (!refEmpresa.trim() || !refNombre.trim()) return;
    setAddingRef(true);
    setRefMsg(null);
    const res = await fetch('/api/referencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_nombre: refEmpresa, referidor_nombre: refNombre }),
    });
    const data = await res.json();
    if (data.ok) {
      setReferencias(p => [data.referencia, ...p]);
      setRefEmpresa('');
      setRefNombre('');
      setRefMsg('Referencia agregada. ¡Compartí el link con tu referente!');
    } else {
      setRefMsg(data.error ?? 'Error al agregar');
    }
    setAddingRef(false);
    setTimeout(() => setRefMsg(null), 5000);
  }

  async function eliminarReferencia(id: string) {
    await fetch(`/api/referencias/${id}`, { method: 'DELETE' });
    setReferencias(p => p.filter(r => r.id !== id));
  }

  function copyRefLink(token: string) {
    const url = `${appUrl}/validar/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedRef(token);
    setTimeout(() => setCopiedRef(null), 2500);
  }

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

    const ext = file.name.split('.').pop() ?? 'pdf';
    const filename = `${usuario.id}/doc-${tipo}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filename, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      setDocMsg('Error al subir: ' + uploadError.message);
      setUploadingDoc(null);
      setTimeout(() => setDocMsg(null), 4000);
      return;
    }

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filename);
    const res = await fetch('/api/documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_url: urlData.publicUrl, tipo }),
    });
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

  const uploadFoto = async (file: File) => {
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/perfil/foto', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al subir foto');
      if (data.foto_url) setFotoUrl(data.foto_url + '?v=' + Date.now());
    } catch (err: any) {
      alert('No se pudo subir la foto: ' + (err.message ?? 'error desconocido'));
    } finally {
      setUploadingFoto(false);
    }
  };

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

  const analyzeCV = async () => {
    setAnalyzingCV(true);
    setUploadMsg(null);
    try {
      const res = await fetch('/api/user/cv', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setCvDatos(data.cv_datos);
        setUploadMsg('CV analizado correctamente ✓');
      } else {
        setUploadMsg(data.error ?? 'Error al analizar');
      }
    } catch {
      setUploadMsg('Error al analizar el CV');
    }
    setAnalyzingCV(false);
    setTimeout(() => setUploadMsg(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadMsg('Solo se permiten archivos PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadMsg('El archivo supera los 10 MB');
      return;
    }
    setUploading(true);
    setUploadMsg(null);

    const ext = 'pdf';
    const filename = `${usuario.id}/cv-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filename, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      setUploadMsg('Error al subir: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filename);
    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_url: urlData.publicUrl, file_type: ext }),
    });
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
            <button
              onClick={() => setTab('citas')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'citas' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <CalendarDays size={14} />
              Citas
              {citasPendientes > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {citasPendientes}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Citas */}
        {tab === 'citas' && (
          <div className="max-w-2xl space-y-4">
            {citasState.length === 0 && (
              <div className="card p-8 text-center text-ink-400">
                <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
                <p>Todavía no tenés citas o entrevistas agendadas</p>
              </div>
            )}
            {citasState.map(c => (
              <div key={c.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-ink-800">{c.cita.empresa.nombre}</p>
                    {c.cita.oferta && <p className="text-xs text-ink-400">{c.cita.oferta.titulo}</p>}
                  </div>
                  <span className={`badge ${
                    c.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' :
                    c.estado === 'rechazada' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {c.estado === 'confirmada' ? 'Confirmada' : c.estado === 'rechazada' ? 'Rechazada' : 'Pendiente'}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm text-ink-600 mb-4">
                  <p className="flex items-center gap-2">
                    <Clock size={14} className="text-ink-400" />
                    {new Date(c.cita.fecha).toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-ink-400" />
                    {c.cita.modalidad === 'presencial' ? c.cita.lugar : (
                      <a href={c.cita.lugar} target="_blank" className="text-brand-600 underline">{c.cita.lugar}</a>
                    )}
                    <span className="text-ink-400 text-xs">({c.cita.modalidad === 'presencial' ? 'presencial' : 'virtual'}{c.cita.grupal ? ' · grupal' : ''})</span>
                  </p>
                  {c.cita.mensaje && <p className="text-ink-500 italic">"{c.cita.mensaje}"</p>}
                </div>
                {c.estado === 'pendiente' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => responderCita(c.id, 'confirmada')}
                      disabled={respondiendo === c.id}
                      className="btn-primary py-1.5 px-4 text-sm"
                    >
                      {respondiendo === c.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Confirmar
                    </button>
                    <button
                      onClick={() => responderCita(c.id, 'rechazada')}
                      disabled={respondiendo === c.id}
                      className="btn-ghost py-1.5 px-4 text-sm"
                    >
                      <X size={14} /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

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
              {/* Flyer card */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-content-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <FileText size={20} color="#fff" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-800 text-sm">Mi flyer</p>
                    <p className="text-xs text-ink-400">Tarjeta con QR para imprimir o compartir</p>
                  </div>
                </div>
                {/* Foto de perfil */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-ink-100 flex items-center justify-center border-2 border-ink-200">
                    {fotoUrl
                      ? <img src={fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                      : <span className="text-ink-400 text-xs font-bold">{usuario.nombre_completo.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-ink-500 mb-1.5">{fotoUrl ? 'Foto cargada ✓' : 'Sin foto de perfil todavía'}</p>
                    <label className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${uploadingFoto ? 'bg-ink-100 text-ink-400 pointer-events-none' : 'bg-brand-50 text-brand-600 hover:bg-brand-100'}`}>
                      {uploadingFoto ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {uploadingFoto ? 'Subiendo...' : fotoUrl ? 'Cambiar foto' : 'Subir foto'}
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingFoto}
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadFoto(f); e.target.value = ''; }} />
                    </label>
                  </div>
                </div>
                <Link href="/dashboard/flyer" className="btn-primary w-full justify-center text-sm py-2.5" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
                  <FileText size={15} /> Ver mi flyer
                </Link>
              </div>

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

              {/* Perfil digital */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} className="text-purple-600" />
                  <h2 className="font-semibold text-ink-800">Perfil digital</h2>
                </div>
                {alfaBadge ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3">
                      <div className="w-10 h-10 bg-[#533AB7] rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {alfaBadge === 'Perfil nativo digital' ? '🚀' : alfaBadge === 'Usuario digital activo' ? '⚡' : '🌱'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-800">{alfaBadge}</p>
                        {usuario.alfa_score !== null && (
                          <p className="text-xs text-purple-500">{usuario.alfa_score} / 15 puntos</p>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/dashboard/alfabetizacion"
                      className="block text-center text-xs text-purple-600 hover:text-purple-800 hover:underline transition-colors"
                    >
                      Volver a hacer el test
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-ink-500 leading-relaxed">
                      Completá el test de alfabetización digital y sumá un badge a tu perfil.
                    </p>
                    <p className="text-xs text-ink-300">Solo tarda 2 minutos · 5 preguntas</p>
                    <Link
                      href="/dashboard/alfabetizacion"
                      className="inline-flex items-center gap-2 bg-[#533AB7] hover:bg-purple-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                    >
                      <Zap size={14} />
                      Empezar →
                    </Link>
                  </div>
                )}
              </div>

              {/* Referencias */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={16} className="text-amber-500" />
                  <h2 className="font-semibold text-ink-800">Referencias laborales</h2>
                  {referencias.filter(r => r.estado === 'validada').length > 0 && (
                    <span className="ml-auto badge bg-amber-100 text-amber-700 flex items-center gap-1">
                      <Star size={10} fill="currentColor" />
                      {referencias.filter(r => r.estado === 'validada').length} verificadas
                    </span>
                  )}
                </div>

                <p className="text-xs text-ink-400 mb-4 leading-relaxed">
                  Agregá un ex-jefe o empleador como referente. Te damos un link para que lo comparta por WhatsApp. Cuando valida, aparece ⭐ en tu perfil.
                </p>

                {/* Formulario agregar */}
                <div className="space-y-2 mb-4">
                  <input
                    value={refEmpresa}
                    onChange={e => setRefEmpresa(e.target.value)}
                    placeholder="Nombre de la empresa"
                    className="input-field text-sm"
                  />
                  <input
                    value={refNombre}
                    onChange={e => setRefNombre(e.target.value)}
                    placeholder="Nombre del referente (jefe, supervisor...)"
                    className="input-field text-sm"
                    onKeyDown={e => { if (e.key === 'Enter') agregarReferencia(); }}
                  />
                  <button
                    onClick={agregarReferencia}
                    disabled={addingRef || !refEmpresa.trim() || !refNombre.trim()}
                    className="btn-primary w-full justify-center text-sm py-2 disabled:opacity-50"
                  >
                    {addingRef
                      ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      : <Plus size={14} />
                    }
                    Agregar referente
                  </button>
                </div>

                {refMsg && (
                  <p className={`text-xs rounded-lg px-3 py-2 mb-3 ${refMsg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    {refMsg}
                  </p>
                )}

                {/* Lista */}
                {loadingRefs ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-ink-300" />
                  </div>
                ) : referencias.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-ink-100">
                    {referencias.map(r => (
                      <div key={r.id} className="bg-ink-50 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <Building2 size={14} className="text-ink-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink-800 truncate">{r.empresa_nombre}</p>
                              <p className="text-xs text-ink-400 truncate">{r.referidor_nombre}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {r.estado === 'validada' ? (
                              <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                <Check size={10} strokeWidth={3} /> Verificado
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => copyRefLink(r.token)}
                                  className="flex items-center gap-1 text-xs text-brand-600 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-lg transition-colors"
                                  title="Copiar link de validación"
                                >
                                  {copiedRef === r.token
                                    ? <><CheckCheck size={12} className="text-emerald-600" /> Copiado</>
                                    : <><Link2 size={12} /> Link</>
                                  }
                                </button>
                                <button
                                  onClick={() => eliminarReferencia(r.id)}
                                  className="text-red-400 hover:text-red-600 p-1"
                                  title="Eliminar"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {r.estado !== 'validada' && (
                          <p className="text-xs text-ink-400 mt-1.5 pl-5">
                            Pendiente de validación — compartí el link con {r.referidor_nombre.split(' ')[0]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-300 italic text-center py-2">
                    Aún no tenés referencias. ¡Agregá la primera!
                  </p>
                )}
              </div>

              {/* Capacitaciones */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap size={16} className="text-blue-600" />
                  <h2 className="font-semibold text-ink-800">Capacitaciones</h2>
                  {capacitaciones.filter(c => c.completada).length > 0 && (
                    <span className="ml-auto badge bg-amber-100 text-amber-700 flex items-center gap-1">
                      <Star size={10} fill="currentColor" />
                      {capacitaciones.filter(c => c.completada).length} completadas
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-400 mb-4 leading-relaxed">
                  Mirá videos de empresas y respondé una pregunta para ganar una ⭐ en tu perfil.
                </p>
                {capacitaciones.length === 0 ? (
                  <p className="text-xs text-ink-300 italic text-center py-2">No hay capacitaciones disponibles todavía.</p>
                ) : (
                  <div className="space-y-2">
                    {capacitaciones.map(cap => {
                      const ytId = cap.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]{11})/)?.[1] ?? null;
                      return (
                        <div key={cap.id} className={`rounded-xl border p-3 ${cap.completada ? 'border-emerald-200 bg-emerald-50' : 'border-ink-200 bg-white'}`}>
                          <div className="flex items-start gap-3">
                            {ytId && (
                              <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={cap.titulo} className="w-20 h-12 object-cover rounded-lg flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-ink-400">{cap.empresa.nombre}</p>
                              <p className="text-sm font-semibold text-ink-800 line-clamp-1">{cap.titulo}</p>
                              {cap.descripcion && <p className="text-xs text-ink-400 line-clamp-1 mt-0.5">{cap.descripcion}</p>}
                            </div>
                          </div>
                          <div className="mt-2">
                            {cap.completada ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                                <Star size={11} fill="currentColor" className="text-amber-500" /> Completada — ⭐ sumada a tu perfil
                              </span>
                            ) : (
                              <button
                                onClick={() => setPlayerCap(cap)}
                                className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <PlayCircle size={13} /> Hacer capacitación
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CV File */}
              <div className="card p-6">
                <h2 className="font-semibold text-ink-800 mb-4">Archivo CV</h2>
                {archivoCV ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-ink-50 rounded-xl p-3">
                      <div className="w-9 h-9 bg-brand-100 rounded-lg flex items-center justify-center">
                        <FileText size={16} className="text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-700 truncate">CV subido</p>
                        <p className="text-xs text-ink-400">{new Date(archivoCV.created_at).toLocaleDateString('es-AR')}</p>
                      </div>
                      <a href={archivoCV.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 mr-1">
                        <ExternalLink size={15} />
                      </a>
                    </div>
                    {cvDatos ? (
                      <div className="bg-emerald-50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-emerald-700">CV analizado ✓</p>
                          <button onClick={analyzeCV} disabled={analyzingCV} className="text-xs text-emerald-600 hover:underline disabled:opacity-50">
                            {analyzingCV ? 'Analizando...' : 'Re-analizar'}
                          </button>
                        </div>
                        {cvDatos.resumen && <p className="text-xs text-emerald-800 leading-relaxed">{cvDatos.resumen}</p>}
                        {(cvDatos.habilidades?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {cvDatos.habilidades!.slice(0, 6).map((h, i) => (
                              <span key={i} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{h}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={analyzeCV}
                        disabled={analyzingCV}
                        className="w-full btn-secondary text-xs py-2 justify-center gap-2 disabled:opacity-50"
                      >
                        <Zap size={13} />
                        {analyzingCV ? 'Analizando con IA...' : 'Analizar CV con IA'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-ink-200 rounded-xl p-6 text-center">
                    <Upload size={20} className="text-ink-300 mx-auto mb-2" />
                    <p className="text-sm text-ink-400 mb-3">PDF · máx 5 MB</p>
                    <label className={`btn-secondary text-xs py-2 px-4 cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                      <Upload size={13} />
                      {uploading ? 'Subiendo...' : 'Subir CV en PDF'}
                      <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}
                {uploadMsg && <p className={`text-xs mt-2 text-center ${uploadMsg.includes('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{uploadMsg}</p>}
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

              {/* ── Mis datos ──────────────────────────────────────── */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-ink-800">Mis datos</h2>
                  {datosMsgOk && <span className="text-xs text-emerald-600 font-medium">Guardado ✓</span>}
                  {!editandoDatos ? (
                    <button onClick={() => setEditandoDatos(true)} className="btn-ghost py-1 px-2 text-xs gap-1">
                      <Edit3 size={13} /> Editar
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={guardarDatos} disabled={guardandoDatos} className="btn-ghost py-1 px-2 text-xs gap-1 text-brand-600">
                        <Check size={13} /> {guardandoDatos ? '...' : 'Guardar'}
                      </button>
                      <button onClick={() => setEditandoDatos(false)} className="btn-ghost py-1 px-2 text-xs gap-1 text-red-500">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {!editandoDatos ? (
                  <div className="space-y-4 text-sm text-ink-600">
                    {fechaNac && <p><span className="text-ink-400">Fecha de nacimiento:</span> {new Date(fechaNac + 'T00:00:00').toLocaleDateString('es-AR')}</p>}
                    {resumenPerfil && <p className="leading-relaxed">{resumenPerfil}</p>}
                    {experiencias.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-2 flex items-center gap-1"><BriefcaseIcon size={12} /> Experiencia</p>
                        <div className="space-y-1.5">
                          {experiencias.map((e, i) => (
                            <div key={i} className="bg-ink-50 rounded-lg px-3 py-2">
                              <p className="font-medium text-ink-700">{e.cargo} <span className="text-ink-400 font-normal">en {e.empresa}</span></p>
                              {e.periodo && <p className="text-xs text-ink-400">{e.periodo}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {educaciones.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-2 flex items-center gap-1"><GraduationCap size={12} /> Educación</p>
                        <div className="space-y-1.5">
                          {educaciones.map((e, i) => (
                            <div key={i} className="bg-ink-50 rounded-lg px-3 py-2">
                              <p className="font-medium text-ink-700">{e.titulo} <span className="text-ink-400 font-normal">— {e.institucion}</span></p>
                              {e.periodo && <p className="text-xs text-ink-400">{e.periodo}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {habilidades.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Wrench size={12} /> Habilidades</p>
                        <div className="flex flex-wrap gap-1.5">
                          {habilidades.map((h, i) => <span key={i} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{h}</span>)}
                        </div>
                      </div>
                    )}
                    {!fechaNac && !resumenPerfil && !experiencias.length && !educaciones.length && !habilidades.length && (
                      <p className="text-ink-300 italic text-sm">Completá tus datos para que las empresas te conozcan mejor.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-ink-600 block mb-1">Fecha de nacimiento</label>
                        <input type="date" value={fechaNac} onChange={e => setFechaNac(e.target.value)} className="input-field text-sm" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-ink-600 block mb-1">Resumen profesional</label>
                      <textarea value={resumenPerfil} onChange={e => setResumenPerfil(e.target.value)} rows={3} placeholder="Describí brevemente tu perfil y objetivos..." className="input-field resize-none text-sm" />
                    </div>

                    {/* Experiencia */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-ink-600 flex items-center gap-1"><BriefcaseIcon size={12} /> Experiencia laboral</label>
                        <button onClick={() => setExperiencias(p => [...p, { empresa: '', cargo: '', periodo: '', descripcion: '' }])} className="text-xs text-brand-600 hover:underline flex items-center gap-1"><Plus size={12} /> Agregar</button>
                      </div>
                      <div className="space-y-2">
                        {experiencias.map((e, i) => (
                          <div key={i} className="bg-ink-50 rounded-xl p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input value={e.cargo} onChange={ev => setExperiencias(p => p.map((x, j) => j === i ? { ...x, cargo: ev.target.value } : x))} placeholder="Cargo / puesto" className="input-field text-xs py-1.5" />
                              <input value={e.empresa} onChange={ev => setExperiencias(p => p.map((x, j) => j === i ? { ...x, empresa: ev.target.value } : x))} placeholder="Empresa" className="input-field text-xs py-1.5" />
                            </div>
                            <div className="flex gap-2">
                              <input value={e.periodo} onChange={ev => setExperiencias(p => p.map((x, j) => j === i ? { ...x, periodo: ev.target.value } : x))} placeholder="Período (ej: 2020–2023)" className="input-field text-xs py-1.5 flex-1" />
                              <button onClick={() => setExperiencias(p => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 px-2"><X size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Educación */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-ink-600 flex items-center gap-1"><GraduationCap size={12} /> Educación</label>
                        <button onClick={() => setEducaciones(p => [...p, { institucion: '', titulo: '', periodo: '' }])} className="text-xs text-brand-600 hover:underline flex items-center gap-1"><Plus size={12} /> Agregar</button>
                      </div>
                      <div className="space-y-2">
                        {educaciones.map((e, i) => (
                          <div key={i} className="bg-ink-50 rounded-xl p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input value={e.titulo} onChange={ev => setEducaciones(p => p.map((x, j) => j === i ? { ...x, titulo: ev.target.value } : x))} placeholder="Título / carrera" className="input-field text-xs py-1.5" />
                              <input value={e.institucion} onChange={ev => setEducaciones(p => p.map((x, j) => j === i ? { ...x, institucion: ev.target.value } : x))} placeholder="Institución" className="input-field text-xs py-1.5" />
                            </div>
                            <div className="flex gap-2">
                              <input value={e.periodo} onChange={ev => setEducaciones(p => p.map((x, j) => j === i ? { ...x, periodo: ev.target.value } : x))} placeholder="Período (ej: 2018–2022)" className="input-field text-xs py-1.5 flex-1" />
                              <button onClick={() => setEducaciones(p => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 px-2"><X size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Habilidades */}
                    <div>
                      <label className="text-xs font-medium text-ink-600 block mb-2 flex items-center gap-1"><Wrench size={12} /> Habilidades</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {habilidades.map((h, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                            {h} <button onClick={() => setHabilidades(p => p.filter((_, j) => j !== i))} className="text-brand-400 hover:text-red-500"><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={habilidadInput} onChange={e => setHabilidadInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && habilidadInput.trim()) { setHabilidades(p => [...p, habilidadInput.trim()]); setHabilidadInput(''); e.preventDefault(); }}} placeholder="Escribí una habilidad y presioná Enter" className="input-field text-xs py-1.5 flex-1" />
                        <button onClick={() => { if (habilidadInput.trim()) { setHabilidades(p => [...p, habilidadInput.trim()]); setHabilidadInput(''); }}} className="btn-ghost text-xs py-1.5 px-3"><Plus size={13} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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
                        <VideoThumbnail src={v.video_url} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-700">{v.tipo === 'video_cv' ? 'Video CV' : 'Video Pitch'}</p>
                          <p className="text-xs text-ink-400 truncate">{v.taller?.nombre} · {new Date(v.created_at).toLocaleDateString('es-AR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {playerCap && (
        <CapacitacionPlayer
          cap={playerCap}
          onClose={() => setPlayerCap(null)}
          onCompleted={(id) => {
            setCapacitaciones(p => p.map(c => c.id === id ? { ...c, completada: true } : c));
            setPlayerCap(null);
          }}
        />
      )}
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

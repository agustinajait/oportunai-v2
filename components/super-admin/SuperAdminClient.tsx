'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import VideoThumbnail from '@/components/ui/VideoThumbnail';
import {
  Users, BookOpen, Video, Plus, Trash2,
  Check, X, ChevronDown, ChevronUp, Loader2,
  Clock, Mic, ExternalLink, Building2, Mail, Phone,
  ShieldCheck, ToggleLeft, ToggleRight, Briefcase,
  Image, Upload
} from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';

// ── Types ────────────────────────────────────────────────────────────
interface TallerModulo { id: string; tipo_video: string; nombre_modulo: string; duracion_base: number; texto_guia: string; orden: number; }
interface Taller { id: string; nombre: string; descripcion: string | null; activo: boolean; habilita_cv: boolean; habilita_pitch: boolean; modulos: TallerModulo[]; _count: { taller_usuarios: number; videos: number }; }
interface TallerUsuario { taller: { id: string; nombre: string }; estado: string; asignado_en: string; validado_en: string | null; }
interface VideoItem { id: string; tipo: string; video_url: string; created_at: string; es_fragmento: boolean; taller: { nombre: string } | null; }
interface Usuario { id: string; nombre_completo: string; email: string; dni: string; role: string; slug: string; created_at: string; taller_usuarios: TallerUsuario[]; videos: VideoItem[]; _count: { videos: number }; }

interface EmpresaMiembro { usuario: { id: string; nombre_completo: string; email: string; telefono: string; role: string }; rol_interno: string; activo: boolean; }
interface EmpresaOferta { id: string; titulo: string; estado: string; created_at: string; _count: { postulaciones: number }; }
interface Empresa { id: string; nombre: string; slug: string; logo_url: string | null; rubro: string | null; ciudad: string | null; activa: boolean; created_at: string; miembros: EmpresaMiembro[]; _count: { ofertas: number }; ofertas: EmpresaOferta[]; }

// ── Helpers ──────────────────────────────────────────────────────────
const estadoBadge = (estado: string) => {
  const map: Record<string, string> = { asignado: 'badge bg-ink-100 text-ink-600', completado: 'badge bg-blue-100 text-blue-700', validado: 'badge bg-emerald-100 text-emerald-700' };
  return map[estado] ?? 'badge bg-ink-100 text-ink-600';
};
const roleBadge = (role: string) => {
  const map: Record<string, string> = { super_admin: 'bg-purple-100 text-purple-700', admin: 'bg-brand-100 text-brand-700', empleador: 'bg-amber-100 text-amber-700', user: 'bg-ink-100 text-ink-600' };
  return map[role] ?? 'bg-ink-100 text-ink-600';
};
const ofertaEstadoBadge = (estado: string) => {
  const map: Record<string, string> = { activa: 'bg-emerald-100 text-emerald-700', pausada: 'bg-amber-100 text-amber-700', cerrada: 'bg-ink-100 text-ink-500' };
  return map[estado] ?? 'bg-ink-100 text-ink-500';
};

// ─────────────────────────────────────────────────────────────────────
export default function SuperAdminClient({
  talleres: initTalleres, usuarios: initUsuarios, empresas: initEmpresas, session,
}: {
  talleres: Taller[]; usuarios: Usuario[]; empresas: Empresa[]; session: SessionPayload;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'talleres' | 'usuarios' | 'empresas' | 'ofertas' | 'galeria'>('talleres');
  const [talleres, setTalleres] = useState<Taller[]>(initTalleres);
  const [usuarios, setUsuarios] = useState<Usuario[]>(initUsuarios);
  const [empresas, setEmpresas] = useState<Empresa[]>(initEmpresas);

  // ── Ofertas state ───────────────────────────────────────────────────
  type OfertaAdmin = { id: string; titulo: string; descripcion: string; estado: string; modalidad: string; ciudad: string | null; area: string | null; created_at: string; empresa: { id: string; nombre: string }; _count: { postulaciones: number } };
  const [ofertas, setOfertas] = useState<OfertaAdmin[]>([]);
  const [ofertasLoaded, setOfertasLoaded] = useState(false);
  const [creandoOferta, setCreandoOferta] = useState(false);
  const [submittingOferta, setSubmittingOferta] = useState(false);
  const [ofertaForm, setOfertaForm] = useState({
    empresa_id: '',
    empresa_nombre: '',
    titulo: '',
    descripcion: '',
    requisitos: '',
    area: '',
    modalidad: 'presencial',
    ciudad: '',
  });

  async function cargarOfertas() {
    if (ofertasLoaded) return;
    const res = await fetch('/api/super-admin/ofertas');
    const data = await res.json();
    if (data.ofertas) setOfertas(data.ofertas);
    setOfertasLoaded(true);
  }

  async function crearOferta() {
    if (!ofertaForm.titulo.trim() || !ofertaForm.descripcion.trim()) return;
    if (!ofertaForm.empresa_id && !ofertaForm.empresa_nombre.trim()) return;
    setSubmittingOferta(true);
    const res = await fetch('/api/super-admin/ofertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ofertaForm),
    });
    const data = await res.json();
    if (data.oferta) {
      setOfertas(prev => [data.oferta, ...prev]);
      setCreandoOferta(false);
      setOfertaForm({ empresa_id: '', empresa_nombre: '', titulo: '', descripcion: '', requisitos: '', area: '', modalidad: 'presencial', ciudad: '' });
    }
    setSubmittingOferta(false);
  }

  async function toggleOfertaEstado(o: OfertaAdmin) {
    const nuevoEstado = o.estado === 'activa' ? 'cerrada' : 'activa';
    const res = await fetch('/api/super-admin/ofertas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: o.id, estado: nuevoEstado }),
    });
    const data = await res.json();
    if (data.oferta) setOfertas(prev => prev.map(x => x.id === o.id ? data.oferta : x));
  }

  // ── Taller state ────────────────────────────────────────────────────
  const [expandedTaller, setExpandedTaller] = useState<string | null>(null);
  const [editingModulo, setEditingModulo] = useState<Record<string, { duracion_base: number; texto_guia: string }>>({});
  const [savingModulo, setSavingModulo] = useState<string | null>(null);
  const [creatingTaller, setCreatingTaller] = useState(false);
  const [newTaller, setNewTaller] = useState({ nombre: '', descripcion: '', habilita_cv: true, habilita_pitch: true });
  const [submittingTaller, setSubmittingTaller] = useState(false);

  // ── Usuario state ───────────────────────────────────────────────────
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [assigningTaller, setAssigningTaller] = useState<{ userId: string; tallerId: string } | null>(null);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // ── Empresa state ───────────────────────────────────────────────────
  const [expandedEmpresa, setExpandedEmpresa] = useState<string | null>(null);
  const [togglingEmpresa, setTogglingEmpresa] = useState<string | null>(null);

  // ── Galería state ────────────────────────────────────────────────────
  type GaleriaItem = { id: string; src: string; label: string; big: boolean; orden: number; activa: boolean };
  const [galeriaItems, setGaleriaItems] = useState<GaleriaItem[]>([]);
  const [galeriaLoaded, setGaleriaLoaded] = useState(false);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  const [galeriaLabel, setGaleriaLabel] = useState('');
  const [galeriaBig, setGaleriaBig] = useState(false);
  const [galeriaOrden, setGaleriaOrden] = useState(0);

  async function cargarGaleria() {
    if (galeriaLoaded) return;
    const res = await fetch('/api/super-admin/galeria-home');
    const data = await res.json();
    if (data.items) setGaleriaItems(data.items);
    setGaleriaLoaded(true);
  }

  async function subirFotoGaleria(file: File) {
    if (!galeriaLabel.trim()) { alert('Ingresá una etiqueta primero'); return; }
    setUploadingGaleria(true);
    const fd = new FormData();
    fd.append('file', file);
    const uploadRes = await fetch('/api/super-admin/galeria-home/upload', { method: 'POST', body: fd });
    const uploadData = await uploadRes.json();
    if (!uploadData.src) { setUploadingGaleria(false); alert('Error al subir la imagen'); return; }
    const createRes = await fetch('/api/super-admin/galeria-home', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src: uploadData.src, label: galeriaLabel, big: galeriaBig, orden: galeriaOrden }),
    });
    const createData = await createRes.json();
    if (createData.item) setGaleriaItems(prev => [...prev, createData.item].sort((a, b) => a.orden - b.orden));
    setGaleriaLabel('');
    setGaleriaBig(false);
    setGaleriaOrden(0);
    setUploadingGaleria(false);
  }

  async function toggleGaleriaActiva(item: GaleriaItem) {
    const res = await fetch(`/api/super-admin/galeria-home/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: !item.activa }),
    });
    const data = await res.json();
    if (data.item) setGaleriaItems(prev => prev.map(g => g.id === item.id ? data.item : g));
  }

  async function toggleGaleriaBig(item: GaleriaItem) {
    const res = await fetch(`/api/super-admin/galeria-home/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ big: !item.big }),
    });
    const data = await res.json();
    if (data.item) setGaleriaItems(prev => prev.map(g => g.id === item.id ? data.item : g));
  }

  async function eliminarFotoGaleria(id: string) {
    if (!confirm('¿Eliminar esta foto?')) return;
    await fetch(`/api/super-admin/galeria-home/${id}`, { method: 'DELETE' });
    setGaleriaItems(prev => prev.filter(g => g.id !== id));
  }

  // ══════════════════════════════════════════════════════════════════
  // TALLERES HANDLERS
  // ══════════════════════════════════════════════════════════════════
  const handleCreateTaller = async () => {
    if (!newTaller.nombre.trim()) return;
    setSubmittingTaller(true);
    const res = await fetch('/api/super-admin/talleres', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTaller),
    });
    if (res.ok) {
      const created = await res.json();
      setTalleres(prev => [created, ...prev]);
      setCreatingTaller(false);
      setNewTaller({ nombre: '', descripcion: '', habilita_cv: true, habilita_pitch: true });
    }
    setSubmittingTaller(false);
  };

  const handleDeleteTaller = async (id: string) => {
    if (!confirm('¿Eliminar este taller? Se desasignarán todos los usuarios.')) return;
    const res = await fetch(`/api/super-admin/talleres/${id}`, { method: 'DELETE' });
    if (res.ok) setTalleres(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleActivo = async (taller: Taller) => {
    const res = await fetch(`/api/super-admin/talleres/${taller.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !taller.activo }),
    });
    if (res.ok) setTalleres(prev => prev.map(t => t.id === taller.id ? { ...t, activo: !t.activo } : t));
  };

  const getModuloEdit = (m: TallerModulo) => editingModulo[m.id] ?? { duracion_base: m.duracion_base, texto_guia: m.texto_guia };
  const isDirtyModulo = (m: TallerModulo) => { const e = editingModulo[m.id]; return e && (e.duracion_base !== m.duracion_base || e.texto_guia !== m.texto_guia); };

  const handleSaveModulo = async (taller: Taller, modulo: TallerModulo) => {
    const data = getModuloEdit(modulo);
    setSavingModulo(modulo.id);
    const res = await fetch(`/api/super-admin/talleres/${taller.id}/modulos/${modulo.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setTalleres(prev => prev.map(t => t.id === taller.id ? { ...t, modulos: t.modulos.map(m => m.id === modulo.id ? { ...m, ...data } : m) } : t));
      setEditingModulo(prev => { const n = { ...prev }; delete n[modulo.id]; return n; });
    }
    setSavingModulo(null);
  };

  // ══════════════════════════════════════════════════════════════════
  // USUARIOS HANDLERS
  // ══════════════════════════════════════════════════════════════════
  const handleAssignTaller = async () => {
    if (!assigningTaller) return;
    setSubmittingAssign(true);
    await fetch(`/api/super-admin/usuarios/${assigningTaller.userId}/talleres`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taller_id: assigningTaller.tallerId }),
    });
    setAssigningTaller(null);
    setSubmittingAssign(false);
    router.refresh();
  };

  const handleCambiarEstado = async (userId: string, tallerId: string, estado: string) => {
    setUpdatingEstado(`${userId}-${tallerId}`);
    await fetch(`/api/super-admin/usuarios/${userId}/talleres`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taller_id: tallerId, estado }),
    });
    setUpdatingEstado(null);
    router.refresh();
  };

  const handleCambiarRol = async (userId: string, role: string) => {
    setUpdatingRole(userId);
    const res = await fetch(`/api/super-admin/usuarios/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    }
    setUpdatingRole(null);
  };

  // ══════════════════════════════════════════════════════════════════
  // EMPRESAS HANDLERS
  // ══════════════════════════════════════════════════════════════════
  const handleToggleEmpresa = async (empresa: Empresa) => {
    setTogglingEmpresa(empresa.id);
    const res = await fetch(`/api/super-admin/empresas/${empresa.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: !empresa.activa }),
    });
    if (res.ok) setEmpresas(prev => prev.map(e => e.id === empresa.id ? { ...e, activa: !e.activa } : e));
    setTogglingEmpresa(null);
  };

  // ══════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ══════════════════════════════════════════════════════════════════
  const renderModulos = (taller: Taller) => {
    const cvMods = taller.modulos.filter(m => m.tipo_video === 'video_cv');
    const pitchMods = taller.modulos.filter(m => m.tipo_video === 'video_pitch');

    const renderGroup = (mods: TallerModulo[], label: string, color: string) => (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          {label === 'Video CV' ? <Video size={14} className={color} /> : <Mic size={14} className={color} />}
          <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">{label}</span>
        </div>
        <div className="space-y-3">
          {mods.map(m => {
            const e = getModuloEdit(m);
            const dirty = isDirtyModulo(m);
            return (
              <div key={m.id} className="bg-ink-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge bg-ink-200 text-ink-600 text-xs mr-2">#{m.orden}</span>
                  <span className="font-medium text-ink-800 text-sm flex-1">{m.nombre_modulo}</span>
                  {savingModulo === m.id && <Loader2 size={14} className="animate-spin text-brand-500" />}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label flex items-center gap-1"><Clock size={12} /> Duración (seg.)</label>
                    <input type="number" min={5} max={120} value={e.duracion_base}
                      onChange={ev => setEditingModulo(prev => ({ ...prev, [m.id]: { ...e, duracion_base: parseInt(ev.target.value) } }))}
                      className="input-field text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Texto guía</label>
                    <textarea value={e.texto_guia}
                      onChange={ev => setEditingModulo(prev => ({ ...prev, [m.id]: { ...e, texto_guia: ev.target.value } }))}
                      rows={2} className="input-field text-sm resize-none" />
                  </div>
                </div>
                {dirty && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleSaveModulo(taller, m)} className="btn-primary py-1.5 px-3 text-sm"><Check size={13} /> Guardar</button>
                    <button onClick={() => setEditingModulo(prev => { const n = { ...prev }; delete n[m.id]; return n; })} className="btn-ghost py-1.5 px-3 text-sm"><X size={13} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className="px-6 py-4 border-t border-ink-100">
        {cvMods.length > 0 && renderGroup(cvMods, 'Video CV', 'text-brand-500')}
        {pitchMods.length > 0 && renderGroup(pitchMods, 'Video Pitch', 'text-emerald-500')}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar session={session} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <span className="badge bg-purple-100 text-purple-700 mb-1 inline-block">Super Admin</span>
          <h1 className="font-display text-3xl font-semibold text-ink-900">Panel de gestión</h1>
          <p className="text-ink-400 text-sm mt-1">Talleres, usuarios y empresas</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-ink-100 rounded-xl p-1 mb-8 w-fit">
          {[
            { key: 'talleres', label: 'Talleres', icon: <BookOpen size={15} />, count: talleres.length },
            { key: 'usuarios', label: 'Usuarios', icon: <Users size={15} />, count: usuarios.length },
            { key: 'empresas', label: 'Empresas', icon: <Building2 size={15} />, count: empresas.length },
            { key: 'ofertas', label: 'Ofertas', icon: <Briefcase size={15} />, count: ofertas.length },
            { key: 'galeria', label: 'Galería', icon: <Image size={15} />, count: galeriaItems.length },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key as any); if (t.key === 'ofertas') cargarOfertas(); if (t.key === 'galeria') cargarGaleria(); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}>
              {t.icon} {t.label}
              <span className="badge bg-ink-200 text-ink-600 ml-1">{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── TAB: TALLERES ──────────────────────────────────────────── */}
        {tab === 'talleres' && (
          <div className="space-y-4">
            {!creatingTaller ? (
              <button onClick={() => setCreatingTaller(true)} className="btn-primary flex items-center gap-2">
                <Plus size={16} /> Nuevo taller
              </button>
            ) : (
              <div className="card p-6">
                <h3 className="font-semibold text-ink-800 mb-4">Nuevo taller</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label">Nombre del taller *</label>
                    <input className="input-field" placeholder="Taller de Inserción Laboral"
                      value={newTaller.nombre} onChange={e => setNewTaller(p => ({ ...p, nombre: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Descripción</label>
                    <input className="input-field" placeholder="Breve descripción..."
                      value={newTaller.descripcion} onChange={e => setNewTaller(p => ({ ...p, descripcion: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newTaller.habilita_cv}
                      onChange={e => setNewTaller(p => ({ ...p, habilita_cv: e.target.checked }))} className="w-4 h-4 rounded" />
                    <Video size={15} className="text-brand-500" />
                    <span className="text-sm font-medium">Habilitar Video CV</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newTaller.habilita_pitch}
                      onChange={e => setNewTaller(p => ({ ...p, habilita_pitch: e.target.checked }))} className="w-4 h-4 rounded" />
                    <Mic size={15} className="text-emerald-500" />
                    <span className="text-sm font-medium">Habilitar Video Pitch</span>
                  </label>
                </div>
                <p className="text-xs text-ink-400 mb-4">Los módulos se crean automáticamente con los valores por defecto. Podés editarlos después.</p>
                <div className="flex gap-3">
                  <button onClick={handleCreateTaller} disabled={submittingTaller} className="btn-primary">
                    {submittingTaller ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Crear taller
                  </button>
                  <button onClick={() => setCreatingTaller(false)} className="btn-ghost"><X size={16} /> Cancelar</button>
                </div>
              </div>
            )}

            {talleres.map(taller => (
              <div key={taller.id} className="card overflow-hidden">
                <button onClick={() => setExpandedTaller(expandedTaller === taller.id ? null : taller.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-ink-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink-800">{taller.nombre}</p>
                        {!taller.activo && <span className="badge bg-red-100 text-red-600 text-xs">Inactivo</span>}
                      </div>
                      <p className="text-xs text-ink-400 mt-0.5">{taller.descripcion ?? 'Sin descripción'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 text-xs text-ink-400">
                      {taller.habilita_cv && <span className="badge badge-blue flex gap-1"><Video size={10} /> CV</span>}
                      {taller.habilita_pitch && <span className="badge badge-green flex gap-1"><Mic size={10} /> Pitch</span>}
                      <span className="badge bg-ink-100 text-ink-600">{taller._count.taller_usuarios} usuarios</span>
                      <span className="badge bg-ink-100 text-ink-600">{taller._count.videos} videos</span>
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleToggleActivo(taller)}
                        className={`btn-ghost py-1 px-2 text-xs ${taller.activo ? 'text-emerald-600' : 'text-ink-400'}`}>
                        {taller.activo ? '✓ Activo' : '○ Inactivo'}
                      </button>
                      <button onClick={() => handleDeleteTaller(taller.id)}
                        className="btn-ghost py-1 px-2 text-xs text-red-500 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {expandedTaller === taller.id ? <ChevronUp size={16} className="text-ink-400" /> : <ChevronDown size={16} className="text-ink-400" />}
                  </div>
                </button>
                {expandedTaller === taller.id && renderModulos(taller)}
              </div>
            ))}

            {talleres.length === 0 && (
              <div className="card p-12 text-center">
                <BookOpen size={36} className="mx-auto mb-3 text-ink-300" />
                <p className="text-ink-400">No hay talleres todavía. Creá el primero.</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: USUARIOS ──────────────────────────────────────────── */}
        {tab === 'usuarios' && (
          <div className="space-y-3">
            {usuarios.map(u => (
              <div key={u.id} className="card overflow-hidden">
                <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-ink-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Thumbnail inline */}
                    {u.videos.find(v => v.tipo === 'video_cv')
                      ? <VideoThumbnail src={u.videos.find(v => v.tipo === 'video_cv')!.video_url} size="sm" />
                      : <div className="w-14 h-10 rounded-lg bg-ink-100 flex items-center justify-center flex-shrink-0"><Video size={14} className="text-ink-300" /></div>
                    }
                    <div className="text-left">
                      <p className="font-medium text-ink-800">{u.nombre_completo}</p>
                      <p className="text-xs text-ink-400">{u.email} · DNI {u.dni}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 text-xs">
                      <span className={`badge ${roleBadge(u.role)}`}>{u.role}</span>
                      <span className="badge bg-ink-100 text-ink-600">{u.taller_usuarios.length} talleres</span>
                      <span className="badge bg-ink-100 text-ink-600">{u._count.videos} videos</span>
                    </div>
                    {expandedUser === u.id ? <ChevronUp size={16} className="text-ink-400" /> : <ChevronDown size={16} className="text-ink-400" />}
                  </div>
                </button>

                {expandedUser === u.id && (
                  <div className="border-t border-ink-100 px-6 py-5 space-y-6">

                    {/* Rol */}
                    <div>
                      <h4 className="font-semibold text-ink-800 text-sm mb-3 flex items-center gap-2"><ShieldCheck size={14} /> Rol del usuario</h4>
                      <div className="flex items-center gap-3">
                        <select
                          value={u.role}
                          onChange={e => handleCambiarRol(u.id, e.target.value)}
                          disabled={updatingRole === u.id}
                          className="input-field text-sm w-48">
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          <option value="empleador">empleador</option>
                          <option value="super_admin">super_admin</option>
                        </select>
                        {updatingRole === u.id && <Loader2 size={14} className="animate-spin text-brand-500" />}
                        <span className="text-xs text-ink-400">Cambia acceso inmediatamente</span>
                      </div>
                    </div>

                    {/* Talleres asignados */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-ink-800 text-sm">Talleres asignados</h4>
                        <button onClick={() => setAssigningTaller({ userId: u.id, tallerId: talleres[0]?.id ?? '' })}
                          className="btn-ghost py-1 px-3 text-xs gap-1">
                          <Plus size={12} /> Asignar taller
                        </button>
                      </div>

                      {assigningTaller?.userId === u.id && (
                        <div className="bg-ink-50 rounded-xl p-4 mb-3 flex items-center gap-3">
                          <select className="input-field text-sm flex-1"
                            value={assigningTaller.tallerId}
                            onChange={e => setAssigningTaller({ userId: u.id, tallerId: e.target.value })}>
                            {talleres.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                          </select>
                          <button onClick={handleAssignTaller} disabled={submittingAssign} className="btn-primary py-2 px-4 text-sm">
                            {submittingAssign ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Asignar
                          </button>
                          <button onClick={() => setAssigningTaller(null)} className="btn-ghost py-2 px-2"><X size={14} /></button>
                        </div>
                      )}

                      {u.taller_usuarios.length === 0 ? (
                        <p className="text-xs text-ink-400 italic">Sin talleres asignados</p>
                      ) : (
                        <div className="space-y-2">
                          {u.taller_usuarios.map(rel => (
                            <div key={rel.taller.id} className="flex items-center justify-between bg-ink-50 rounded-xl px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-ink-800">{rel.taller.nombre}</p>
                                <p className="text-xs text-ink-400 mt-0.5">
                                  Asignado {new Date(rel.asignado_en).toLocaleDateString('es-AR')}
                                  {rel.validado_en && ` · Validado ${new Date(rel.validado_en).toLocaleDateString('es-AR')}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={estadoBadge(rel.estado)}>{rel.estado}</span>
                                <select value={rel.estado}
                                  onChange={e => handleCambiarEstado(u.id, rel.taller.id, e.target.value)}
                                  className="text-xs border border-ink-200 rounded-lg px-2 py-1 bg-white">
                                  <option value="asignado">asignado</option>
                                  <option value="completado">completado</option>
                                  <option value="validado">validado</option>
                                </select>
                                {updatingEstado === `${u.id}-${rel.taller.id}` && <Loader2 size={12} className="animate-spin text-brand-500" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Videos grabados */}
                    <div>
                      <h4 className="font-semibold text-ink-800 text-sm mb-3">Videos grabados</h4>
                      {u.videos.length === 0 ? (
                        <p className="text-xs text-ink-400 italic">Sin videos grabados</p>
                      ) : (
                        <div className="space-y-2">
                          {u.videos.map(v => (
                            <div key={v.id} className="flex items-center gap-3 bg-ink-50 rounded-xl px-4 py-3">
                              <VideoThumbnail src={v.video_url} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-ink-800">
                                  {v.tipo === 'video_cv' ? 'Video CV' : 'Video Pitch'}
                                  {v.taller && <span className="text-ink-400 font-normal"> · {v.taller.nombre}</span>}
                                </p>
                                <p className="text-xs text-ink-400">{new Date(v.created_at).toLocaleString('es-AR')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: EMPRESAS ──────────────────────────────────────────── */}
        {tab === 'empresas' && (
          <div className="space-y-3">
            {empresas.length === 0 && (
              <div className="card p-12 text-center">
                <Building2 size={36} className="mx-auto mb-3 text-ink-300" />
                <p className="text-ink-400">No hay empresas registradas todavía.</p>
              </div>
            )}

            {empresas.map(e => (
              <div key={e.id} className="card overflow-hidden">
                <button onClick={() => setExpandedEmpresa(expandedEmpresa === e.id ? null : e.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-ink-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-amber-600" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink-800">{e.nombre}</p>
                        {!e.activa && <span className="badge bg-red-100 text-red-600 text-xs">Inactiva</span>}
                      </div>
                      <p className="text-xs text-ink-400">
                        {[e.rubro, e.ciudad].filter(Boolean).join(' · ')}
                        {' · '}creada {new Date(e.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 text-xs">
                      <span className="badge bg-ink-100 text-ink-600 flex gap-1"><Users size={10} /> {e.miembros.length}</span>
                      <span className="badge bg-ink-100 text-ink-600 flex gap-1"><Briefcase size={10} /> {e._count.ofertas} ofertas</span>
                    </div>
                    <button
                      onClick={ev => { ev.stopPropagation(); handleToggleEmpresa(e); }}
                      disabled={togglingEmpresa === e.id}
                      className={`btn-ghost py-1 px-2 text-xs flex items-center gap-1 ${e.activa ? 'text-emerald-600' : 'text-ink-400'}`}>
                      {togglingEmpresa === e.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : e.activa ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {e.activa ? 'Activa' : 'Inactiva'}
                    </button>
                    {expandedEmpresa === e.id ? <ChevronUp size={16} className="text-ink-400" /> : <ChevronDown size={16} className="text-ink-400" />}
                  </div>
                </button>

                {expandedEmpresa === e.id && (
                  <div className="border-t border-ink-100 px-6 py-5 space-y-5">

                    {/* Miembros */}
                    <div>
                      <h4 className="font-semibold text-ink-800 text-sm mb-3 flex items-center gap-2"><Users size={14} /> Miembros</h4>
                      {e.miembros.length === 0 ? (
                        <p className="text-xs text-ink-400 italic">Sin miembros</p>
                      ) : (
                        <div className="space-y-2">
                          {e.miembros.map((m, i) => (
                            <div key={i} className="bg-ink-50 rounded-xl px-4 py-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium text-ink-800">{m.usuario.nombre_completo}</p>
                                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <span className="flex items-center gap-1 text-xs text-ink-500">
                                      <Mail size={11} /> {m.usuario.email}
                                    </span>
                                    {m.usuario.telefono && (
                                      <span className="flex items-center gap-1 text-xs text-ink-500">
                                        <Phone size={11} /> {m.usuario.telefono}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-3 flex-shrink-0">
                                  <span className="badge bg-amber-100 text-amber-700 text-xs">{m.rol_interno}</span>
                                  <span className={`badge text-xs ${roleBadge(m.usuario.role)}`}>{m.usuario.role}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ofertas */}
                    <div>
                      <h4 className="font-semibold text-ink-800 text-sm mb-3 flex items-center gap-2"><Briefcase size={14} /> Ofertas</h4>
                      {e.ofertas.length === 0 ? (
                        <p className="text-xs text-ink-400 italic">Sin ofertas publicadas</p>
                      ) : (
                        <div className="space-y-2">
                          {e.ofertas.map(o => (
                            <div key={o.id} className="bg-ink-50 rounded-xl px-4 py-3 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-ink-800">{o.titulo}</p>
                                <p className="text-xs text-ink-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('es-AR')}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`badge text-xs ${ofertaEstadoBadge(o.estado)}`}>{o.estado}</span>
                                <span className="badge bg-ink-100 text-ink-600 text-xs">{o._count.postulaciones} postulaciones</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: OFERTAS ───────────────────────────────────────────── */}
        {tab === 'ofertas' && (
          <div className="space-y-4">
            {/* Botón nueva oferta */}
            {!creandoOferta ? (
              <button onClick={() => setCreandoOferta(true)} className="btn-primary flex items-center gap-2">
                <Plus size={16} /> Nueva oferta
              </button>
            ) : (
              <div className="card p-6 space-y-4">
                <h3 className="font-semibold text-ink-800">Crear oferta laboral</h3>

                {/* Empresa */}
                <div>
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">Empresa</label>
                  <select
                    value={ofertaForm.empresa_id}
                    onChange={e => setOfertaForm(p => ({ ...p, empresa_id: e.target.value, empresa_nombre: '' }))}
                    className="input mb-2"
                  >
                    <option value="">— Seleccionar empresa existente —</option>
                    {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                  {!ofertaForm.empresa_id && (
                    <input
                      placeholder="O escribí el nombre de la empresa (se crea automáticamente)"
                      value={ofertaForm.empresa_nombre}
                      onChange={e => setOfertaForm(p => ({ ...p, empresa_nombre: e.target.value }))}
                      className="input"
                    />
                  )}
                </div>

                {/* Título */}
                <div>
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">Título *</label>
                  <input
                    placeholder="Ej: Operario de producción"
                    value={ofertaForm.titulo}
                    onChange={e => setOfertaForm(p => ({ ...p, titulo: e.target.value }))}
                    className="input"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">Descripción *</label>
                  <textarea
                    placeholder="Describí el puesto, responsabilidades y condiciones..."
                    value={ofertaForm.descripcion}
                    onChange={e => setOfertaForm(p => ({ ...p, descripcion: e.target.value }))}
                    rows={4}
                    className="input resize-none"
                  />
                </div>

                {/* Requisitos */}
                <div>
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">Requisitos</label>
                  <textarea
                    placeholder="Experiencia, estudios, habilidades requeridas..."
                    value={ofertaForm.requisitos}
                    onChange={e => setOfertaForm(p => ({ ...p, requisitos: e.target.value }))}
                    rows={2}
                    className="input resize-none"
                  />
                </div>

                {/* Fila: área, modalidad, ciudad */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">Área</label>
                    <input
                      placeholder="Ej: Producción"
                      value={ofertaForm.area}
                      onChange={e => setOfertaForm(p => ({ ...p, area: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">Modalidad</label>
                    <select
                      value={ofertaForm.modalidad}
                      onChange={e => setOfertaForm(p => ({ ...p, modalidad: e.target.value }))}
                      className="input"
                    >
                      <option value="presencial">Presencial</option>
                      <option value="remoto">Remoto</option>
                      <option value="hibrido">Híbrido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">Ciudad</label>
                    <input
                      placeholder="Ej: Buenos Aires"
                      value={ofertaForm.ciudad}
                      onChange={e => setOfertaForm(p => ({ ...p, ciudad: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={crearOferta}
                    disabled={submittingOferta || !ofertaForm.titulo.trim() || !ofertaForm.descripcion.trim()}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingOferta ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Publicar oferta
                  </button>
                  <button onClick={() => setCreandoOferta(false)} className="btn-ghost">Cancelar</button>
                </div>
              </div>
            )}

            {/* Lista de ofertas */}
            {ofertas.length === 0 && ofertasLoaded && (
              <div className="card p-12 text-center">
                <Briefcase size={36} className="mx-auto mb-3 text-ink-300" />
                <p className="text-ink-400">No hay ofertas todavía.</p>
              </div>
            )}

            {ofertas.map(o => (
              <div key={o.id} className="card px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge text-xs ${o.estado === 'activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}>
                      {o.estado}
                    </span>
                    <span className="text-ink-400 text-xs">{o._count.postulaciones} postulaciones</span>
                  </div>
                  <p className="font-semibold text-ink-800 truncate">{o.titulo}</p>
                  <p className="text-brand-600 text-sm">{o.empresa.nombre}</p>
                  <p className="text-ink-400 text-xs mt-0.5">
                    {[o.ciudad, o.modalidad, o.area].filter(Boolean).join(' · ')}
                    {' · '}{new Date(o.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <button
                  onClick={() => toggleOfertaEstado(o)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                    o.estado === 'activa'
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {o.estado === 'activa' ? 'Cerrar' : 'Activar'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: GALERÍA ────────────────────────────────────────────── */}
        {tab === 'galeria' && (
          <div className="space-y-6">

            {/* Upload form */}
            <div className="card p-6">
              <h3 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
                <Upload size={16} /> Subir nueva foto
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="label">Etiqueta *</label>
                  <input className="input-field" placeholder="Ej: Implementaciones"
                    value={galeriaLabel} onChange={e => setGaleriaLabel(e.target.value)} />
                </div>
                <div>
                  <label className="label">Orden</label>
                  <input type="number" className="input-field" min={0} max={99}
                    value={galeriaOrden} onChange={e => setGaleriaOrden(Number(e.target.value))} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={galeriaBig}
                      onChange={e => setGaleriaBig(e.target.checked)} className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium">Foto grande (ocupa 2 filas)</span>
                  </label>
                </div>
              </div>
              <label className={`inline-flex items-center gap-2 btn-primary cursor-pointer ${uploadingGaleria ? 'opacity-60 pointer-events-none' : ''}`}>
                {uploadingGaleria ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploadingGaleria ? 'Subiendo...' : 'Elegir imagen'}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingGaleria}
                  onChange={e => { const f = e.target.files?.[0]; if (f) subirFotoGaleria(f); e.target.value = ''; }} />
              </label>
              <p className="text-xs text-ink-400 mt-3">Formatos: JPG, PNG, WebP · Tamaño recomendado: 800×600px mínimo</p>
            </div>

            {/* Grid of photos */}
            {galeriaItems.length === 0 && galeriaLoaded && (
              <div className="card p-12 text-center text-ink-400">
                <Image size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay fotos todavía. Subí la primera.</p>
              </div>
            )}

            {galeriaItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {galeriaItems.map(item => (
                  <div key={item.id} className={`card overflow-hidden ${!item.activa ? 'opacity-50' : ''}`}>
                    <div className="relative" style={{ paddingBottom: '66%' }}>
                      <img src={item.src} alt={item.label}
                        className="absolute inset-0 w-full h-full object-cover" />
                      {item.big && (
                        <span className="absolute top-2 left-2 bg-brand-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">Grande</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm text-ink-800 mb-1">{item.label}</p>
                      <p className="text-xs text-ink-400 mb-3">Orden: {item.orden}</p>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => toggleGaleriaActiva(item)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${item.activa ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}>
                          {item.activa ? '✓ Activa' : '○ Oculta'}
                        </button>
                        <button onClick={() => toggleGaleriaBig(item)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium bg-ink-100 text-ink-600 hover:bg-ink-200 transition-colors">
                          {item.big ? 'Normal' : '↕ Grande'}
                        </button>
                        <button onClick={() => eliminarFotoGaleria(item.id)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { Check, X, Eye, Phone, Users, Trophy, Archive, Clock, Filter, Plus, Trash2 } from 'lucide-react';

const DOCS_CONFIG = [
  { tipo: 'dni', label: 'DNI' },
  { tipo: 'antecedentes_penales', label: 'Antecedentes Penales' },
  { tipo: 'manipulacion_alimentos', label: 'Manip. Alimentos' },
  { tipo: 'libreta_sanitaria', label: 'Libreta Sanitaria' },
  { tipo: 'otro', label: 'Otro documento' },
];

const PIPELINE = [
  { estado: 'pendiente', label: 'Sin ver', color: 'bg-gray-100 text-gray-600', icon: Clock },
  { estado: 'visto', label: 'Visto', color: 'bg-blue-100 text-blue-600', icon: Eye },
  { estado: 'interesado', label: 'Interesado', color: 'bg-purple-100 text-purple-600', icon: Check },
  { estado: 'contactar', label: 'Contactar', color: 'bg-yellow-100 text-yellow-700', icon: Phone },
  { estado: 'en_proceso', label: 'En proceso', color: 'bg-orange-100 text-orange-600', icon: Users },
  { estado: 'contratado', label: 'Contratado', color: 'bg-green-100 text-green-700', icon: Trophy },
  { estado: 'bolsa_talentos', label: 'Bolsa talentos', color: 'bg-teal-100 text-teal-600', icon: Archive },
  { estado: 'descartado', label: 'Descartado', color: 'bg-red-100 text-red-600', icon: X },
];

function calcularEdad(fecha_nacimiento: string | null): string {
  if (!fecha_nacimiento) return '';
  const hoy = new Date();
  const nac = new Date(fecha_nacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

function calcularEdadNumero(fecha_nacimiento: string | null): number | null {
  if (!fecha_nacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fecha_nacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function extraerCiudad(direccion: string | null): string {
  if (!direccion) return '';
  return direccion.split(',').slice(-2).join(',').trim();
}

type Oferta = {
  id: string; titulo: string; area: string | null; ciudad: string | null;
  modalidad: string; estado: string; mensaje_whatsapp: string | null;
  docs_requeridos: string[]; preguntas_videocv: string[]; created_at: string;
  _count: { postulaciones: number };
};

type CvDatos = {
  resumen?: string;
  experiencia?: { empresa: string; cargo: string; periodo: string; descripcion: string }[];
  educacion?: { institucion: string; titulo: string; periodo: string }[];
  habilidades?: string[];
  idiomas?: string[];
};

type Postulante = {
  id: string; estado: string; nota: string | null; created_at: string;
  usuario: {
    id: string; nombre_completo: string; email: string; telefono: string;
    slug: string; bio: string | null; direccion: string | null; fecha_nacimiento: string | null;
    cv_datos: CvDatos | null;
    videos: { id: string; video_url: string; tipo: string; created_at: string }[];
  };
  video: { id: string; video_url: string; tipo: string };
  documentos?: { tipo: string; file_url: string }[];
};

type Empresa = {
  id: string; nombre: string; slug: string; logo_url: string | null;
  descripcion: string | null; rubro: string | null; ciudad: string | null; sitio_web: string | null;
};

export default function EmpresaDashboard() {
  const [tab, setTab] = useState<'ofertas' | 'nueva' | 'postulantes' | 'perfil'>('ofertas');
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [postulantes, setPostulantes] = useState<Postulante[]>([]);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState<Oferta | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false);
  const [perfilGuardado, setPerfilGuardado] = useState(false);
  const [videoModal, setVideoModal] = useState<Postulante | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroEdadMin, setFiltroEdadMin] = useState<string>('');
  const [filtroEdadMax, setFiltroEdadMax] = useState<string>('');
  const [filtroCiudad, setFiltroCiudad] = useState<string>('');
  const [filtroDocsCompletos, setFiltroDocsCompletos] = useState<boolean>(false);

  const [form, setForm] = useState({
    titulo: '', descripcion: '', requisitos: '', area: '',
    modalidad: 'presencial', ciudad: '', mensaje_whatsapp: '',
    docs_requeridos: [] as string[],
    preguntas_videocv: [] as string[],
  });
  const [preguntaInput, setPreguntaInput] = useState('');

  const [perfilForm, setPerfilForm] = useState({
    nombre: '', descripcion: '', rubro: '', ciudad: '', sitio_web: '',
  });

  useEffect(() => { cargarOfertas(); cargarEmpresa(); }, []);

  async function cargarOfertas() {
    const res = await fetch('/api/empresa/ofertas');
    const data = await res.json();
    if (data.ofertas) setOfertas(data.ofertas);
  }

  async function cargarEmpresa() {
    const res = await fetch('/api/empresa/perfil');
    const data = await res.json();
    if (data.empresa) {
      setEmpresa(data.empresa);
      setPerfilForm({ nombre: data.empresa.nombre || '', descripcion: data.empresa.descripcion || '', rubro: data.empresa.rubro || '', ciudad: data.empresa.ciudad || '', sitio_web: data.empresa.sitio_web || '' });
    }
  }

  async function guardarPerfil() {
    setLoading(true);
    await fetch('/api/empresa/perfil', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(perfilForm) });
    setPerfilGuardado(true);
    setTimeout(() => setPerfilGuardado(false), 2000);
    cargarEmpresa();
    setLoading(false);
  }

  async function subirLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/empresa/logo', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.logo_url) setEmpresa(prev => prev ? { ...prev, logo_url: data.logo_url } : prev);
  }

  function limpiarFiltros() {
    setFiltroEdadMin('');
    setFiltroEdadMax('');
    setFiltroCiudad('');
    setFiltroDocsCompletos(false);
  }

  async function verPostulantes(oferta: Oferta) {
    setOfertaSeleccionada(oferta);
    setTab('postulantes');
    setFiltroEstado('todos');
    limpiarFiltros();
    const res = await fetch(`/api/ofertas/${oferta.id}/postulantes`);
    const data = await res.json();
    if (data.postulaciones) {
      const postsConDocs = await Promise.all(
        data.postulaciones.map(async (p: Postulante) => {
          const resDoc = await fetch(`/api/empresa/candidato/${p.usuario.id}/documentos`);
          const dataDoc = await resDoc.json();
          return { ...p, documentos: dataDoc.documentos || [] };
        })
      );
      setPostulantes(postsConDocs);
    }
  }

  async function cambiarEstado(postulacion_id: string, estado: string) {
    await fetch(`/api/ofertas/${ofertaSeleccionada?.id}/postulantes`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postulacion_id, estado }),
    });
    setPostulantes(prev => prev.map(p => p.id === postulacion_id ? { ...p, estado } : p));
  }

  async function crearOferta() {
    setLoading(true);
    // Auto-add any question that was typed but not explicitly added via "+"
    const pendiente = preguntaInput.trim();
    const formFinal = pendiente && !form.preguntas_videocv.includes(pendiente)
      ? { ...form, preguntas_videocv: [...form.preguntas_videocv, pendiente] }
      : form;
    const res = await fetch('/api/ofertas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formFinal) });
    const data = await res.json();
    if (data.ok) {
      setForm({ titulo: '', descripcion: '', requisitos: '', area: '', modalidad: 'presencial', ciudad: '', mensaje_whatsapp: '', docs_requeridos: [], preguntas_videocv: [] });
      setPreguntaInput('');
      setTab('ofertas');
      cargarOfertas();
    }
    setLoading(false);
  }

  function toggleDocRequerido(tipo: string) {
    setForm(prev => ({ ...prev, docs_requeridos: prev.docs_requeridos.includes(tipo) ? prev.docs_requeridos.filter(d => d !== tipo) : [...prev.docs_requeridos, tipo] }));
  }

  function agregarPregunta() {
    const p = preguntaInput.trim();
    if (!p || form.preguntas_videocv.includes(p)) return;
    setForm(prev => ({ ...prev, preguntas_videocv: [...prev.preguntas_videocv, p] }));
    setPreguntaInput('');
  }

  function eliminarPregunta(idx: number) {
    setForm(prev => ({ ...prev, preguntas_videocv: prev.preguntas_videocv.filter((_, i) => i !== idx) }));
  }

  function whatsappUrl(telefono: string, mensaje: string, candidato: string) {
    const tel = telefono.replace(/\D/g, '');
    const numero = tel.startsWith('54') ? tel : `54${tel}`;
    const intro = `Hola ${candidato}, te contacto desde ${empresa?.nombre || 'nuestra empresa'}. `;
    return `https://wa.me/${numero}?text=${encodeURIComponent(intro + (mensaje || ''))}`;
  }

  const getPipelineInfo = (estado: string) => PIPELINE.find(p => p.estado === estado) || PIPELINE[0];

  const hayFiltrosActivos = filtroEdadMin !== '' || filtroEdadMax !== '' || filtroCiudad !== '' || filtroDocsCompletos;

  const postulanteFiltrados = postulantes
    .filter(p => filtroEstado === 'todos' || p.estado === filtroEstado)
    .filter(p => {
      if (!filtroEdadMin && !filtroEdadMax) return true;
      const edad = calcularEdadNumero(p.usuario.fecha_nacimiento);
      if (edad === null) return filtroEdadMin === '';
      if (filtroEdadMin && edad < parseInt(filtroEdadMin)) return false;
      if (filtroEdadMax && edad > parseInt(filtroEdadMax)) return false;
      return true;
    })
    .filter(p => {
      if (!filtroCiudad) return true;
      const ciudad = extraerCiudad(p.usuario.direccion);
      return ciudad.toLowerCase().includes(filtroCiudad.toLowerCase());
    })
    .filter(p => {
      if (!filtroDocsCompletos) return true;
      if (!ofertaSeleccionada?.docs_requeridos?.length) return true;
      return ofertaSeleccionada.docs_requeridos.every(tipo =>
        p.documentos?.some(d => d.tipo === tipo)
      );
    });

  const conteosPorEstado = PIPELINE.reduce((acc, p) => { acc[p.estado] = postulantes.filter(post => post.estado === p.estado).length; return acc; }, {} as Record<string, number>);

  const tabs = [
    { key: 'ofertas', label: 'Mis ofertas' },
    { key: 'postulantes', label: ofertaSeleccionada ? `Pipeline — ${ofertaSeleccionada.titulo}` : 'Pipeline' },
    { key: 'perfil', label: 'Perfil empresa' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {empresa?.logo_url ? (
              <img src={empresa.logo_url} alt="logo" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{empresa?.nombre?.[0] || 'E'}</div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{empresa?.nombre || 'Panel de empresa'}</h1>
              {empresa?.rubro && <p className="text-sm text-gray-500">{empresa.rubro}</p>}
            </div>
          </div>
          <button onClick={() => setTab('nueva')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Nueva oferta</button>
        </div>

        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-lg p-1 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Ofertas */}
        {tab === 'ofertas' && (
          <div className="space-y-4">
            {ofertas.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400 text-lg mb-4">Todavía no publicaste ninguna oferta</p>
                <button onClick={() => setTab('nueva')} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Publicar primera oferta</button>
              </div>
            ) : (
              ofertas.map(oferta => (
                <div key={oferta.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{oferta.titulo}</h3>
                    <div className="flex gap-3 mt-1 text-sm text-gray-500">
                      {oferta.area && <span>{oferta.area}</span>}
                      {oferta.ciudad && <span>· {oferta.ciudad}</span>}
                      <span>· {oferta.modalidad}</span>
                    </div>
                    {oferta.docs_requeridos?.length > 0 && (
                      <p className="text-xs text-purple-600 mt-1">📋 Requiere: {oferta.docs_requeridos.map(d => DOCS_CONFIG.find(c => c.tipo === d)?.label).join(', ')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{oferta._count.postulaciones}</div>
                      <div className="text-xs text-gray-400">postulantes</div>
                    </div>
                    <button onClick={() => verPostulantes(oferta)} className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Ver pipeline →</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Nueva oferta */}
        {tab === 'nueva' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Nueva oferta de trabajo</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Título *</label>
                <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Descripción *</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Requisitos</label>
                <textarea value={form.requisitos} onChange={e => setForm({ ...form, requisitos: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Área</label>
                  <input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Modalidad</label>
                  <select value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="presencial">Presencial</option>
                    <option value="remoto">Remoto</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Ciudad</label>
                  <input value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Documentos requeridos</label>
                <div className="space-y-2">
                  {DOCS_CONFIG.map(doc => (
                    <label key={doc.tipo} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.docs_requeridos.includes(doc.tipo)} onChange={() => toggleDocRequerido(doc.tipo)} className="w-4 h-4 accent-blue-600" />
                      <span className="text-sm text-gray-700">{doc.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Preguntas para el Video CV</label>
                <p className="text-xs text-gray-400 mb-2">Los candidatos verán estas preguntas al postularse, como guía para su video.</p>
                <div className="flex gap-2 mb-2">
                  <input
                    value={preguntaInput}
                    onChange={e => setPreguntaInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), agregarPregunta())}
                    placeholder="Ej: ¿Cuál es tu experiencia en el rubro?"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={agregarPregunta} className="border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600">
                    <Plus size={16} />
                  </button>
                </div>
                {form.preguntas_videocv.length > 0 && (
                  <div className="space-y-1.5">
                    {form.preguntas_videocv.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                        <span className="text-xs text-blue-700 flex-1">{i + 1}. {p}</span>
                        <button type="button" onClick={() => eliminarPregunta(i)} className="text-blue-400 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Mensaje WhatsApp (opcional)</label>
                <textarea value={form.mensaje_whatsapp} onChange={e => setForm({ ...form, mensaje_whatsapp: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-1">Se enviará: "Hola [nombre], te contacto desde [empresa]. [tu mensaje]"</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={crearOferta} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Publicando...' : 'Publicar oferta'}
                </button>
                <button onClick={() => setTab('ofertas')} className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Pipeline */}
        {tab === 'postulantes' && (
          <div>
            {/* Panel de filtros avanzados */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros</span>
                {hayFiltrosActivos && (
                  <button onClick={limpiarFiltros} className="ml-auto text-xs text-blue-600 hover:underline">
                    Limpiar filtros
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Edad</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number" min="16" max="99" placeholder="Mín"
                      value={filtroEdadMin} onChange={e => setFiltroEdadMin(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 text-xs shrink-0">—</span>
                    <input
                      type="number" min="16" max="99" placeholder="Máx"
                      value={filtroEdadMax} onChange={e => setFiltroEdadMax(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Ciudad</label>
                  <input
                    type="text" placeholder="Ej: Buenos Aires"
                    value={filtroCiudad} onChange={e => setFiltroCiudad(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {(ofertaSeleccionada?.docs_requeridos?.length ?? 0) > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Documentos</label>
                    <label className="flex items-center gap-2 cursor-pointer py-1.5">
                      <input
                        type="checkbox" checked={filtroDocsCompletos}
                        onChange={e => setFiltroDocsCompletos(e.target.checked)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-xs text-gray-700">Solo con docs completos</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap items-center">
              <button onClick={() => setFiltroEstado('todos')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filtroEstado === 'todos' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                Todos ({postulantes.length})
              </button>
              {PIPELINE.map(p => {
                const count = conteosPorEstado[p.estado] || 0;
                if (count === 0) return null;
                return (
                  <button key={p.estado} onClick={() => setFiltroEstado(p.estado)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filtroEstado === p.estado ? 'bg-gray-800 text-white' : `${p.color}`}`}>
                    {p.label} ({count})
                  </button>
                );
              })}
              {(hayFiltrosActivos || filtroEstado !== 'todos') && (
                <span className="ml-auto text-xs text-gray-400">
                  {postulanteFiltrados.length} resultado{postulanteFiltrados.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {postulanteFiltrados.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400">No hay postulantes en este estado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {postulanteFiltrados.map(p => {
                  const pipelineInfo = getPipelineInfo(p.estado);
                  const Icon = pipelineInfo.icon;
                  const edad = calcularEdad(p.usuario.fecha_nacimiento);
                  const ciudad = p.usuario.direccion?.split(',').slice(-2).join(',').trim() || '';
                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative bg-gray-900 aspect-video cursor-pointer" onClick={() => setVideoModal(p)}>
                        <video src={p.video.video_url} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[16px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                          </div>
                        </div>
                        <div className={`absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded-full ${pipelineInfo.color}`}>
                          <Icon size={10} />
                          {pipelineInfo.label}
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900">{p.usuario.nombre_completo}</h3>
                        <div className="flex gap-2 text-xs text-gray-400 mt-1 mb-2">
                          {edad && <span>🎂 {edad}</span>}
                          {ciudad && <span>📍 {ciudad}</span>}
                        </div>
                        {p.usuario.bio && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{p.usuario.bio}</p>}

                        {ofertaSeleccionada?.docs_requeridos?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {ofertaSeleccionada.docs_requeridos.map(tipo => {
                              const tieneDoc = p.documentos?.some(d => d.tipo === tipo);
                              const doc = p.documentos?.find(d => d.tipo === tipo);
                              const label = DOCS_CONFIG.find(c => c.tipo === tipo)?.label || tipo;
                              return (
                                <span key={tipo} className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${tieneDoc ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                  {tieneDoc ? <Check size={10} /> : <X size={10} />}
                                  {tieneDoc && doc ? <a href={doc.file_url} target="_blank" className="hover:underline">{label}</a> : label}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex gap-2 mb-3">
                          <a href={`/u/${p.usuario.slug}/cv`} target="_blank"
                            className="flex-1 text-center border border-blue-200 text-blue-600 py-1.5 rounded-lg text-xs hover:bg-blue-50">Ver perfil</a>
                          {ofertaSeleccionada?.mensaje_whatsapp && (
                            <a href={whatsappUrl(p.usuario.telefono, ofertaSeleccionada.mensaje_whatsapp, p.usuario.nombre_completo)}
                              target="_blank" className="flex-1 text-center bg-green-500 text-white py-1.5 rounded-lg text-xs hover:bg-green-600">
                              📱 WhatsApp
                            </a>
                          )}
                        </div>

                        <select value={p.estado} onChange={e => cambiarEstado(p.id, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {PIPELINE.map(s => <option key={s.estado} value={s.estado}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Perfil */}
        {tab === 'perfil' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Perfil de empresa</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  {empresa?.logo_url ? <img src={empresa.logo_url} alt="logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" /> : <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">🏢</div>}
                  <label className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                    Subir logo
                    <input type="file" accept="image/*" className="hidden" onChange={subirLogo} />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre *</label>
                <input value={perfilForm.nombre} onChange={e => setPerfilForm({ ...perfilForm, nombre: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
                <textarea value={perfilForm.descripcion} onChange={e => setPerfilForm({ ...perfilForm, descripcion: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Rubro</label>
                  <input value={perfilForm.rubro} onChange={e => setPerfilForm({ ...perfilForm, rubro: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Ciudad</label>
                  <input value={perfilForm.ciudad} onChange={e => setPerfilForm({ ...perfilForm, ciudad: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Sitio web</label>
                <input value={perfilForm.sitio_web} onChange={e => setPerfilForm({ ...perfilForm, sitio_web: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={guardarPerfil} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {perfilGuardado ? '✓ Guardado' : loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal video */}
      {videoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setVideoModal(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{videoModal.usuario.nombre_completo}</h3>
                <div className="flex gap-3 text-sm text-gray-500">
                  <span>{videoModal.usuario.email}</span>
                  {calcularEdad(videoModal.usuario.fecha_nacimiento) && <span>· {calcularEdad(videoModal.usuario.fecha_nacimiento)}</span>}
                </div>
              </div>
              <button onClick={() => setVideoModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* Video CV genérico */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Video CV</p>
            <video src={videoModal.video.video_url} controls autoPlay className="w-full rounded-xl mb-4" />

            {/* Video específico (respuestas a preguntas) */}
            {videoModal.usuario.videos?.[0] && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest mb-1">Respuestas a tus preguntas</p>
                <video src={videoModal.usuario.videos[0].video_url} controls className="w-full rounded-xl" />
              </div>
            )}

            {/* CV analizado */}
            {videoModal.usuario.cv_datos && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-widest">CV</p>
                {videoModal.usuario.cv_datos.resumen && (
                  <p className="text-sm text-gray-700 leading-relaxed">{videoModal.usuario.cv_datos.resumen}</p>
                )}
                {(videoModal.usuario.cv_datos.experiencia?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Experiencia</p>
                    <div className="space-y-1">
                      {videoModal.usuario.cv_datos.experiencia!.map((e, i) => (
                        <div key={i} className="text-xs text-gray-600">
                          <span className="font-medium">{e.cargo}</span> — {e.empresa} <span className="text-gray-400">({e.periodo})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(videoModal.usuario.cv_datos.educacion?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Educación</p>
                    {videoModal.usuario.cv_datos.educacion!.map((e, i) => (
                      <div key={i} className="text-xs text-gray-600">
                        <span className="font-medium">{e.titulo}</span> — {e.institucion} <span className="text-gray-400">({e.periodo})</span>
                      </div>
                    ))}
                  </div>
                )}
                {(videoModal.usuario.cv_datos.habilidades?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {videoModal.usuario.cv_datos.habilidades!.map((h, i) => (
                      <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{h}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <a href={`/u/${videoModal.usuario.slug}/cv`} target="_blank"
                className="flex-1 text-center border border-blue-200 text-blue-600 py-2 rounded-lg text-sm hover:bg-blue-50">Ver perfil →</a>
              {ofertaSeleccionada?.mensaje_whatsapp && (
                <a href={whatsappUrl(videoModal.usuario.telefono, ofertaSeleccionada.mensaje_whatsapp, videoModal.usuario.nombre_completo)}
                  target="_blank" className="flex-1 text-center bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600">
                  📱 WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

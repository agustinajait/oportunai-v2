'use client';
import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

const DOCS_CONFIG = [
  { tipo: 'dni', label: 'DNI' },
  { tipo: 'antecedentes_penales', label: 'Antecedentes Penales' },
  { tipo: 'manipulacion_alimentos', label: 'Manip. Alimentos' },
  { tipo: 'libreta_sanitaria', label: 'Libreta Sanitaria' },
  { tipo: 'otro', label: 'Otro documento' },
];

type Oferta = {
  id: string;
  titulo: string;
  area: string | null;
  ciudad: string | null;
  modalidad: string;
  estado: string;
  mensaje_whatsapp: string | null;
  docs_requeridos: string[];
  created_at: string;
  _count: { postulaciones: number };
};

type Postulante = {
  id: string;
  estado: string;
  nota: string | null;
  created_at: string;
  usuario: {
    id: string;
    nombre_completo: string;
    email: string;
    telefono: string;
    slug: string;
    bio: string | null;
  };
  video: { id: string; video_url: string; tipo: string };
  documentos?: { tipo: string; file_url: string }[];
};

type Empresa = {
  id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  descripcion: string | null;
  rubro: string | null;
  ciudad: string | null;
  sitio_web: string | null;
};

export default function EmpresaDashboard() {
  const [tab, setTab] = useState<'ofertas' | 'nueva' | 'postulantes' | 'perfil'>('ofertas');
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [postulantes, setPostulantes] = useState<Postulante[]>([]);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState<Oferta | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false);
  const [perfilGuardado, setPerfilGuardado] = useState(false);

  const [form, setForm] = useState({
    titulo: '', descripcion: '', requisitos: '', area: '',
    modalidad: 'presencial', ciudad: '', mensaje_whatsapp: '',
    docs_requeridos: [] as string[],
  });

  const [perfilForm, setPerfilForm] = useState({
    nombre: '', descripcion: '', rubro: '', ciudad: '', sitio_web: '',
  });

  useEffect(() => {
    cargarOfertas();
    cargarEmpresa();
  }, []);

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
      setPerfilForm({
        nombre: data.empresa.nombre || '',
        descripcion: data.empresa.descripcion || '',
        rubro: data.empresa.rubro || '',
        ciudad: data.empresa.ciudad || '',
        sitio_web: data.empresa.sitio_web || '',
      });
    }
  }

  async function guardarPerfil() {
    setLoading(true);
    await fetch('/api/empresa/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(perfilForm),
    });
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
    if (data.logo_url) {
      setEmpresa(prev => prev ? { ...prev, logo_url: data.logo_url } : prev);
    }
  }

  async function verPostulantes(oferta: Oferta) {
    setOfertaSeleccionada(oferta);
    setTab('postulantes');
    const res = await fetch(`/api/ofertas/${oferta.id}/postulantes`);
    const data = await res.json();
    if (data.postulaciones) {
      // Cargar documentos de cada postulante
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
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postulacion_id, estado }),
    });
    setPostulantes(prev => prev.map(p => p.id === postulacion_id ? { ...p, estado } : p));
  }

  async function crearOferta() {
    setLoading(true);
    const res = await fetch('/api/ofertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.ok) {
      setForm({ titulo: '', descripcion: '', requisitos: '', area: '', modalidad: 'presencial', ciudad: '', mensaje_whatsapp: '', docs_requeridos: [] });
      setTab('ofertas');
      cargarOfertas();
    }
    setLoading(false);
  }

  function toggleDocRequerido(tipo: string) {
    setForm(prev => ({
      ...prev,
      docs_requeridos: prev.docs_requeridos.includes(tipo)
        ? prev.docs_requeridos.filter(d => d !== tipo)
        : [...prev.docs_requeridos, tipo],
    }));
  }

  function whatsappUrl(telefono: string, mensaje: string, candidato: string) {
    const tel = telefono.replace(/\D/g, '');
    const numero = tel.startsWith('54') ? tel : `54${tel}`;
    const intro = `Hola ${candidato}, te contacto desde ${empresa?.nombre || 'nuestra empresa'}. `;
    const texto = intro + (mensaje || '');
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  }

  const estadoColor: Record<string, string> = {
    pendiente: 'bg-gray-100 text-gray-600',
    visto: 'bg-blue-100 text-blue-600',
    interesado: 'bg-green-100 text-green-600',
    descartado: 'bg-red-100 text-red-600',
  };

  const tabs = [
    { key: 'ofertas', label: 'Mis ofertas' },
    { key: 'postulantes', label: ofertaSeleccionada ? `Postulantes — ${ofertaSeleccionada.titulo}` : 'Postulantes' },
    { key: 'perfil', label: 'Perfil empresa' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {empresa?.logo_url ? (
              <img src={empresa.logo_url} alt="logo" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                {empresa?.nombre?.[0] || 'E'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{empresa?.nombre || 'Panel de empresa'}</h1>
              {empresa?.rubro && <p className="text-sm text-gray-500">{empresa.rubro}</p>}
            </div>
          </div>
          <button onClick={() => setTab('nueva')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + Nueva oferta
          </button>
        </div>

        {/* Tabs */}
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
                <button onClick={() => setTab('nueva')} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Publicar primera oferta
                </button>
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
                    <button onClick={() => verPostulantes(oferta)} className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                      Ver postulantes →
                    </button>
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
                <label className="text-sm font-medium text-gray-700 block mb-1">Título del puesto *</label>
                <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Vendedor/a zona norte"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Descripción *</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Describí el puesto, tareas, horario..." rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Requisitos</label>
                <textarea value={form.requisitos} onChange={e => setForm({ ...form, requisitos: e.target.value })}
                  placeholder="Experiencia, estudios, habilidades..." rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Área</label>
                  <input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="Ej: Ventas"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Modalidad</label>
                  <select value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="presencial">Presencial</option>
                    <option value="remoto">Remoto</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Ciudad</label>
                  <input value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} placeholder="Ej: CABA"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Documentos requeridos</label>
                <div className="space-y-2">
                  {DOCS_CONFIG.map(doc => (
                    <label key={doc.tipo} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.docs_requeridos.includes(doc.tipo)}
                        onChange={() => toggleDocRequerido(doc.tipo)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{doc.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Mensaje adicional WhatsApp (opcional)</label>
                <textarea value={form.mensaje_whatsapp} onChange={e => setForm({ ...form, mensaje_whatsapp: e.target.value })}
                  placeholder="Me gustaría coordinar una entrevista..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-1">El mensaje se enviará con: "Hola [nombre], te contacto desde [empresa]. [tu mensaje]"</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={crearOferta} disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {loading ? 'Publicando...' : 'Publicar oferta'}
                </button>
                <button onClick={() => setTab('ofertas')} className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Postulantes */}
        {tab === 'postulantes' && (
          <div className="space-y-4">
            {postulantes.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400">Todavía no hay postulantes para esta oferta</p>
              </div>
            ) : (
              postulantes.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{p.usuario.nombre_completo}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[p.estado]}`}>{p.estado}</span>
                      </div>
                      <p className="text-sm text-gray-500">{p.usuario.email} · {p.usuario.telefono}</p>
                      {p.usuario.bio && <p className="text-sm text-gray-600 mt-2">{p.usuario.bio}</p>}
                      {p.nota && <p className="text-sm text-gray-500 italic mt-2">"{p.nota}"</p>}

                      {/* Checklist de documentos */}
                      {ofertaSeleccionada?.docs_requeridos?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-600 mb-2">Documentos requeridos:</p>
                          <div className="flex flex-wrap gap-2">
                            {ofertaSeleccionada.docs_requeridos.map(tipo => {
                              const tieneDoc = p.documentos?.some(d => d.tipo === tipo);
                              const doc = p.documentos?.find(d => d.tipo === tipo);
                              const label = DOCS_CONFIG.find(c => c.tipo === tipo)?.label || tipo;
                              return (
                                <div key={tipo} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${tieneDoc ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                  {tieneDoc ? <Check size={11} /> : <X size={11} />}
                                  {tieneDoc && doc ? (
                                    <a href={doc.file_url} target="_blank" className="hover:underline">{label}</a>
                                  ) : (
                                    <span>{label}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <a href={`/u/${p.usuario.slug}/cv`} target="_blank"
                        className="border border-blue-200 text-blue-600 px-4 py-1.5 rounded-lg text-sm hover:bg-blue-50 transition-colors text-center">
                        Ver perfil →
                      </a>
                      {ofertaSeleccionada?.mensaje_whatsapp && (
                        <a href={whatsappUrl(p.usuario.telefono, ofertaSeleccionada.mensaje_whatsapp, p.usuario.nombre_completo)}
                          target="_blank"
                          className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-600 transition-colors text-center flex items-center gap-1.5 justify-center">
                          📱 WhatsApp
                        </a>
                      )}
                      <video src={p.video.video_url} controls className="w-48 h-28 rounded-lg object-cover border border-gray-200" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button onClick={() => cambiarEstado(p.id, 'interesado')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${p.estado === 'interesado' ? 'bg-green-600 text-white' : 'border border-green-200 text-green-600 hover:bg-green-50'}`}>
                      ✓ Interesado
                    </button>
                    <button onClick={() => cambiarEstado(p.id, 'visto')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${p.estado === 'visto' ? 'bg-blue-600 text-white' : 'border border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
                      👁 Visto
                    </button>
                    <button onClick={() => cambiarEstado(p.id, 'descartado')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${p.estado === 'descartado' ? 'bg-red-600 text-white' : 'border border-red-200 text-red-600 hover:bg-red-50'}`}>
                      ✕ Descartar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Perfil empresa */}
        {tab === 'perfil' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Perfil de empresa</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  {empresa?.logo_url ? (
                    <img src={empresa.logo_url} alt="logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">🏢</div>
                  )}
                  <label className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                    Subir logo
                    <input type="file" accept="image/*" className="hidden" onChange={subirLogo} />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre de la empresa *</label>
                <input value={perfilForm.nombre} onChange={e => setPerfilForm({ ...perfilForm, nombre: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
                <textarea value={perfilForm.descripcion} onChange={e => setPerfilForm({ ...perfilForm, descripcion: e.target.value })}
                  rows={3} placeholder="Contá de qué se trata tu empresa..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Rubro</label>
                  <input value={perfilForm.rubro} onChange={e => setPerfilForm({ ...perfilForm, rubro: e.target.value })}
                    placeholder="Ej: Tecnología"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Ciudad</label>
                  <input value={perfilForm.ciudad} onChange={e => setPerfilForm({ ...perfilForm, ciudad: e.target.value })}
                    placeholder="Ej: Buenos Aires"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Sitio web</label>
                <input value={perfilForm.sitio_web} onChange={e => setPerfilForm({ ...perfilForm, sitio_web: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={guardarPerfil} disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {perfilGuardado ? '✓ Guardado' : loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

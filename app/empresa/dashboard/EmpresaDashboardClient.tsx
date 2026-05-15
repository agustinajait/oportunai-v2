'use client';
import { useState, useEffect } from 'react';

type Oferta = {
  id: string;
  titulo: string;
  area: string | null;
  ciudad: string | null;
  modalidad: string;
  estado: string;
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
};

export default function EmpresaDashboard() {
  const [tab, setTab] = useState<'ofertas' | 'nueva' | 'postulantes'>('ofertas');
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [postulantes, setPostulantes] = useState<Postulante[]>([]);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState<Oferta | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titulo: '', descripcion: '', requisitos: '', area: '', modalidad: 'presencial', ciudad: '',
  });

  useEffect(() => {
    cargarOfertas();
  }, []);

  async function cargarOfertas() {
    const res = await fetch('/api/empresa/ofertas');
    const data = await res.json();
    if (data.ofertas) setOfertas(data.ofertas);
  }

  async function verPostulantes(oferta: Oferta) {
    setOfertaSeleccionada(oferta);
    setTab('postulantes');
    const res = await fetch(`/api/ofertas/${oferta.id}/postulantes`);
    const data = await res.json();
    if (data.postulaciones) setPostulantes(data.postulaciones);
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
      setForm({ titulo: '', descripcion: '', requisitos: '', area: '', modalidad: 'presencial', ciudad: '' });
      setTab('ofertas');
      cargarOfertas();
    }
    setLoading(false);
  }

  const estadoColor: Record<string, string> = {
    pendiente: 'bg-gray-100 text-gray-600',
    visto: 'bg-blue-100 text-blue-600',
    interesado: 'bg-green-100 text-green-600',
    descartado: 'bg-red-100 text-red-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Panel de empresa</h1>
          <button
            onClick={() => setTab('nueva')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Nueva oferta
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-lg p-1 w-fit">
          {[
            { key: 'ofertas', label: 'Mis ofertas' },
            { key: 'postulantes', label: ofertaSeleccionada ? `Postulantes — ${ofertaSeleccionada.titulo}` : 'Postulantes' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
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
                <button
                  onClick={() => setTab('nueva')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
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
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{oferta._count.postulaciones}</div>
                      <div className="text-xs text-gray-400">postulantes</div>
                    </div>
                    <button
                      onClick={() => verPostulantes(oferta)}
                      className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
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
                <input
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Vendedor/a zona norte"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Descripción *</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Describí el puesto, tareas, horario..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Requisitos</label>
                <textarea
                  value={form.requisitos}
                  onChange={e => setForm({ ...form, requisitos: e.target.value })}
                  placeholder="Experiencia, estudios, habilidades requeridas..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Área</label>
                  <input
                    value={form.area}
                    onChange={e => setForm({ ...form, area: e.target.value })}
                    placeholder="Ej: Ventas"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Modalidad</label>
                  <select
                    value={form.modalidad}
                    onChange={e => setForm({ ...form, modalidad: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="presencial">Presencial</option>
                    <option value="remoto">Remoto</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Ciudad</label>
                  <input
                    value={form.ciudad}
                    onChange={e => setForm({ ...form, ciudad: e.target.value })}
                    placeholder="Ej: CABA"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={crearOferta}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Publicando...' : 'Publicar oferta'}
                </button>
                <button
                  onClick={() => setTab('ofertas')}
                  className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
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
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[p.estado]}`}>
                          {p.estado}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{p.usuario.email} · {p.usuario.telefono}</p>
                      {p.usuario.bio && <p className="text-sm text-gray-600 mt-2">{p.usuario.bio}</p>}
                      {p.nota && <p className="text-sm text-gray-500 italic mt-2">"{p.nota}"</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <a
                        href={`/u/${p.usuario.slug}/cv`}
                        target="_blank"
                        className="border border-blue-200 text-blue-600 px-4 py-1.5 rounded-lg text-sm hover:bg-blue-50 transition-colors text-center"
                      >
                        Ver perfil →
                      </a>
                      <video
                        src={p.video.video_url}
                        controls
                        className="w-48 h-28 rounded-lg object-cover border border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => cambiarEstado(p.id, 'interesado')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        p.estado === 'interesado' ? 'bg-green-600 text-white' : 'border border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      ✓ Interesado
                    </button>
                    <button
                      onClick={() => cambiarEstado(p.id, 'visto')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        p.estado === 'visto' ? 'bg-blue-600 text-white' : 'border border-blue-200 text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      👁 Visto
                    </button>
                    <button
                      onClick={() => cambiarEstado(p.id, 'descartado')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        p.estado === 'descartado' ? 'bg-red-600 text-white' : 'border border-red-200 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      ✕ Descartar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
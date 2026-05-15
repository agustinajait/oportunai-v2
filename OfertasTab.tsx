'use client';
import { useState, useEffect } from 'react';
import { Briefcase, MapPin, Monitor, Building2, ChevronRight, Check } from 'lucide-react';

type Oferta = {
  id: string;
  titulo: string;
  descripcion: string;
  requisitos: string | null;
  area: string | null;
  ciudad: string | null;
  modalidad: string;
  created_at: string;
  empresa: { nombre: string; logo_url: string | null; slug: string };
  _count: { postulaciones: number };
};

type Video = {
  id: string;
  tipo: string;
  video_url: string;
  created_at: string;
};

type Postulacion = {
  id: string;
  oferta_id: string;
  estado: string;
};

export default function OfertasTab({ videos }: { videos: Video[] }) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [aplicando, setAplicando] = useState<string | null>(null);
  const [ofertaDetalle, setOfertaDetalle] = useState<Oferta | null>(null);
  const [videoSeleccionado, setVideoSeleccionado] = useState<string>('');
  const [nota, setNota] = useState('');
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null);

  const videosFinales = videos.filter(v => !v.tipo.includes('fragmento'));

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    const [resOfertas, resPost] = await Promise.all([
      fetch('/api/ofertas'),
      fetch('/api/postulaciones'),
    ]);
    const dataOfertas = await resOfertas.json();
    const dataPost = await resPost.json();
    if (dataOfertas.ofertas) setOfertas(dataOfertas.ofertas);
    if (dataPost.postulaciones) setPostulaciones(dataPost.postulaciones);
    setLoading(false);
  }

  function yaAplicoA(oferta_id: string) {
    return postulaciones.some(p => p.oferta_id === oferta_id);
  }

  async function aplicar() {
    if (!ofertaDetalle || !videoSeleccionado) return;
    setAplicando(ofertaDetalle.id);
    const res = await fetch('/api/postulaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oferta_id: ofertaDetalle.id,
        video_id: videoSeleccionado,
        nota,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setPostulaciones(prev => [...prev, { id: data.postulacion.id, oferta_id: ofertaDetalle.id, estado: 'pendiente' }]);
      setMensaje({ texto: '¡Postulación enviada!', tipo: 'ok' });
      setOfertaDetalle(null);
      setVideoSeleccionado('');
      setNota('');
    } else {
      setMensaje({ texto: data.error || 'Error al postularse', tipo: 'error' });
    }
    setAplicando(null);
    setTimeout(() => setMensaje(null), 3000);
  }

  const modalidadLabel: Record<string, string> = {
    presencial: 'Presencial',
    remoto: 'Remoto',
    hibrido: 'Híbrido',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mensaje && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
          mensaje.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {ofertas.length === 0 ? (
        <div className="text-center py-16 text-ink-400">
          <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay ofertas disponibles por ahora</p>
        </div>
      ) : (
        ofertas.map(oferta => {
          const aplicado = yaAplicoA(oferta.id);
          return (
            <div key={oferta.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={14} className="text-ink-400" />
                    <span className="text-sm text-ink-500">{oferta.empresa.nombre}</span>
                  </div>
                  <h3 className="font-semibold text-ink-900 text-base mb-2">{oferta.titulo}</h3>
                  <p className="text-sm text-ink-500 line-clamp-2 mb-3">{oferta.descripcion}</p>
                  <div className="flex flex-wrap gap-2">
                    {oferta.area && (
                      <span className="bg-brand-50 text-brand-700 text-xs px-2.5 py-1 rounded-full">
                        {oferta.area}
                      </span>
                    )}
                    {oferta.ciudad && (
                      <span className="flex items-center gap-1 text-xs text-ink-400">
                        <MapPin size={11} /> {oferta.ciudad}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-ink-400">
                      <Monitor size={11} /> {modalidadLabel[oferta.modalidad]}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {aplicado ? (
                    <div className="flex items-center gap-1.5 bg-green-50 text-green-600 text-sm font-medium px-4 py-2 rounded-xl">
                      <Check size={14} />
                      Aplicado
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setOfertaDetalle(oferta);
                        setVideoSeleccionado(videosFinales[0]?.id ?? '');
                      }}
                      className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
                    >
                      Aplicar
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Modal de aplicación */}
      {ofertaDetalle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-semibold text-ink-900 text-lg mb-1">Aplicar a {ofertaDetalle.titulo}</h3>
            <p className="text-sm text-ink-500 mb-5">{ofertaDetalle.empresa.nombre}</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-700 block mb-2">
                  Elegí tu Video CV
                </label>
                {videosFinales.length === 0 ? (
                  <div className="bg-amber-50 text-amber-700 text-sm rounded-lg px-3 py-2">
                    Todavía no tenés un Video CV grabado. Grabá uno desde tu dashboard primero.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {videosFinales.map(v => (
                      <label key={v.id} className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${
                        videoSeleccionado === v.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="video"
                          value={v.id}
                          checked={videoSeleccionado === v.id}
                          onChange={() => setVideoSeleccionado(v.id)}
                          className="accent-brand-600"
                        />
                        <div>
                          <div className="text-sm font-medium text-ink-800">
                            {v.tipo === 'video_cv' ? 'Video CV' : 'Video Pitch'}
                          </div>
                          <div className="text-xs text-ink-400">
                            {new Date(v.created_at).toLocaleDateString('es-AR')}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-ink-700 block mb-1">
                  Mensaje para la empresa (opcional)
                </label>
                <textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  placeholder="Contale por qué te interesa el puesto..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={aplicar}
                  disabled={!videoSeleccionado || !!aplicando}
                  className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {aplicando ? 'Enviando...' : 'Enviar postulación'}
                </button>
                <button
                  onClick={() => { setOfertaDetalle(null); setNota(''); }}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-ink-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

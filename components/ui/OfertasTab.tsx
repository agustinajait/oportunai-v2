'use client';
import { useState, useEffect, useRef } from 'react';
import { Briefcase, MapPin, Monitor, Building2, ChevronRight, Check, Clock, Eye, Star, Phone, Users, Trophy, Archive, X, MessageSquare } from 'lucide-react';

type Oferta = {
  id: string;
  titulo: string;
  descripcion: string;
  requisitos: string | null;
  area: string | null;
  ciudad: string | null;
  modalidad: string;
  created_at: string;
  preguntas_videocv: string[];
  empresa: { nombre: string; logo_url: string | null; slug: string };
  _count: { postulaciones: number };
};

type Video = {
  id: string;
  tipo: string;
  video_url: string;
  created_at: string;
  oferta_id?: string | null;
};

type PostulacionCompleta = {
  id: string;
  oferta_id: string;
  estado: string;
  created_at: string;
  nota: string | null;
  oferta: {
    id: string;
    titulo: string;
    ciudad: string | null;
    modalidad: string;
    empresa: { nombre: string; logo_url: string | null };
  };
  video: { id: string; video_url: string; tipo: string };
};

const ESTADO_LABEL: Record<string, { label: string; color: string; icon: any }> = {
  pendiente:      { label: 'En revisión',         color: 'bg-gray-100 text-gray-600',    icon: Clock },
  visto:          { label: 'Visto',               color: 'bg-blue-100 text-blue-600',    icon: Eye },
  interesado:     { label: 'Interesados en vos',  color: 'bg-purple-100 text-purple-600', icon: Star },
  contactar:      { label: 'Te van a contactar',  color: 'bg-yellow-100 text-yellow-700', icon: Phone },
  en_proceso:     { label: 'En proceso',          color: 'bg-orange-100 text-orange-600', icon: Users },
  contratado:     { label: '¡Contratado!',        color: 'bg-green-100 text-green-700',  icon: Trophy },
  bolsa_talentos: { label: 'Bolsa de talentos',   color: 'bg-teal-100 text-teal-600',    icon: Archive },
  descartado:     { label: 'No seleccionado',     color: 'bg-red-100 text-red-500',      icon: X },
};

const modalidadLabel: Record<string, string> = {
  presencial: 'Presencial', remoto: 'Remoto', hibrido: 'Híbrido',
};

export default function OfertasTab({ videos, initialOfertaId }: { videos: Video[]; initialOfertaId?: string }) {
  const [vista, setVista] = useState<'explorar' | 'mis_postulaciones'>('explorar');
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [postulaciones, setPostulaciones] = useState<PostulacionCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [aplicando, setAplicando] = useState<string | null>(null);
  const [ofertaDetalle, setOfertaDetalle] = useState<Oferta | null>(null);
  const [videoSeleccionado, setVideoSeleccionado] = useState<string>('');
  const [nota, setNota] = useState('');
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null);
  const handledInitialOffer = useRef(false);

  const videosFinales = videos.filter(v => !v.tipo.includes('fragmento'));
  const genericoCV = videosFinales.find(v => v.tipo === 'video_cv' && !v.oferta_id) ?? null;
  const videoEspecifico = (ofertaId: string) => videosFinales.find(v => v.oferta_id === ofertaId) ?? null;

  useEffect(() => { cargarDatos(); }, []);

  // Al volver de grabar preguntas: auto-enviar si ya tiene el video específico, o abrir modal
  useEffect(() => {
    if (!initialOfertaId || loading || handledInitialOffer.current) return;
    const oferta = ofertas.find(o => o.id === initialOfertaId);
    if (!oferta) return;
    handledInitialOffer.current = true;
    if (yaAplicoA(oferta.id)) return;
    const tienePreguntas = (oferta.preguntas_videocv?.length ?? 0) > 0;
    const especifico = videoEspecifico(oferta.id);
    if (tienePreguntas && especifico && genericoCV) {
      autoAplicar(oferta);
    } else {
      abrirPostular(oferta);
    }
  }, [initialOfertaId, loading, ofertas]);

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

  function abrirPostular(oferta: Oferta) {
    setOfertaDetalle(oferta);
    setNota('');
    // videoSeleccionado is only used internally now to hold the resolved video id
    setVideoSeleccionado(genericoCV?.id ?? '');
  }

  async function aplicar() {
    if (!ofertaDetalle) return;
    const vid = genericoCV?.id;
    if (!vid) {
      setMensaje({ texto: 'Primero grabá tu Video CV desde "Mi perfil"', tipo: 'error' });
      setTimeout(() => setMensaje(null), 4000);
      return;
    }
    setAplicando(ofertaDetalle.id);
    const res = await fetch('/api/postulaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oferta_id: ofertaDetalle.id, video_id: vid, nota }),
    });
    const data = await res.json();
    if (data.ok) {
      await cargarDatos();
      setMensaje({ texto: '¡Postulación enviada!', tipo: 'ok' });
      setOfertaDetalle(null);
      setNota('');
    } else {
      setMensaje({ texto: data.error || 'Error al postularse', tipo: 'error' });
    }
    setAplicando(null);
    setTimeout(() => setMensaje(null), 3000);
  }

  async function autoAplicar(oferta: Oferta) {
    const vid = genericoCV?.id;
    if (!vid) { abrirPostular(oferta); return; }
    setAplicando(oferta.id);
    const res = await fetch('/api/postulaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oferta_id: oferta.id, video_id: vid, nota: '' }),
    });
    const data = await res.json();
    if (data.ok) {
      await cargarDatos();
      setMensaje({ texto: '¡Postulación enviada!', tipo: 'ok' });
    } else {
      abrirPostular(oferta);
      setMensaje({ texto: data.error || 'Error al postularse', tipo: 'error' });
    }
    setAplicando(null);
    setTimeout(() => setMensaje(null), 4000);
  }

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

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        <button
          onClick={() => setVista('explorar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            vista === 'explorar' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-800'
          }`}
        >
          <Briefcase size={14} />
          Explorar ofertas
        </button>
        <button
          onClick={() => setVista('mis_postulaciones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            vista === 'mis_postulaciones' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-800'
          }`}
        >
          <Check size={14} />
          Mis postulaciones
          {postulaciones.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              vista === 'mis_postulaciones' ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
            }`}>
              {postulaciones.length}
            </span>
          )}
        </button>
      </div>

      {/* Vista: Explorar */}
      {vista === 'explorar' && (
        <>
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
                      <div className="flex items-center gap-2 mb-2">
                        {oferta.empresa.logo_url ? (
                          <img src={oferta.empresa.logo_url} alt={oferta.empresa.nombre} className="w-7 h-7 rounded-lg object-cover border border-gray-100" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center">
                            <Building2 size={14} className="text-brand-600" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-ink-600">{oferta.empresa.nombre}</span>
                      </div>
                      <h3 className="font-semibold text-ink-900 text-base mb-2">{oferta.titulo}</h3>
                      <p className="text-sm text-ink-500 line-clamp-2 mb-3">{oferta.descripcion}</p>
                      <div className="flex flex-wrap gap-2">
                        {oferta.area && (
                          <span className="bg-brand-50 text-brand-700 text-xs px-2.5 py-1 rounded-full">{oferta.area}</span>
                        )}
                        {oferta.ciudad && (
                          <span className="flex items-center gap-1 text-xs text-ink-400">
                            <MapPin size={11} /> {oferta.ciudad}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-ink-400">
                          <Monitor size={11} /> {modalidadLabel[oferta.modalidad]}
                        </span>
                        {oferta.preguntas_videocv?.length > 0 && (
                          <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                            <MessageSquare size={10} /> {oferta.preguntas_videocv.length} pregunta{oferta.preguntas_videocv.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {aplicado ? (
                        <div className="flex items-center gap-1.5 bg-green-50 text-green-600 text-sm font-medium px-4 py-2 rounded-xl">
                          <Check size={14} /> Aplicado
                        </div>
                      ) : (
                        <button
                          onClick={() => abrirPostular(oferta)}
                          className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
                        >
                          Postular <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      {/* Vista: Mis postulaciones */}
      {vista === 'mis_postulaciones' && (
        <>
          {postulaciones.length === 0 ? (
            <div className="text-center py-16 text-ink-400">
              <Check size={40} className="mx-auto mb-3 opacity-30" />
              <p className="mb-2">Todavía no te postulaste a ninguna oferta</p>
              <button onClick={() => setVista('explorar')} className="text-sm text-brand-600 hover:underline">
                Explorar ofertas disponibles →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setVista('explorar')}
                  className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800 font-medium"
                >
                  <Briefcase size={14} /> Explorar más ofertas →
                </button>
              </div>
              {postulaciones.map(post => {
                const estadoInfo = ESTADO_LABEL[post.estado] ?? ESTADO_LABEL.pendiente;
                const Icon = estadoInfo.icon;
                return (
                  <div key={post.id} className="card p-5">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        {post.oferta.empresa.logo_url ? (
                          <img src={post.oferta.empresa.logo_url} alt={post.oferta.empresa.nombre} className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                            <Building2 size={18} className="text-brand-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-ink-900 text-sm">{post.oferta.titulo}</h3>
                            <p className="text-xs text-ink-400 mt-0.5">{post.oferta.empresa.nombre}</p>
                          </div>
                          <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${estadoInfo.color}`}>
                            <Icon size={11} />
                            {estadoInfo.label}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-ink-400">
                          {post.oferta.ciudad && (
                            <span className="flex items-center gap-1"><MapPin size={10} /> {post.oferta.ciudad}</span>
                          )}
                          <span className="flex items-center gap-1"><Monitor size={10} /> {modalidadLabel[post.oferta.modalidad]}</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(post.created_at).toLocaleDateString('es-AR')}</span>
                        </div>
                        {post.nota && (
                          <p className="mt-2 text-xs text-ink-500 bg-ink-50 rounded-lg px-3 py-2 line-clamp-2">
                            "{post.nota}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal de aplicación */}
      {ofertaDetalle && (() => {
        const tienePreguntas = (ofertaDetalle.preguntas_videocv?.length ?? 0) > 0;
        const especifico = videoEspecifico(ofertaDetalle.id);
        const puedeAplicar = !tienePreguntas ? !!genericoCV : (!!especifico && !!genericoCV);

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                {ofertaDetalle.empresa.logo_url ? (
                  <img src={ofertaDetalle.empresa.logo_url} alt={ofertaDetalle.empresa.nombre} className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                    <Building2 size={18} className="text-brand-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-ink-900">{ofertaDetalle.titulo}</h3>
                  <p className="text-sm text-ink-500">{ofertaDetalle.empresa.nombre}</p>
                </div>
              </div>

              {tienePreguntas ? (
                /* ── OFERTA CON PREGUNTAS ESPECÍFICAS ── */
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={14} className="text-purple-500" />
                      <span className="text-sm font-semibold text-purple-800">Esta empresa tiene preguntas específicas</span>
                    </div>
                    <ul className="space-y-1.5 mb-3">
                      {ofertaDetalle.preguntas_videocv.map((pregunta, i) => (
                        <li key={i} className="text-xs text-purple-700 flex gap-2">
                          <span className="font-semibold shrink-0">{i + 1}.</span>
                          <span>{pregunta}</span>
                        </li>
                      ))}
                    </ul>
                    {especifico ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                        <Check size={13} className="text-emerald-500" />
                        Video con respuestas grabado — listo para postularte
                      </div>
                    ) : (
                      <a
                        href={`/dashboard/grabar-oferta?oferta_id=${ofertaDetalle.id}`}
                        className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors w-full"
                      >
                        <MessageSquare size={14} />
                        Grabar mis respuestas para aplicar
                      </a>
                    )}
                  </div>

                  {!genericoCV && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                      También necesitás tener tu Video CV grabado. Grabá uno desde "Mi perfil".
                    </div>
                  )}

                  {puedeAplicar && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-ink-700 block mb-1">Mensaje para la empresa (opcional)</label>
                        <textarea
                          value={nota} onChange={e => setNota(e.target.value)}
                          placeholder="Contale por qué te interesa el puesto..."
                          rows={3}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={aplicar}
                          disabled={!!aplicando}
                          className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                        >
                          {aplicando ? 'Enviando...' : 'Enviar postulación'}
                        </button>
                        <button onClick={() => { setOfertaDetalle(null); setNota(''); }}
                          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-ink-600 hover:bg-gray-50">
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}

                  {!puedeAplicar && (
                    <button onClick={() => { setOfertaDetalle(null); setNota(''); }}
                      className="w-full border border-gray-200 rounded-xl text-sm text-ink-600 py-2.5 hover:bg-gray-50">
                      Volver
                    </button>
                  )}
                </div>
              ) : (
                /* ── OFERTA SIN PREGUNTAS: POSTULACIÓN DIRECTA ── */
                <div className="space-y-4">
                  {!genericoCV ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
                      Primero grabá tu Video CV desde "Mi perfil" para poder postularte.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                      <Check size={13} className="text-emerald-500" />
                      Tu Video CV se adjuntará automáticamente a la postulación
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-ink-700 block mb-1">Mensaje para la empresa (opcional)</label>
                    <textarea
                      value={nota} onChange={e => setNota(e.target.value)}
                      placeholder="Contale por qué te interesa el puesto..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={aplicar}
                      disabled={!genericoCV || !!aplicando}
                      className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                    >
                      {aplicando ? 'Enviando...' : 'Enviar postulación'}
                    </button>
                    <button onClick={() => { setOfertaDetalle(null); setNota(''); }}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-ink-600 hover:bg-gray-50">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

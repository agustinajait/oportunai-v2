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

const ESTADO_LABEL: Record<string, { label: string; bg: string; color: string; icon: any }> = {
  pendiente:      { label: 'En revisión',         bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', icon: Clock },
  visto:          { label: 'Visto',               bg: 'rgba(96,165,250,0.15)',  color: '#93c5fd',               icon: Eye },
  interesado:     { label: 'Interesados en vos',  bg: 'rgba(167,139,250,0.15)', color: '#a78bfa',               icon: Star },
  contactar:      { label: 'Te van a contactar',  bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24',               icon: Phone },
  en_proceso:     { label: 'En proceso',          bg: 'rgba(251,146,60,0.15)',  color: '#fb923c',               icon: Users },
  contratado:     { label: '¡Contratado!',        bg: 'rgba(52,211,153,0.15)',  color: '#34d399',               icon: Trophy },
  bolsa_talentos: { label: 'Bolsa de talentos',   bg: 'rgba(45,212,191,0.15)', color: '#2dd4bf',               icon: Archive },
  descartado:     { label: 'No seleccionado',     bg: 'rgba(248,113,113,0.12)', color: '#f87171',               icon: X },
};

const modalidadLabel: Record<string, string> = {
  presencial: 'Presencial', remoto: 'Remoto', hibrido: 'Híbrido',
};

export default function OfertasTab({ videos, initialOfertaId, origenUsuario }: { videos: Video[]; initialOfertaId?: string; origenUsuario?: string }) {
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
    const ofertasUrl = origenUsuario === 'mentoress'
      ? '/api/ofertas?origen=mentores'
      : '/api/ofertas';
    const [resOfertas, resPost] = await Promise.all([
      fetch(ofertasUrl),
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
        <div
          className="rounded-lg px-4 py-3 text-sm font-medium"
          style={mensaje.tipo === 'ok'
            ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
            : { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }
          }
        >
          {mensaje.texto}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => setVista('explorar')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={vista === 'explorar'
            ? { background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff' }
            : { color: 'rgba(255,255,255,0.5)' }
          }
        >
          <Briefcase size={14} />
          Explorar ofertas
        </button>
        <button
          onClick={() => setVista('mis_postulaciones')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={vista === 'mis_postulaciones'
            ? { background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff' }
            : { color: 'rgba(255,255,255,0.5)' }
          }
        >
          <Check size={14} />
          Mis postulaciones
          {postulaciones.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={vista === 'mis_postulaciones'
                ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                : { background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }
              }
            >
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
                <div key={oferta.id} className="p-5 rounded-2xl transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {oferta.empresa.logo_url ? (
                          <img src={oferta.empresa.logo_url} alt={oferta.empresa.nombre} className="w-7 h-7 rounded-lg object-cover" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                        ) : (
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.2)' }}>
                            <Building2 size={14} color="#a78bfa" />
                          </div>
                        )}
                        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{oferta.empresa.nombre}</span>
                      </div>
                      <h3 className="font-semibold text-base mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>{oferta.titulo}</h3>
                      <p className="text-sm line-clamp-2 mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{oferta.descripcion}</p>
                      <div className="flex flex-wrap gap-2">
                        {oferta.area && (
                          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>{oferta.area}</span>
                        )}
                        {oferta.ciudad && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <MapPin size={11} /> {oferta.ciudad}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <Monitor size={11} /> {modalidadLabel[oferta.modalidad]}
                        </span>
                        {oferta.preguntas_videocv?.length > 0 && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                            <MessageSquare size={10} /> {oferta.preguntas_videocv.length} pregunta{oferta.preguntas_videocv.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {aplicado ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
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
                  <div key={post.id} className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        {post.oferta.empresa.logo_url ? (
                          <img src={post.oferta.empresa.logo_url} alt={post.oferta.empresa.nombre} className="w-10 h-10 rounded-xl object-cover" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                        ) : (
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.2)' }}>
                            <Building2 size={18} color="#a78bfa" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{post.oferta.titulo}</h3>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{post.oferta.empresa.nombre}</p>
                          </div>
                          <span
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                            style={{ background: estadoInfo.bg, color: estadoInfo.color }}
                          >
                            <Icon size={11} />
                            {estadoInfo.label}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {post.oferta.ciudad && (
                            <span className="flex items-center gap-1"><MapPin size={10} /> {post.oferta.ciudad}</span>
                          )}
                          <span className="flex items-center gap-1"><Monitor size={10} /> {modalidadLabel[post.oferta.modalidad]}</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(post.created_at).toLocaleDateString('es-AR')}</span>
                        </div>
                        {post.nota && (
                          <p className="mt-2 text-xs px-3 py-2 rounded-lg line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)' }}>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.1)' }}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                {ofertaDetalle.empresa.logo_url ? (
                  <img src={ofertaDetalle.empresa.logo_url} alt={ofertaDetalle.empresa.nombre} className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.2)' }}>
                    <Building2 size={18} color="#a78bfa" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{ofertaDetalle.titulo}</h3>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{ofertaDetalle.empresa.nombre}</p>
                </div>
              </div>

              {tienePreguntas ? (
                /* ── OFERTA CON PREGUNTAS ESPECÍFICAS ── */
                <div className="space-y-4">
                  <div className="rounded-xl p-4" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={14} color="#a78bfa" />
                      <span className="text-sm font-semibold" style={{ color: '#a78bfa' }}>Esta empresa tiene preguntas específicas</span>
                    </div>
                    <ul className="space-y-1.5 mb-3">
                      {ofertaDetalle.preguntas_videocv.map((pregunta, i) => (
                        <li key={i} className="text-xs flex gap-2" style={{ color: 'rgba(167,139,250,0.85)' }}>
                          <span className="font-semibold shrink-0">{i + 1}.</span>
                          <span>{pregunta}</span>
                        </li>
                      ))}
                    </ul>
                    {especifico ? (
                      <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)' }}>
                        <Check size={13} color="#34d399" />
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
                    <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                      También necesitás tener tu Video CV grabado. Grabá uno desde "Mi perfil".
                    </div>
                  )}

                  {puedeAplicar && (
                    <>
                      <div>
                        <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Mensaje para la empresa (opcional)</label>
                        <textarea
                          value={nota} onChange={e => setNota(e.target.value)}
                          placeholder="Contale por qué te interesa el puesto..."
                          rows={3}
                          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={aplicar}
                          disabled={!!aplicando}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
                          style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}
                        >
                          {aplicando ? 'Enviando...' : 'Enviar postulación'}
                        </button>
                        <button onClick={() => { setOfertaDetalle(null); setNota(''); }}
                          className="px-4 py-2.5 rounded-xl text-sm"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}

                  {!puedeAplicar && (
                    <button onClick={() => { setOfertaDetalle(null); setNota(''); }}
                      className="w-full rounded-xl text-sm py-2.5"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>
                      Volver
                    </button>
                  )}
                </div>
              ) : (
                /* ── OFERTA SIN PREGUNTAS: POSTULACIÓN DIRECTA ── */
                <div className="space-y-4">
                  {!genericoCV ? (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                      Primero grabá tu Video CV desde "Mi perfil" para poder postularte.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)' }}>
                      <Check size={13} color="#34d399" />
                      Tu Video CV se adjuntará automáticamente a la postulación
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Mensaje para la empresa (opcional)</label>
                    <textarea
                      value={nota} onChange={e => setNota(e.target.value)}
                      placeholder="Contale por qué te interesa el puesto..."
                      rows={3}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={aplicar}
                      disabled={!genericoCV || !!aplicando}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
                      style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}
                    >
                      {aplicando ? 'Enviando...' : 'Enviar postulación'}
                    </button>
                    <button onClick={() => { setOfertaDetalle(null); setNota(''); }}
                      className="px-4 py-2.5 rounded-xl text-sm"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>
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

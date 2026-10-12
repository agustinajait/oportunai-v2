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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #7048F0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {mensaje && (
        <div style={{
          borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 500,
          background: mensaje.tipo === 'ok' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
          border: `1px solid ${mensaje.tipo === 'ok' ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
          color: mensaje.tipo === 'ok' ? '#34d399' : '#f87171',
        }}>
          {mensaje.texto}
        </div>
      )}

      {ofertas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'rgba(255,255,255,0.4)' }}>
          <Briefcase size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No hay ofertas disponibles por ahora</p>
        </div>
      ) : (
        ofertas.map(oferta => {
          const aplicado = yaAplicoA(oferta.id);
          return (
            <div key={oferta.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Building2 size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{oferta.empresa.nombre}</span>
                  </div>
                  <h3 style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 8 }}>{oferta.titulo}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{oferta.descripcion}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {oferta.area && (
                      <span style={{ background: 'rgba(109,40,217,0.2)', color: '#a78bfa', fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>
                        {oferta.area}
                      </span>
                    )}
                    {oferta.ciudad && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        <MapPin size={11} /> {oferta.ciudad}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      <Monitor size={11} /> {modalidadLabel[oferta.modalidad]}
                    </span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {aplicado ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(52,211,153,0.15)', color: '#34d399', fontSize: 13, fontWeight: 500, padding: '8px 14px', borderRadius: 12 }}>
                      <Check size={14} />
                      Aplicado
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setOfertaDetalle(oferta);
                        setVideoSeleccionado(videosFinales[0]?.id ?? '');
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }}
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
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) { setOfertaDetalle(null); setNota(''); } }}
        >
          <div style={{ background: '#1a1030', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', maxWidth: 440, width: '100%', padding: 24 }}>
            <h3 style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: 17, marginBottom: 4 }}>Aplicar a {ofertaDetalle.titulo}</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>{ofertaDetalle.empresa.nombre}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>
                  Elegí tu Video CV
                </label>
                {videosFinales.length === 0 ? (
                  <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 13, borderRadius: 10, padding: '8px 12px' }}>
                    Todavía no tenés un Video CV grabado. Grabá uno desde tu dashboard primero.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {videosFinales.map(v => (
                      <label
                        key={v.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          border: `1.5px solid ${videoSeleccionado === v.id ? '#7048F0' : 'rgba(255,255,255,0.12)'}`,
                          background: videoSeleccionado === v.id ? 'rgba(109,40,217,0.15)' : 'rgba(255,255,255,0.04)',
                          borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="video"
                          value={v.id}
                          checked={videoSeleccionado === v.id}
                          onChange={() => setVideoSeleccionado(v.id)}
                          style={{ accentColor: '#7048F0' }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                            {v.tipo === 'video_cv' ? 'Video CV' : 'Video Pitch'}
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                            {new Date(v.created_at).toLocaleDateString('es-AR')}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>
                  Mensaje para la empresa (opcional)
                </label>
                <textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  placeholder="Contale por qué te interesa el puesto..."
                  rows={3}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: 'rgba(255,255,255,0.85)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button
                  onClick={aplicar}
                  disabled={!videoSeleccionado || !!aplicando}
                  style={{ flex: 1, background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff', padding: '11px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: (!videoSeleccionado || !!aplicando) ? 'not-allowed' : 'pointer', opacity: (!videoSeleccionado || !!aplicando) ? 0.5 : 1, boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }}
                >
                  {aplicando ? 'Enviando...' : 'Enviar postulación'}
                </button>
                <button
                  onClick={() => { setOfertaDetalle(null); setNota(''); }}
                  style={{ padding: '11px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
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

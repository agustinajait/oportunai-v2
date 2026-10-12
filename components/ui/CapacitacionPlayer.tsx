'use client';

import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Star, Play, AlertCircle } from 'lucide-react';

interface Capacitacion {
  id: string;
  titulo: string;
  descripcion: string | null;
  video_url: string;
  pregunta: string;
  opciones: string[];
  empresa: { nombre: string };
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]{11})/);
  return m ? m[1] : null;
}

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

export default function CapacitacionPlayer({
  cap, onClose, onCompleted,
}: {
  cap: Capacitacion;
  onClose: () => void;
  onCompleted: (id: string) => void;
}) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxProgressRef = useRef(0);
  const prevTimeRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [quizUnlocked, setQuizUnlocked] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const videoId = getYouTubeId(cap.video_url);

  useEffect(() => {
    if (!videoId) return;

    function initPlayer() {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              intervalRef.current = setInterval(() => {
                const p = playerRef.current;
                if (!p) return;
                const dur = p.getDuration();
                const cur = p.getCurrentTime();
                if (dur > 0) {
                  const pct = Math.round((cur / dur) * 100);
                  setProgress(pct);
                  const delta = cur - prevTimeRef.current;
                  if (delta > 0 && delta <= 2) {
                    if (pct > maxProgressRef.current) maxProgressRef.current = pct;
                    if (maxProgressRef.current >= 80) setQuizUnlocked(true);
                  }
                  prevTimeRef.current = cur;
                }
              }, 1000);
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [videoId]);

  async function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
    setSaving(true);
    const res = await fetch(`/api/capacitaciones/${cap.id}/completar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respuesta: selected }),
    });
    setSaving(false);
    if (res.ok) {
      setCorrect(true);
      setTimeout(() => { setDone(true); onCompleted(cap.id); }, 1200);
    } else {
      setCorrect(false);
      setTimeout(() => { setSubmitted(false); setSelected(null); setCorrect(null); }, 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#1a1030', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: '#a78bfa' }}>{cap.empresa.nombre}</p>
            <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{cap.titulo}</h2>
            {cap.descripcion && <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{cap.descripcion}</p>}
          </div>
          <button onClick={onClose} className="ml-4 flex-shrink-0 transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(251,191,36,0.15)' }}>
              <Star size={40} color="#fbbf24" fill="#fbbf24" />
            </div>
            <h3 className="text-2xl font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>¡Capacitación completada!</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>Sumaste una estrella a tu perfil. Las empresas pueden ver tus capacitaciones completadas.</p>
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 14px rgba(109,40,217,0.35)' }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-5">

            {/* Video */}
            {videoId ? (
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <div ref={containerRef} className="w-full h-full" />
              </div>
            ) : (
              <div className="aspect-video rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Video no disponible</p>
              </div>
            )}

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Progreso del video</span>
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#4B33CC,#7048F0)' }}
                />
              </div>
              {!quizUnlocked && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Play size={11} /> La pregunta se desbloquea cuando veas el 80% del video
                </p>
              )}
            </div>

            {/* Quiz */}
            <div className={`space-y-3 transition-opacity duration-300 ${quizUnlocked ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Pregunta de verificación</p>
                <p className="font-medium mb-3" style={{ color: 'rgba(255,255,255,0.85)' }}>{cap.pregunta}</p>
                <div className="space-y-2">
                  {cap.opciones.map((op, i) => {
                    let bg = 'rgba(255,255,255,0.05)';
                    let border = 'rgba(255,255,255,0.12)';
                    let color = 'rgba(255,255,255,0.75)';
                    if (submitted && correct && selected === i) {
                      bg = 'rgba(52,211,153,0.1)'; border = '#34d399'; color = '#34d399';
                    } else if (submitted && !correct && selected === i) {
                      bg = 'rgba(248,113,113,0.1)'; border = '#f87171'; color = '#f87171';
                    } else if (selected === i) {
                      bg = 'rgba(112,72,240,0.15)'; border = '#7048F0'; color = '#a78bfa';
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => !submitted && setSelected(i)}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                        style={{ background: bg, border: `1px solid ${border}`, color }}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                        {op}
                      </button>
                    );
                  })}
                </div>

                {submitted && correct === false && (
                  <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 mt-2" style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                    <AlertCircle size={14} /> Respuesta incorrecta. Volvé a ver el video e intentá de nuevo.
                  </div>
                )}
                {submitted && correct === true && (
                  <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 mt-2" style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <CheckCircle2 size={14} /> ¡Correcto! Guardando...
                  </div>
                )}

                {!submitted && (
                  <button
                    onClick={handleSubmit}
                    disabled={selected === null || saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white mt-3 disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }}
                  >
                    {saving
                      ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      : <CheckCircle2 size={16} />
                    }
                    Confirmar respuesta
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

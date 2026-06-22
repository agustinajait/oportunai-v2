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
                  if (pct >= 80) setQuizUnlocked(true);
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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <p className="text-xs text-brand-600 font-medium mb-0.5">{cap.empresa.nombre}</p>
            <h2 className="font-display text-lg font-semibold text-ink-900">{cap.titulo}</h2>
            {cap.descripcion && <p className="text-sm text-ink-400 mt-0.5">{cap.descripcion}</p>}
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-600 transition-colors ml-4 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Star size={40} className="text-amber-500" fill="currentColor" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-ink-900">¡Capacitación completada!</h3>
            <p className="text-ink-500">Sumaste una estrella a tu perfil. Las empresas pueden ver tus capacitaciones completadas.</p>
            <button onClick={onClose} className="btn-primary justify-center px-8">Cerrar</button>
          </div>
        ) : (
          <div className="p-5 space-y-5">

            {/* Video */}
            {videoId ? (
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <div ref={containerRef} className="w-full h-full" />
              </div>
            ) : (
              <div className="aspect-video bg-ink-900 rounded-xl flex items-center justify-center">
                <p className="text-white/40 text-sm">Video no disponible</p>
              </div>
            )}

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-ink-400">Progreso del video</span>
                <span className="text-xs font-medium text-ink-600">{progress}%</span>
              </div>
              <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {!quizUnlocked && (
                <p className="text-xs text-ink-300 mt-1.5 flex items-center gap-1">
                  <Play size={11} /> La pregunta se desbloquea cuando veas el 80% del video
                </p>
              )}
            </div>

            {/* Quiz */}
            <div className={`space-y-3 transition-opacity duration-300 ${quizUnlocked ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <div className="border-t border-ink-100 pt-4">
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-2">Pregunta de verificación</p>
                <p className="font-medium text-ink-800 mb-3">{cap.pregunta}</p>
                <div className="space-y-2">
                  {cap.opciones.map((op, i) => (
                    <button
                      key={i}
                      onClick={() => !submitted && setSelected(i)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        submitted && correct && selected === i
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                          : submitted && !correct && selected === i
                          ? 'bg-red-50 border-red-400 text-red-700'
                          : selected === i
                          ? 'bg-brand-50 border-brand-400 text-brand-800'
                          : 'bg-white border-ink-200 text-ink-700 hover:border-brand-300'
                      }`}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                      {op}
                    </button>
                  ))}
                </div>

                {submitted && correct === false && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">
                    <AlertCircle size={14} /> Respuesta incorrecta. Volvé a ver el video e intentá de nuevo.
                  </div>
                )}
                {submitted && correct === true && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 mt-2">
                    <CheckCircle2 size={14} /> ¡Correcto! Guardando...
                  </div>
                )}

                {!submitted && (
                  <button
                    onClick={handleSubmit}
                    disabled={selected === null || saving}
                    className="btn-primary w-full justify-center mt-3 disabled:opacity-40"
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

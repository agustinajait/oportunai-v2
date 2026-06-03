'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  Video, Mic, Circle, Square,
  ChevronRight, CheckCircle, AlertCircle, Loader2,
  ArrowLeft, Clock, SkipForward
} from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Modulo {
  id: string;
  nombre_modulo: string;
  duracion_base: number;
  texto_guia: string;
  orden: number;
}

type Stage = 'preview' | 'countdown' | 'recording' | 'between' | 'uploading' | 'done' | 'error';

export default function VideoRecorder({
  modulos,
  session,
  tipo,
  tallerId,
  tallerNombre,
  ofertaId,
  ofertaNombre,
}: {
  modulos: Modulo[];
  session: SessionPayload;
  tipo: 'video_cv' | 'video_pitch';
  tallerId?: string;
  tallerNombre?: string;
  ofertaId?: string;
  ofertaNombre?: string;
}) {
  const router = useRouter();
  const tituloVideo = tipo === 'video_cv' ? 'Video CV' : 'Video Pitch';

  const [stage, setStage] = useState<Stage>('preview');
  const [moduloIdx, setModuloIdx] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastBlobRef = useRef<Blob | null>(null);
  const isAdvancingRef = useRef(false);
  const handleModuleEndRef = useRef<() => void>(() => {});

  const [camError, setCamError] = useState<string | null>(null);

  const modulo = modulos[moduloIdx];
  const totalModulos = modulos.length;
  const efectivaDuration = modulo?.duracion_base ?? 0;

  const timerColor =
    timeLeft > efectivaDuration * 0.4 ? 'text-emerald-400' :
    timeLeft > efectivaDuration * 0.2 ? 'text-amber-400' : 'text-red-400';

  const progressPct = modulo ? ((efectivaDuration - timeLeft) / efectivaDuration) * 100 : 0;

  // ── Cámara ────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
        }
      } catch (err: any) {
        setCamError(
          err.name === 'NotAllowedError'
            ? 'Permiso de cámara/micrófono denegado.'
            : 'No se pudo acceder a la cámara: ' + err.message
        );
      }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Countdown ─────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'countdown') return;
    if (countdown === 0) { beginRecording(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown]);

  // ── Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'recording') return;
    setTimeLeft(efectivaDuration);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleModuleEndRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [stage, moduloIdx, efectivaDuration]);

  // ── Upload ────────────────────────────────────────────────────────
  const processAndUpload = useCallback(async (blob: Blob) => {
    try {
      setUploadProgress('Subiendo video...');
      const mimeType = blob.type || 'video/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const filename = `${session.userId}/${tipo}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from('videos')
        .upload(filename, blob, { contentType: mimeType, upsert: true });

      if (error) throw new Error(error.message);

      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filename);

      setUploadProgress('Guardando en base de datos...');

      const res = await fetch('/api/videos/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          video_url: urlData.publicUrl,
          ...(tallerId ? { taller_id: tallerId } : {}),
          ...(ofertaId ? { oferta_id: ofertaId } : {}),
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Error al guardar el video');
      }

      setStage('done');
    } catch (err: any) {
      setUploadError(err.message);
      setStage('error');
    }
  }, [session.userId, tipo, tallerId, ofertaId]);

  // ── Finalizar grabación ───────────────────────────────────────────
  const finalizeRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      lastBlobRef.current = blob;
      setStage('uploading');
      processAndUpload(blob);
    };
    recorder.stop();
  }, [processAndUpload]);

  // ── Avanzar módulo o finalizar ────────────────────────────────────
  const handleModuleEnd = useCallback(() => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    clearInterval(timerRef.current!);
    const nextIdx = moduloIdx + 1;

    if (nextIdx >= totalModulos) {
      finalizeRecording();
    } else {
      // Pausar grabación durante la pantalla entre módulos
      const recorder = recorderRef.current;
      if (recorder && recorder.state === 'recording') {
        recorder.pause();
      }
      setModuloIdx(nextIdx);
      setStage('between');
    }
  }, [moduloIdx, totalModulos, finalizeRecording]);

  // Keep ref updated to avoid stale closure in timer
  useEffect(() => { handleModuleEndRef.current = handleModuleEnd; }, [handleModuleEnd]);

  // ── Comenzar / retomar grabación ──────────────────────────────────
  const beginRecording = useCallback(() => {
    if (!streamRef.current) return;
    isAdvancingRef.current = false;

    const recorder = recorderRef.current;

    // Módulo siguiente: reanudar MediaRecorder pausado
    if (recorder && recorder.state === 'paused') {
      recorder.resume();
      setStage('recording');
      return;
    }

    // Primer módulo: crear nuevo MediaRecorder
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
    const newRecorder = new MediaRecorder(streamRef.current, { mimeType });
    newRecorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    newRecorder.start(250);
    recorderRef.current = newRecorder;
    setStage('recording');
  }, []);

  const startNextModulo = () => {
    setCountdown(3);
    setStage('countdown');
  };

  const restart = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    isAdvancingRef.current = false;
    setModuloIdx(0);
    setCountdown(3);
    setUploadError(null);
    setUploadProgress('');
    setStage('preview');
  };

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen bg-ink-900 flex flex-col overflow-hidden">

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 bg-ink-900/80 backdrop-blur border-b border-white/10 flex-shrink-0">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${tipo === 'video_cv' ? 'bg-brand-600' : 'bg-emerald-600'}`}>
            {tipo === 'video_cv' ? <Video size={13} className="text-white" /> : <Mic size={13} className="text-white" />}
          </div>
          <span className="text-white font-medium text-sm">{tituloVideo}</span>
          {(tallerNombre || ofertaNombre) && <p className="text-white/40 text-xs">{tallerNombre ?? ofertaNombre}</p>}
        </div>
        {stage === 'recording' ? (
          <div className="flex items-center gap-1.5 text-red-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            REC
          </div>
        ) : <div className="w-16" />}
      </div>

      {/* ERROR DE CÁMARA */}
      {camError && (
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <p className="text-white font-medium mb-2">Sin acceso a la cámara</p>
          <p className="text-white/50 text-sm max-w-sm mb-6">{camError}</p>
          <button onClick={() => router.push('/dashboard')} className="btn-secondary text-sm">
            Volver al dashboard
          </button>
        </div>
      )}

      {!camError && (
        <div className="relative flex-1 overflow-hidden">

          {/* VIDEO */}
          {(stage !== 'uploading' && stage !== 'done' && stage !== 'error') && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          )}

          {/* Overlay oscuro */}
          {(stage === 'preview' || stage === 'between' || stage === 'countdown') && (
            <div className="absolute inset-0 bg-black/50 z-10" />
          )}

          {/* PREVIEW */}
          {stage === 'preview' && modulo && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
              <div className="bg-black/70 backdrop-blur rounded-3xl p-8 max-w-sm w-full">
                <p className="text-white/50 text-sm mb-1">{tituloVideo} · {totalModulos} módulos</p>
                <h2 className="font-display text-2xl font-semibold text-white mb-6">¿Listo para grabar?</h2>
                <div className="space-y-2 mb-6 text-left">
                  {modulos.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-brand-600/30 border border-brand-500/50 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-white/70">{m.nombre_modulo}</span>
                      <span className="text-white/30 ml-auto">{m.duracion_base}s</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setCountdown(3); setStage('countdown'); }}
                  className="btn-primary w-full justify-center text-base py-3.5 rounded-2xl"
                >
                  <Circle size={18} /> Comenzar
                </button>
              </div>
            </div>
          )}

          {/* COUNTDOWN */}
          {stage === 'countdown' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
              <p className="text-white/60 text-sm mb-4 font-medium uppercase tracking-widest">
                Módulo {moduloIdx + 1}/{totalModulos} · {modulo?.nombre_modulo}
              </p>
              <div key={countdown} className="text-9xl font-display font-bold text-white" style={{ animation: 'scaleIn 0.3s ease' }}>
                {countdown === 0 ? '¡Ya!' : countdown}
              </div>
            </div>
          )}

          {/* GRABANDO */}
          {stage === 'recording' && modulo && (
            <div className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none">
              <div className="m-4 bg-black/70 backdrop-blur-sm rounded-2xl px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-brand-400 text-xs font-semibold uppercase tracking-widest">
                    {moduloIdx + 1}/{totalModulos} · {modulo.nombre_modulo}
                  </span>
                  <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timerColor}`}>
                    <Clock size={16} /> {timeLeft}s
                  </div>
                </div>
                <p className="text-white text-sm leading-relaxed font-medium">{modulo.texto_guia}</p>
                <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${tipo === 'video_cv' ? 'bg-brand-500' : 'bg-emerald-500'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pb-4">
                {modulos.map((_, i) => (
                  <div key={i} className={`rounded-full transition-all ${
                    i < moduloIdx ? 'w-2 h-2 bg-brand-400' :
                    i === moduloIdx ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/20'
                  }`} />
                ))}
              </div>

              <div className="mx-4 mb-6 flex gap-3 pointer-events-auto">
                <button
                  onClick={() => handleModuleEnd()}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-medium py-4 rounded-2xl transition-colors border border-white/20"
                >
                  <SkipForward size={18} /> {moduloIdx + 1 < totalModulos ? 'Siguiente módulo' : 'Finalizar'}
                </button>
                <button
                  onClick={() => handleModuleEnd()}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors flex-shrink-0"
                >
                  <Square size={22} className="text-white" fill="white" />
                </button>
              </div>
            </div>
          )}

          {/* ENTRE MÓDULOS */}
          {stage === 'between' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
              <div className="bg-black/70 backdrop-blur rounded-3xl p-8 max-w-sm w-full">
                <CheckCircle size={40} className="text-emerald-400 mx-auto mb-4" />
                <p className="text-emerald-400 text-sm font-semibold mb-1 uppercase tracking-widest">
                  Módulo {moduloIdx}/{totalModulos} completado
                </p>
                <h3 className="font-display text-xl font-semibold text-white mb-3">
                  {modulos[moduloIdx - 1]?.nombre_modulo} ✓
                </h3>
                <div className="bg-white/5 rounded-xl px-4 py-3 mb-6 text-left">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Próximo</p>
                  <p className="text-white font-medium">{modulos[moduloIdx]?.nombre_modulo}</p>
                  <p className="text-white/40 text-xs mt-0.5">{modulos[moduloIdx]?.duracion_base}s</p>
                </div>
                <button onClick={startNextModulo} className="btn-primary w-full justify-center py-3.5 rounded-2xl">
                  Continuar <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* UPLOADING */}
          {stage === 'uploading' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center bg-ink-900">
              <div className="w-20 h-20 rounded-full bg-brand-600/20 flex items-center justify-center mb-6">
                <Loader2 size={36} className="text-brand-400 animate-spin" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-white mb-2">Procesando...</h2>
              <p className="text-white/50 text-sm max-w-xs mb-4">{uploadProgress}</p>
              <p className="text-white/30 text-xs">No cierres esta pantalla</p>
            </div>
          )}

          {/* DONE */}
          {stage === 'done' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center bg-ink-900">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-emerald-400" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-white mb-2">¡{tituloVideo} grabado!</h2>
              <p className="text-white/50 text-sm max-w-sm mb-8">Tu video está listo y ya podés compartirlo.</p>
              <div className="space-y-3 w-full max-w-xs">
                <button
                  onClick={() => router.push(ofertaId ? `/dashboard?tab=ofertas&oferta_id=${ofertaId}` : '/dashboard')}
                  className="btn-primary w-full justify-center py-3.5 rounded-2xl"
                >
                  {ofertaId ? 'Volver y postularme' : 'Ver mi dashboard'}
                </button>
                <button onClick={restart} className="w-full text-white/50 hover:text-white text-sm py-2.5 transition-colors">
                  Volver a grabar
                </button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {stage === 'error' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center bg-ink-900">
              <AlertCircle size={48} className="text-red-400 mb-4" />
              <h2 className="font-display text-xl font-semibold text-white mb-2">Error al subir</h2>
              <p className="text-white/50 text-sm mb-6">{uploadError}</p>
              <button
                onClick={() => lastBlobRef.current && processAndUpload(lastBlobRef.current)}
                className="btn-primary justify-center"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(1.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  Video, Mic, Circle, Square, ChevronRight, CheckCircle, AlertCircle,
  Loader2, ArrowLeft, Clock, SkipForward, RotateCcw
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

type Stage = 'preview' | 'countdown' | 'recording' | 'section_review' | 'between' | 'uploading' | 'done' | 'error';

let sharedAudioCtx: AudioContext | null = null;

function playBeep(freq = 660, duration = 0.12, vol = 0.25) {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContext();
    }
    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function getMimeType(): string {
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) return 'video/webm;codecs=vp9,opus';
  if (MediaRecorder.isTypeSupported('video/webm')) return 'video/webm';
  return 'video/mp4';
}

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
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [sectionAttempts, setSectionAttempts] = useState<number[]>(modulos.map(() => 0));
  const [camError, setCamError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const confirmedBlobsRef = useRef<Blob[]>([]);
  const currentBlobRef = useRef<Blob | null>(null);
  const sectionAttemptsRef = useRef<number[]>(modulos.map(() => 0));
  const moduloIdxRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sectionEndCalledRef = useRef(false);

  useEffect(() => { moduloIdxRef.current = moduloIdx; }, [moduloIdx]);

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

  // ── Cleanup review URL ────────────────────────────────────────────
  useEffect(() => {
    return () => { if (reviewUrl) URL.revokeObjectURL(reviewUrl); };
  }, [reviewUrl]);

  // ── Countdown ─────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'countdown') return;
    if (countdown === 0) { beginSectionRecording(); return; }
    playBeep(countdown === 1 ? 880 : 440, 0.1, 0.2);
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown]);

  // ── Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'recording') return;
    sectionEndCalledRef.current = false;
    setTimeLeft(efectivaDuration);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          endCurrentSection();
          return 0;
        }
        if (prev <= 4) playBeep(440, 0.08, 0.15);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [stage, moduloIdx, efectivaDuration]);

  // ── Iniciar grabación de la sección actual ────────────────────────
  const beginSectionRecording = useCallback(() => {
    if (!streamRef.current) return;

    const idx = moduloIdxRef.current;
    const newAttempts = [...sectionAttemptsRef.current];
    newAttempts[idx] = (newAttempts[idx] ?? 0) + 1;
    sectionAttemptsRef.current = newAttempts;
    setSectionAttempts([...newAttempts]);

    sectionEndCalledRef.current = false;
    chunksRef.current = [];
    const mimeType = getMimeType();
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    const finishSection = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      currentBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      setReviewUrl(url);
      setStage('section_review');
    };
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = finishSection;
    recorder.onerror = (e) => {
      console.error('MediaRecorder error', e);
      finishSection();
    };
    recorder.start(250);
    recorderRef.current = recorder;
    playBeep(880, 0.15, 0.3);
    setStage('recording');
  }, []);

  // ── Terminar sección (tiempo o botón) ─────────────────────────────
  const endCurrentSection = useCallback(() => {
    if (sectionEndCalledRef.current) return;
    sectionEndCalledRef.current = true;
    clearInterval(timerRef.current!);
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    // Salvaguarda: si el navegador no dispara onstop/ondataavailable a tiempo
    // (se ha visto en algunas versiones de Chrome con streams reusados),
    // forzamos el avance con lo que se haya capturado hasta ese momento.
    const fallback = setTimeout(() => {
      if (currentBlobRef.current) return; // onstop ya corrió
      const mimeType = recorder.mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      currentBlobRef.current = blob;
      setReviewUrl(URL.createObjectURL(blob));
      setStage('section_review');
    }, 2500);
    const originalOnStop = recorder.onstop;
    recorder.onstop = (ev) => {
      clearTimeout(fallback);
      if (typeof originalOnStop === 'function') (originalOnStop as any).call(recorder, ev);
    };
    recorder.stop();
  }, []);

  // ── Regrabar la misma sección ─────────────────────────────────────
  const handleRegrabar = useCallback(() => {
    currentBlobRef.current = null;
    setReviewUrl(null);
    setCountdown(3);
    setStage('countdown');
  }, []);

  // ── Upload del video final ────────────────────────────────────────
  const uploadFinalVideo = useCallback(async () => {
    try {
      setStage('uploading');
      setUploadProgress('Procesando video...');

      const blobs = confirmedBlobsRef.current.filter((b): b is Blob => b instanceof Blob);
      if (blobs.length === 0) throw new Error('No hay video para subir');

      const mimeType = blobs[0].type ?? 'video/webm';
      const finalBlob = new Blob(blobs, { type: mimeType });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const filename = `${session.userId}/${tipo}-${Date.now()}.${ext}`;

      setUploadProgress('Subiendo video...');
      const { error } = await supabase.storage
        .from('videos')
        .upload(filename, finalBlob, { contentType: mimeType, upsert: true });

      if (error) throw new Error(error.message);

      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filename);

      setUploadProgress('Guardando...');
      const attempts = sectionAttemptsRef.current;
      const sectionData = modulos.map((m, i) => ({
        nombre: m.nombre_modulo,
        intentos: attempts[i] ?? 1,
      }));

      const res = await fetch('/api/videos/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          video_url: urlData.publicUrl,
          section_attempts: sectionData,
          restart_count: 0,
          ...(tallerId ? { taller_id: tallerId } : {}),
          ...(ofertaId ? { oferta_id: ofertaId } : {}),
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Error al guardar el video');
      }

      playBeep(880, 0.3, 0.3);
      setStage('done');
    } catch (err: any) {
      setUploadError(err.message);
      setStage('error');
    }
  }, [session.userId, tipo, tallerId, ofertaId, modulos]);

  // ── Confirmar sección y avanzar ───────────────────────────────────
  const handleContinuar = useCallback(async () => {
    const blob = currentBlobRef.current;
    if (!blob) return;

    confirmedBlobsRef.current[moduloIdx] = blob;
    currentBlobRef.current = null;
    setReviewUrl(null);

    const nextIdx = moduloIdx + 1;
    if (nextIdx >= totalModulos) {
      await uploadFinalVideo();
    } else {
      setModuloIdx(nextIdx);
      setStage('between');
    }
  }, [moduloIdx, totalModulos, uploadFinalVideo]);

  // ── Empezar de cero ───────────────────────────────────────────────
  const restart = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    confirmedBlobsRef.current = [];
    currentBlobRef.current = null;
    sectionAttemptsRef.current = modulos.map(() => 0);
    setReviewUrl(null);
    setModuloIdx(0);
    setCountdown(3);
    setUploadError(null);
    setUploadProgress('');
    setSectionAttempts(modulos.map(() => 0));
    setStage('preview');
  }, [modulos]);

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
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> REC
          </div>
        ) : <div className="w-16" />}
      </div>

      {/* ERROR DE CÁMARA */}
      {camError && (
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <p className="text-white font-medium mb-2">Sin acceso a la cámara</p>
          <p className="text-white/50 text-sm max-w-sm mb-6">{camError}</p>
          <button onClick={() => router.push('/dashboard')} className="btn-secondary text-sm">Volver al dashboard</button>
        </div>
      )}

      {!camError && (
        <div className="relative flex-1 overflow-hidden bg-black">

          {/* CÁMARA EN VIVO — visible excepto en section_review y estados finales */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              stage === 'section_review' || stage === 'uploading' || stage === 'done' || stage === 'error'
                ? 'opacity-0 pointer-events-none'
                : 'opacity-100'
            }`}
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* VIDEO GRABADO — reemplaza la cámara en section_review */}
          {stage === 'section_review' && reviewUrl && (
            <video
              src={reviewUrl}
              autoPlay
              playsInline
              controls
              className="absolute inset-0 w-full h-full object-cover bg-black"
            />
          )}

          {/* Overlay oscuro */}
          {(stage === 'preview' || stage === 'between' || stage === 'countdown') && (
            <div className="absolute inset-0 bg-black/60 z-10" />
          )}

          {/* ── PREVIEW INICIAL ─────────────────────────────────────── */}
          {stage === 'preview' && modulo && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
              <div className="bg-black/80 backdrop-blur rounded-3xl p-8 max-w-sm w-full">
                <p className="text-white/50 text-sm mb-1">{tituloVideo} · {totalModulos} secciones</p>
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
                <p className="text-white/40 text-xs mb-5">Después de cada sección podrás ver tu grabación y decidir si la repetís.</p>
                <button
                  onClick={() => { setCountdown(3); setStage('countdown'); }}
                  className="btn-primary w-full justify-center text-base py-3.5 rounded-2xl"
                >
                  <Circle size={18} /> Comenzar
                </button>
              </div>
            </div>
          )}

          {/* ── COUNTDOWN ───────────────────────────────────────────── */}
          {stage === 'countdown' && modulo && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6">
              <div className="w-full max-w-sm mb-8 bg-brand-600/90 backdrop-blur rounded-2xl px-6 py-5 text-center">
                <p className="text-brand-200 text-xs font-semibold uppercase tracking-widest mb-2">
                  Sección {moduloIdx + 1}/{totalModulos} · {modulo.nombre_modulo}
                </p>
                <p className="text-white text-xl font-semibold leading-snug">{modulo.texto_guia}</p>
              </div>
              <div
                key={countdown}
                className="text-9xl font-display font-bold text-white drop-shadow-lg"
                style={{ animation: 'scaleIn 0.3s ease' }}
              >
                {countdown === 0 ? '¡Ya!' : countdown}
              </div>
            </div>
          )}

          {/* ── GRABANDO ────────────────────────────────────────────── */}
          {stage === 'recording' && modulo && (
            <div className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none">
              <div className="m-4 bg-black/75 backdrop-blur-sm rounded-2xl px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-brand-400 text-xs font-semibold uppercase tracking-widest">
                    {moduloIdx + 1}/{totalModulos} · {modulo.nombre_modulo}
                  </span>
                  <div className={`flex items-center gap-1.5 font-mono font-bold text-xl ${timerColor}`}>
                    <Clock size={16} /> {timeLeft}s
                  </div>
                </div>
                <p className="text-white text-lg font-semibold leading-snug">{modulo.texto_guia}</p>
                <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
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
                  onClick={endCurrentSection}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-medium py-4 rounded-2xl transition-colors border border-white/20"
                >
                  <SkipForward size={18} /> Terminar sección
                </button>
                <button
                  onClick={endCurrentSection}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors flex-shrink-0"
                >
                  <Square size={22} className="text-white" fill="white" />
                </button>
              </div>
            </div>
          )}

          {/* ── REVIEW DE SECCIÓN ────────────────────────────────────── */}
          {stage === 'section_review' && modulo && (
            <div className="absolute inset-0 z-20 flex flex-col justify-end">
              <div className="bg-gradient-to-t from-black via-black/80 to-transparent px-4 pt-16 pb-6">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-widest text-center mb-1">
                  Sección {moduloIdx + 1}/{totalModulos} · {modulo.nombre_modulo}
                </p>
                <p className="text-white/40 text-sm text-center mb-5">
                  ¿Cómo te fue? Mirá el video y decidí.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleRegrabar}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-medium py-4 rounded-2xl transition-colors border border-white/20"
                  >
                    <RotateCcw size={16} /> Regrabar
                  </button>
                  <button
                    onClick={handleContinuar}
                    className="flex-1 btn-primary py-4 rounded-2xl justify-center"
                  >
                    {moduloIdx + 1 < totalModulos ? 'Confirmar' : 'Confirmar y subir'}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ENTRE SECCIONES ──────────────────────────────────────── */}
          {stage === 'between' && modulo && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6">
              <div className="w-full max-w-sm bg-black/80 backdrop-blur rounded-3xl p-7">
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-5">
                  Sección {moduloIdx} confirmada ✓
                </p>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Próxima sección</p>
                <p className="text-white font-semibold text-xl mb-3">{modulo.nombre_modulo}</p>
                <div className="bg-brand-600/20 border border-brand-500/30 rounded-xl px-4 py-3 mb-5">
                  <p className="text-brand-200 text-base leading-relaxed font-medium">{modulo.texto_guia}</p>
                </div>
                <p className="text-white/30 text-xs mb-5">{modulo.duracion_base}s · Vas a poder verlo antes de confirmar</p>
                <button
                  onClick={() => { setCountdown(3); setStage('countdown'); }}
                  className="btn-primary w-full justify-center py-3.5 rounded-2xl"
                >
                  Comenzar sección <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── SUBIENDO ─────────────────────────────────────────────── */}
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

          {/* ── LISTO ────────────────────────────────────────────────── */}
          {stage === 'done' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center bg-ink-900">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-emerald-400" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-white mb-2">¡{tituloVideo} listo!</h2>
              <p className="text-white/50 text-sm max-w-sm mb-8">Tu video fue generado y guardado correctamente.</p>
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

          {/* ── ERROR ────────────────────────────────────────────────── */}
          {stage === 'error' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center bg-ink-900">
              <AlertCircle size={48} className="text-red-400 mb-4" />
              <h2 className="font-display text-xl font-semibold text-white mb-2">Error al subir</h2>
              <p className="text-white/50 text-sm mb-6">{uploadError}</p>
              <button onClick={uploadFinalVideo} className="btn-primary justify-center">
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

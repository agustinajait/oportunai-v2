'use client';

/**
 * CapacitatePlayer — motor de capacitación gamificada.
 *
 * Implementa la lógica APRENDER → PRACTICAR → RECIBIR FEEDBACK → CORREGIR → DEMOSTRAR → APROBAR.
 * El contenido viene de la DB (Prisma). El código es el motor; los datos son las capacitaciones.
 * No hay ningún if/switch por nombre de capacitación — todo es dinámico.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, Star, CheckCircle, XCircle,
  ArrowLeft, Trophy, RefreshCw, BookOpen, Zap, Target,
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────

type TipoModulo = 'lectura' | 'pregunta' | 'situacion' | 'actividad' | 'desafio_final';
type EstadoCapacitate = 'no_iniciada' | 'en_progreso' | 'completada' | 'aprobada';

interface Modulo {
  id:               string;
  orden:            number;
  titulo:           string;
  tipo:             TipoModulo;
  contenido:        Record<string, unknown>;
  es_desafio_final: boolean;
}

interface ProgresoInicial {
  modulo_actual: number;
  estado:        EstadoCapacitate;
  respuestas:    Record<string, unknown>;
  puntaje_final: number | null;
}

interface Props {
  contenido: {
    id: string; slug: string; titulo: string; descripcion: string;
    nivel: string; duracion_min: number; objetivo: string;
    competencias: string[]; icono: string;
  };
  modulos:         Modulo[];
  progresoInicial: ProgresoInicial;
}

// ── Sub-componentes de módulo ──────────────────────────────────────────────

function ModuloLectura({
  contenido, onContinuar,
}: {
  contenido: Record<string, unknown>;
  onContinuar: () => void;
}) {
  return (
    <div className="space-y-4">
      {contenido.texto && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-3" style={{ color: '#a78bfa' }}>
            <BookOpen size={15} />
            <span className="text-xs font-bold uppercase tracking-wider">Aprendé esto</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {contenido.texto as string}
          </p>
        </div>
      )}
      {contenido.ejemplo && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(112,72,240,0.1)', border: '1px solid rgba(112,72,240,0.25)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#a78bfa' }}>📌 Ejemplo</p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{contenido.ejemplo as string}</p>
        </div>
      )}
      <button
        onClick={onContinuar}
        className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}
      >
        Continuar →
      </button>
    </div>
  );
}

function ModuloPregunta({
  contenido, onResponder, cargando,
}: {
  contenido:  Record<string, unknown>;
  onResponder: (idx: number) => void;
  cargando:   boolean;
}) {
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const opciones = contenido.opciones as string[];

  return (
    <div className="space-y-4">
      {contenido.texto_educativo && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#a78bfa' }}>Recordá</p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{contenido.texto_educativo as string}</p>
        </div>
      )}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2 mb-4" style={{ color: '#34d399' }}>
          <Zap size={15} />
          <span className="text-xs font-bold uppercase tracking-wider">Pregunta</span>
        </div>
        <p className="font-bold text-sm mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>{contenido.pregunta as string}</p>
        <div className="space-y-2">
          {opciones.map((op, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSeleccionada(i)}
              disabled={cargando}
              className="w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all active:scale-[0.98]"
              style={seleccionada === i
                ? { background: 'linear-gradient(135deg,#4B33CC,#7048F0)', border: '1px solid transparent', color: 'white', fontWeight: 600 }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }
              }
            >
              <span className="inline-block w-5 h-5 rounded-full border mr-2 text-center text-xs leading-5 flex-shrink-0"
                style={seleccionada === i
                  ? { borderColor: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.2)', color: 'white' }
                  : { borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' }
                }
              >
                {String.fromCharCode(65 + i)}
              </span>
              {op}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => seleccionada !== null && onResponder(seleccionada)}
        disabled={seleccionada === null || cargando}
        className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-40"
        style={seleccionada !== null && !cargando
          ? { background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }
          : { background: 'rgba(255,255,255,0.08)' }
        }
      >
        {cargando ? 'Validando...' : 'Responder →'}
      </button>
    </div>
  );
}

function FeedbackPanel({
  correcta, feedback, onContinuar,
}: {
  correcta:   boolean;
  feedback:   string;
  onContinuar: () => void;
}) {
  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5 flex gap-4"
        style={correcta
          ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }
          : { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }
        }
      >
        {correcta
          ? <CheckCircle size={22} style={{ color: '#34d399', flexShrink: 0, marginTop: 2 }} />
          : <XCircle    size={22} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
        }
        <div>
          <p className="font-bold text-sm mb-1" style={{ color: correcta ? '#34d399' : '#fbbf24' }}>
            {correcta ? '¡Correcto!' : 'Todavía no'}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: correcta ? 'rgba(52,211,153,0.8)' : 'rgba(251,191,36,0.8)' }}>
            {feedback}
          </p>
        </div>
      </div>
      <button
        onClick={onContinuar}
        className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}
      >
        {correcta ? 'Continuar →' : 'Volver a intentar →'}
      </button>
    </div>
  );
}

function ModuloDesafioFinal({
  contenido, slug, onCompletado,
}: {
  contenido:    Record<string, unknown>;
  slug:         string;
  onCompletado: (resultado: { aprobada: boolean; puntaje: number; competencias_ok: string[]; mensaje: string }) => void;
}) {
  const tareas = contenido.tareas as Array<{
    titulo: string; descripcion: string; tipo: string;
    opciones?: string[]; competencia: string; peso: number;
  }>;
  const [respuestas, setRespuestas]   = useState<Record<number, number>>({});
  const [tareaActual, setTareaActual] = useState(0);
  const [enviando, setEnviando]       = useState(false);

  const tarea = tareas[tareaActual];
  const todasRespondidas = Object.keys(respuestas).length === tareas.length;

  async function enviar() {
    setEnviando(true);
    try {
      const res = await fetch(`/api/capacitate/${slug}/completar`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ respuestas_desafio: respuestas }),
      });
      const data = await res.json();
      onCompletado(data);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: 'rgba(112,72,240,0.1)', border: '1px solid rgba(112,72,240,0.25)' }}>
        <div className="flex items-center gap-2 mb-2" style={{ color: '#a78bfa' }}>
          <Target size={15} />
          <span className="text-xs font-bold uppercase tracking-wider">Desafío final</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{contenido.escenario as string}</p>
      </div>

      {/* Progreso de tareas */}
      <div className="flex gap-1.5">
        {tareas.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all"
            style={{
              background: i < tareaActual ? '#34d399' :
                i === tareaActual ? 'linear-gradient(90deg,#4B33CC,#7048F0)' :
                'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>

      {/* Tarea actual */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Tarea {tareaActual + 1} de {tareas.length}</p>
          <p className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{tarea.titulo}</p>
          {tarea.descripcion && (
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{tarea.descripcion}</p>
          )}
        </div>
        {tarea.opciones && (
          <div className="space-y-2">
            {tarea.opciones.map((op, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRespuestas(r => ({ ...r, [tareaActual]: i }))}
                className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all active:scale-[0.98]"
                style={respuestas[tareaActual] === i
                  ? { background: 'linear-gradient(135deg,#4B33CC,#7048F0)', border: '1px solid transparent', color: 'white', fontWeight: 600 }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }
                }
              >
                {op}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {tareaActual > 0 && (
          <button
            onClick={() => setTareaActual(t => t - 1)}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          >
            ← Atrás
          </button>
        )}
        {tareaActual < tareas.length - 1 ? (
          <button
            onClick={() => setTareaActual(t => t + 1)}
            disabled={respuestas[tareaActual] === undefined}
            className="flex-1 py-3.5 rounded-2xl font-bold text-white disabled:opacity-40 transition-all"
            style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 16px rgba(109,40,217,0.35)' }}
          >
            Siguiente tarea →
          </button>
        ) : (
          <button
            onClick={enviar}
            disabled={!todasRespondidas || enviando}
            className="flex-1 py-3.5 rounded-2xl font-bold text-white disabled:opacity-40 transition-all"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
          >
            {enviando ? 'Evaluando...' : '✓ Finalizar capacitación'}
          </button>
        )}
      </div>
    </div>
  );
}

function ResultadoFinal({
  aprobada, puntaje, mensaje, competencias_ok, titulo, icono, onReintentar,
}: {
  aprobada:      boolean;
  puntaje:       number;
  mensaje:       string;
  competencias_ok: string[];
  titulo:        string;
  icono:         string;
  onReintentar:  () => void;
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: '#0d0d14' }}>
      <div className="w-full max-w-lg space-y-5">

        {/* Resultado visual */}
        <div
          className="rounded-3xl p-8 text-center relative overflow-hidden"
          style={aprobada
            ? { background: 'linear-gradient(135deg,#064e3b,#065f46)' }
            : { background: 'linear-gradient(135deg,#1a0f3c,#2d1b69)' }
          }
        >
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 70% 30%, ${aprobada ? '#10b981' : '#4B33CC'} 0%, transparent 60%)` }} />
          <div className="relative z-10">
            <div className="text-5xl mb-3">{aprobada ? '🌟' : icono}</div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {aprobada ? '¡Capacitación aprobada!' : 'Seguí practicando'}
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{titulo}</p>
            <div className="mt-5 flex items-center justify-center gap-4">
              <div className="rounded-2xl px-5 py-3" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Resultado</p>
                <p className="text-white font-bold text-2xl">{puntaje}%</p>
              </div>
              {aprobada && (
                <div className="rounded-2xl px-5 py-3" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Estrella</p>
                  <p className="text-white font-bold text-2xl">⭐ +1</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{mensaje}</p>
        </div>

        {/* Competencias */}
        {aprobada && competencias_ok.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="font-bold text-sm mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>Competencias adquiridas</p>
            <div className="flex flex-wrap gap-2">
              {competencias_ok.map(c => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <CheckCircle size={10} />
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="space-y-3">
          {aprobada ? (
            <>
              <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Star size={15} style={{ color: '#34d399', flexShrink: 0 }} />
                <p className="text-sm font-medium" style={{ color: '#34d399' }}>
                  ✓ Agregada automáticamente a tu perfil
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/capacitate')}
                className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}
              >
                Ver más capacitaciones →
              </button>
              <button
                onClick={() => router.push('/dashboard?tab=perfil')}
                className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              >
                Ver mi perfil
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onReintentar}
                className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}
              >
                <RefreshCw size={16} />
                Volver a intentarlo
              </button>
              <button
                onClick={() => router.push('/dashboard/capacitate')}
                className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              >
                Volver al inicio
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function CapacitatePlayer({ contenido, modulos, progresoInicial }: Props) {
  const router = useRouter();
  const [moduloIdx, setModuloIdx]   = useState(progresoInicial.modulo_actual);
  const [started, setStarted]       = useState(progresoInicial.estado !== 'no_iniciada');
  const [feedback, setFeedback]     = useState<{ correcta: boolean; texto: string } | null>(null);
  const [cargando, setCargando]     = useState(false);
  const [resultado, setResultado]   = useState<{
    aprobada: boolean; puntaje: number; competencias_ok: string[]; mensaje: string;
  } | null>(null);

  const modulo = modulos[moduloIdx];
  const total  = modulos.length;

  const avanzar = useCallback(() => {
    setFeedback(null);
    if (moduloIdx < total - 1) {
      setModuloIdx(i => i + 1);
    }
  }, [moduloIdx, total]);

  async function responder(respuesta: number) {
    if (!modulo) return;
    setCargando(true);
    try {
      const res = await fetch(`/api/capacitate/${contenido.slug}/responder`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ modulo_orden: modulo.orden, respuesta }),
      });
      const data = await res.json();
      setFeedback({ correcta: data.correcta, texto: data.feedback });
      if (data.correcta) {
        // Avanzar automáticamente después de 1.5s en móvil
        // En desktop el usuario hace clic en "Continuar"
      }
    } finally {
      setCargando(false);
    }
  }

  async function continuarLectura() {
    // Para módulos de lectura, registrar avance en el servidor
    await fetch(`/api/capacitate/${contenido.slug}/responder`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ modulo_orden: modulo.orden, respuesta: 'leido' }),
    });
    avanzar();
  }

  function reintentar() {
    setResultado(null);
    setModuloIdx(0);
    setFeedback(null);
  }

  // ── Pantalla de resultado final ──────────────────────────────────────────
  if (resultado) {
    return (
      <ResultadoFinal
        {...resultado}
        titulo={contenido.titulo}
        icono={contenido.icono}
        onReintentar={reintentar}
      />
    );
  }

  // ── Pantalla de intro (antes de empezar) ─────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0d0d14' }}>
        {/* Header oscuro */}
        <div className="relative px-4 pt-12 pb-8" style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4B33CC 0%, transparent 60%)' }} />
          <button onClick={() => router.back()} className="relative z-10 flex items-center gap-1.5 text-sm mb-5 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft size={15} /> Volver
          </button>
          <div className="relative z-10 text-center">
            <span className="text-5xl block mb-3">{contenido.icono}</span>
            <h1 className="text-white font-bold text-2xl leading-tight mb-1.5">{contenido.titulo}</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{contenido.descripcion}</p>
          </div>
        </div>

        <div className="flex-1 px-4 pt-5 pb-8 max-w-lg mx-auto w-full space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: String(total), label: 'módulos' },
              { value: `${contenido.duracion_min} min`, label: 'estimado' },
              { value: '80%', label: 'para aprobar' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl py-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-bold text-base" style={{ color: 'rgba(255,255,255,0.9)' }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Objetivo */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Objetivo</p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{contenido.objetivo}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Competencias</p>
              <div className="flex flex-wrap gap-1.5">
                {contenido.competencias.map(c => (
                  <span key={c} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'rgba(112,72,240,0.15)', color: '#a78bfa', border: '1px solid rgba(112,72,240,0.3)' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}
          >
            Comenzar capacitación →
          </button>
        </div>
      </div>
    );
  }

  // ── Player de módulo ─────────────────────────────────────────────────────
  const pct = Math.round((moduloIdx / total) * 100);

  const tipoColor =
    modulo?.tipo === 'desafio_final' ? '#fbbf24' :
    modulo?.tipo === 'lectura'       ? '#a78bfa' : '#34d399';

  const tipoLabel =
    modulo?.tipo === 'lectura'       ? '📖 Contenido'     :
    modulo?.tipo === 'pregunta'      ? '❓ Pregunta'       :
    modulo?.tipo === 'situacion'     ? '🎭 Situación'     :
    modulo?.tipo === 'actividad'     ? '✏️ Actividad'     :
    modulo?.tipo === 'desafio_final' ? '🎯 Desafío final' : '';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d14' }}>

      {/* Header */}
      <header className="px-4 py-4 flex items-center gap-3" style={{ background: 'rgba(26,15,60,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => router.back()}
          className="flex-shrink-0"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{contenido.titulo}</p>
          <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>{modulo?.titulo}</p>
        </div>
        {progresoInicial.estado === 'aprobada' && (
          <Star size={18} className="flex-shrink-0" style={{ color: '#34d399', fill: '#34d399' }} />
        )}
      </header>

      {/* Barra de progreso */}
      <div className="px-4 py-2.5" style={{ background: 'rgba(26,15,60,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span>Módulo {moduloIdx + 1} de {total}</span>
          <span>{pct}% completado</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#4B33CC,#7048F0)' }}
          />
        </div>
      </div>

      {/* Contenido del módulo */}
      <main className="flex-1 px-4 py-6">
        <div className="w-full max-w-lg mx-auto space-y-4">

          {/* Tipo del módulo */}
          <div className="mb-1">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tipoColor }}>
              {tipoLabel}
            </span>
          </div>

          {/* Feedback si existe */}
          {feedback && (
            <FeedbackPanel
              correcta={feedback.correcta}
              feedback={feedback.texto}
              onContinuar={() => {
                if (feedback.correcta) avanzar();
                else setFeedback(null);
              }}
            />
          )}

          {/* Módulo según tipo */}
          {!feedback && modulo && (
            <>
              {(modulo.tipo === 'lectura' || modulo.tipo === 'actividad') && (
                <ModuloLectura contenido={modulo.contenido} onContinuar={continuarLectura} />
              )}
              {(modulo.tipo === 'pregunta' || modulo.tipo === 'situacion') && (
                <ModuloPregunta
                  contenido={modulo.contenido}
                  onResponder={responder}
                  cargando={cargando}
                />
              )}
              {modulo.tipo === 'desafio_final' && (
                <ModuloDesafioFinal
                  contenido={modulo.contenido}
                  slug={contenido.slug}
                  onCompletado={setResultado}
                />
              )}
            </>
          )}

        </div>
      </main>

    </div>
  );
}

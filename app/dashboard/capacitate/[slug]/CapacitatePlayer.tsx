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
    <div className="space-y-5">
      {contenido.texto && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3 text-brand-600">
            <BookOpen size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Aprendé esto</span>
          </div>
          <p className="text-ink-900 text-sm leading-relaxed whitespace-pre-line">
            {contenido.texto as string}
          </p>
        </div>
      )}
      {contenido.ejemplo && (
        <div className="bg-brand-50 rounded-2xl border border-brand-100 p-4">
          <p className="text-xs font-semibold text-brand-600 mb-2">📌 Ejemplo</p>
          <p className="text-sm text-ink-900 leading-relaxed">{contenido.ejemplo as string}</p>
        </div>
      )}
      <button
        onClick={onContinuar}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
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
    <div className="space-y-5">
      {contenido.texto_educativo && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-2">Recordá</p>
          <p className="text-sm text-ink-900 leading-relaxed">{contenido.texto_educativo as string}</p>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 text-teal-600">
          <Zap size={16} />
          <span className="text-xs font-semibold uppercase tracking-wide">Pregunta</span>
        </div>
        <p className="font-semibold text-ink-900 text-sm mb-4">{contenido.pregunta as string}</p>
        <div className="space-y-2">
          {opciones.map((op, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSeleccionada(i)}
              disabled={cargando}
              className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all ${
                seleccionada === i
                  ? 'bg-brand-600 border-brand-600 text-white font-medium'
                  : 'bg-white border-gray-200 text-ink-900 hover:border-brand-400'
              }`}
            >
              <span className={`inline-block w-5 h-5 rounded-full border mr-2 text-center text-xs leading-5 flex-shrink-0 ${
                seleccionada === i ? 'border-white bg-white/20 text-white' : 'border-gray-300 text-gray-400'
              }`}>
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
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-40"
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
      <div className={`rounded-2xl border p-5 flex gap-4 ${
        correcta
          ? 'bg-teal-50 border-teal-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        {correcta
          ? <CheckCircle size={24} className="text-teal-500 flex-shrink-0 mt-0.5" />
          : <XCircle    size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
        }
        <div>
          <p className={`font-bold text-sm mb-1 ${correcta ? 'text-teal-800' : 'text-amber-800'}`}>
            {correcta ? '¡Correcto!' : 'Todavía no'}
          </p>
          <p className={`text-sm leading-relaxed ${correcta ? 'text-teal-700' : 'text-amber-700'}`}>
            {feedback}
          </p>
        </div>
      </div>
      <button
        onClick={onContinuar}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
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
    <div className="space-y-5">
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2 text-brand-600">
          <Target size={16} />
          <span className="text-xs font-semibold uppercase tracking-wide">Desafío final</span>
        </div>
        <p className="text-sm text-ink-900 leading-relaxed">{contenido.escenario as string}</p>
      </div>

      {/* Progreso de tareas */}
      <div className="flex gap-1.5">
        {tareas.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              i < tareaActual ? 'bg-teal-500' :
              i === tareaActual ? 'bg-brand-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Tarea actual */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Tarea {tareaActual + 1} de {tareas.length}</p>
          <p className="font-semibold text-ink-900 text-sm">{tarea.titulo}</p>
          {tarea.descripcion && (
            <p className="text-xs text-gray-500 mt-1">{tarea.descripcion}</p>
          )}
        </div>
        {tarea.opciones && (
          <div className="space-y-2">
            {tarea.opciones.map((op, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRespuestas(r => ({ ...r, [tareaActual]: i }))}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  respuestas[tareaActual] === i
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'border-gray-200 hover:border-brand-400'
                }`}
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
            className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm"
          >
            ← Atrás
          </button>
        )}
        {tareaActual < tareas.length - 1 ? (
          <button
            onClick={() => setTareaActual(t => t + 1)}
            disabled={respuestas[tareaActual] === undefined}
            className="flex-1 bg-brand-600 text-white font-semibold py-3 rounded-xl disabled:opacity-40"
          >
            Siguiente tarea →
          </button>
        ) : (
          <button
            onClick={enviar}
            disabled={!todasRespondidas || enviando}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl disabled:opacity-40"
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
    <div className="min-h-screen bg-ink-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6 text-center">

        {/* Resultado visual */}
        <div className={`rounded-3xl p-8 ${aprobada
          ? 'bg-gradient-to-br from-teal-500 to-teal-600'
          : 'bg-gradient-to-br from-brand-500 to-brand-700'
        }`}>
          <div className="text-5xl mb-3">{aprobada ? '🌟' : icono}</div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {aprobada ? '¡Capacitación aprobada!' : 'Seguí practicando'}
          </h1>
          <p className="text-white/80 text-sm">{titulo}</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="bg-white/20 rounded-2xl px-4 py-2">
              <p className="text-white/70 text-xs">Resultado</p>
              <p className="text-white font-bold text-2xl">{puntaje}%</p>
            </div>
            {aprobada && (
              <div className="bg-white/20 rounded-2xl px-4 py-2">
                <p className="text-white/70 text-xs">Estrella</p>
                <p className="text-white font-bold text-2xl">⭐ +1</p>
              </div>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left">
          <p className="text-sm text-ink-900 leading-relaxed">{mensaje}</p>
        </div>

        {/* Competencias */}
        {aprobada && competencias_ok.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left">
            <p className="font-semibold text-ink-900 text-sm mb-3">Competencias adquiridas</p>
            <div className="flex flex-wrap gap-2">
              {competencias_ok.map(c => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-full px-3 py-1 text-xs font-medium"
                >
                  <CheckCircle size={11} />
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
              <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Star size={16} className="text-teal-500 fill-teal-500 flex-shrink-0" />
                <p className="text-teal-700 text-sm font-medium">
                  ✓ Agregada automáticamente a tu perfil
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/capacitate')}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                Ver más capacitaciones →
              </button>
              <button
                onClick={() => router.push('/dashboard?tab=perfil')}
                className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50"
              >
                Ver mi perfil
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onReintentar}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Volver a intentarlo
              </button>
              <button
                onClick={() => router.push('/dashboard/capacitate')}
                className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50"
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
      <div className="min-h-screen bg-ink-50 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <span className="font-semibold text-ink-900 text-sm truncate">{contenido.titulo}</span>
        </header>
        <div className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center space-y-3">
              <span className="text-5xl">{contenido.icono}</span>
              <h1 className="text-2xl font-bold text-ink-900">{contenido.titulo}</h1>
              <p className="text-gray-500 text-sm">{contenido.descripcion}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-ink-50 rounded-xl py-3">
                  <p className="font-bold text-ink-900">{total}</p>
                  <p className="text-xs text-gray-400 mt-0.5">módulos</p>
                </div>
                <div className="bg-ink-50 rounded-xl py-3">
                  <p className="font-bold text-ink-900">{contenido.duracion_min} min</p>
                  <p className="text-xs text-gray-400 mt-0.5">estimado</p>
                </div>
                <div className="bg-ink-50 rounded-xl py-3">
                  <p className="font-bold text-ink-900">80%</p>
                  <p className="text-xs text-gray-400 mt-0.5">para aprobar</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-900 mb-2">Objetivo</p>
                <p className="text-sm text-gray-600 leading-relaxed">{contenido.objetivo}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-900 mb-2">Competencias</p>
                <div className="flex flex-wrap gap-1.5">
                  {contenido.competencias.map(c => (
                    <span key={c} className="bg-brand-50 text-brand-700 border border-brand-100 rounded-full px-2.5 py-1 text-xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setStarted(true)}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Comenzar capacitación →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Player de módulo ─────────────────────────────────────────────────────
  const pct = Math.round((moduloIdx / total) * 100);

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">{contenido.titulo}</p>
          <p className="text-sm font-semibold text-ink-900 truncate">{modulo?.titulo}</p>
        </div>
        {progresoInicial.estado === 'aprobada' && (
          <Star size={18} className="text-teal-500 fill-teal-500 flex-shrink-0" />
        )}
      </header>

      {/* Barra de progreso */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Módulo {moduloIdx + 1} de {total}</span>
          <span>{pct}% completado</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Contenido del módulo */}
      <main className="flex-1 px-4 py-6">
        <div className="w-full max-w-lg mx-auto space-y-4">

          {/* Título del módulo */}
          <div className="mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wide ${
              modulo?.tipo === 'desafio_final' ? 'text-amber-600' :
              modulo?.tipo === 'lectura'       ? 'text-brand-600' : 'text-teal-600'
            }`}>
              {modulo?.tipo === 'lectura'       ? '📖 Contenido'  :
               modulo?.tipo === 'pregunta'      ? '❓ Pregunta'    :
               modulo?.tipo === 'situacion'     ? '🎭 Situación'  :
               modulo?.tipo === 'actividad'     ? '✏️ Actividad'  :
               modulo?.tipo === 'desafio_final' ? '🎯 Desafío final' : ''}
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

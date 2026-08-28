'use client';

/**
 * PreDiagnostico — pantalla de 3 preguntas rápidas antes de grabar el Video CV.
 *
 * Las respuestas se mapean a dimensiones del semáforo Korai y se guardan en
 * korai_semaforo. Cuando el usuario llega al diagnóstico, Korai ya tiene
 * Empleo + Ingresos + Educación cargados y solo pregunta las 3 restantes.
 *
 * Costo: $0 — sin APIs externas, puro TypeScript en el servidor.
 */

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

type SemaforoColor = 'verde' | 'amarillo' | 'rojo';

interface RespuestasPreDiag {
  empleo_situacion: string | null;    // valor display
  empleo_color:     SemaforoColor | null;
  ingresos_rango:   string | null;    // valor display (igual que Korai)
  ingresos_color:   SemaforoColor | null;
  educacion_nivel:  string | null;    // valor display
  educacion_color:  SemaforoColor | null;
}

const SITUACION_EMPLEO = [
  { label: 'Sí, en blanco (formal)',       value: 'en_blanco',  color: 'verde'    as SemaforoColor },
  { label: 'Sí, en negro / informal',      value: 'informal',   color: 'amarillo' as SemaforoColor },
  { label: 'No, estoy buscando trabajo',   value: 'buscando',   color: 'rojo'     as SemaforoColor },
];

// Valores exactos del formulario de diagnóstico Korai
const RANGOS_INGRESOS = [
  { label: 'Menos de $700.000',              color: 'rojo'     as SemaforoColor },
  { label: 'Entre $700.000 y $1.300.000',    color: 'amarillo' as SemaforoColor },
  { label: 'Entre $1.300.000 y $2.000.000',  color: 'verde'    as SemaforoColor },
  { label: 'Más de $2.000.000',              color: 'verde'    as SemaforoColor },
];

const NIVELES_EDUCACION = [
  { label: 'Sí, o tengo estudios superiores',  value: 'completo',       color: 'verde'    as SemaforoColor },
  { label: 'Estoy cursando el secundario',      value: 'en_curso',       color: 'amarillo' as SemaforoColor },
  { label: 'No terminé el secundario',          value: 'sin_secundario', color: 'rojo'     as SemaforoColor },
];

interface Props {
  onContinuar: () => void;
}

export default function PreDiagnostico({ onContinuar }: Props) {
  const [empleo,    setEmpleo]    = useState<typeof SITUACION_EMPLEO[0]   | null>(null);
  const [ingresos,  setIngresos]  = useState<typeof RANGOS_INGRESOS[0]    | null>(null);
  const [educacion, setEducacion] = useState<typeof NIVELES_EDUCACION[0]  | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState('');

  const todoCompleto = empleo !== null && ingresos !== null && educacion !== null;

  async function guardarYContinuar() {
    if (!todoCompleto) return;
    setGuardando(true);
    setError('');

    // Construir semáforo parcial con las respuestas
    const semaforoParcial: Record<string, SemaforoColor> = {
      empleo:    empleo!.color,
      ingresos:  ingresos!.color,
      educacion: educacion!.color,
    };

    // Guardar en korai_semaforo via API de onboarding
    // Reutilizamos el endpoint existente con un campo nuevo
    try {
      const res = await fetch('/api/user/pre-diagnostico', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          semaforo: semaforoParcial,
          respuestas: {
            empleo_situacion:  empleo!.label,
            ingresos_rango:    ingresos!.label,
            educacion_nivel:   educacion!.label,
          },
        }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      onContinuar();
    } catch {
      setError('No pudimos guardar. Intentá de nuevo.');
      setGuardando(false);
    }
  }

  function Opcion({
    label, selected, onClick,
  }: { label: string; selected: boolean; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left text-sm font-medium transition-all ${
          selected
            ? 'bg-brand-600 border-brand-600 text-white'
            : 'bg-white border-gray-200 text-ink-900 hover:border-brand-400'
        }`}
      >
        <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
          selected ? 'border-white' : 'border-gray-300'
        }`}>
          {selected && <span className="w-2 h-2 rounded-full bg-white block" />}
        </span>
        {label}
        {selected && <CheckCircle size={16} className="ml-auto flex-shrink-0 opacity-80" />}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div>
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-1">
            Antes de grabar
          </p>
          <h1 className="text-2xl font-bold text-ink-900">3 preguntas rápidas</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Tus respuestas quedan guardadas para que Korai no te vuelva a preguntar lo mismo.
          </p>
        </div>

        {/* Pregunta 1: Empleo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="font-semibold text-ink-900 text-sm">¿Estás trabajando actualmente?</p>
          <div className="space-y-2">
            {SITUACION_EMPLEO.map(op => (
              <Opcion
                key={op.value}
                label={op.label}
                selected={empleo?.value === op.value}
                onClick={() => setEmpleo(op)}
              />
            ))}
          </div>
        </div>

        {/* Pregunta 2: Ingresos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="font-semibold text-ink-900 text-sm">¿Cuáles son tus ingresos mensuales?</p>
          <div className="space-y-2">
            {RANGOS_INGRESOS.map(op => (
              <Opcion
                key={op.label}
                label={op.label}
                selected={ingresos?.label === op.label}
                onClick={() => setIngresos(op)}
              />
            ))}
          </div>
        </div>

        {/* Pregunta 3: Educación */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="font-semibold text-ink-900 text-sm">¿Terminaste el secundario?</p>
          <div className="space-y-2">
            {NIVELES_EDUCACION.map(op => (
              <Opcion
                key={op.value}
                label={op.label}
                selected={educacion?.value === op.value}
                onClick={() => setEducacion(op)}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={guardarYContinuar}
          disabled={!todoCompleto || guardando}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-40"
        >
          {guardando ? 'Guardando...' : '🎥 Grabar mi Video CV →'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Esta info nos ayuda a personalizar tu acompañamiento
        </p>

      </div>
    </div>
  );
}

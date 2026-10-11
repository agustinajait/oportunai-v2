'use client';

import { useState } from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SemaforoColor = 'verde' | 'amarillo' | 'rojo';

interface RespuestasPreDiag {
  empleo_situacion: string | null;
  empleo_color:     SemaforoColor | null;
  ingresos_rango:   string | null;
  ingresos_color:   SemaforoColor | null;
  educacion_nivel:  string | null;
  educacion_color:  SemaforoColor | null;
}

const SITUACION_EMPLEO = [
  { label: 'Sí, en blanco (formal)',       value: 'en_blanco',  color: 'verde'    as SemaforoColor },
  { label: 'Sí, en negro / informal',      value: 'informal',   color: 'amarillo' as SemaforoColor },
  { label: 'No, estoy buscando trabajo',   value: 'buscando',   color: 'rojo'     as SemaforoColor },
];

const RANGOS_INGRESOS = [
  { label: 'No tengo ingresos',              color: 'rojo'     as SemaforoColor },
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

const PREGUNTAS = [
  {
    pregunta: '¿Estás trabajando actualmente?',
    opciones: SITUACION_EMPLEO,
    key: 'empleo',
  },
  {
    pregunta: '¿Cuáles son tus ingresos mensuales?',
    opciones: RANGOS_INGRESOS.map(o => ({ ...o, value: o.label })),
    key: 'ingresos',
  },
  {
    pregunta: '¿Terminaste el secundario?',
    opciones: NIVELES_EDUCACION,
    key: 'educacion',
  },
];

interface Props {
  onContinuar: () => void;
}

export default function PreDiagnostico({ onContinuar }: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState(0); // 0, 1, 2 = pregunta activa
  const [empleo,    setEmpleo]    = useState<typeof SITUACION_EMPLEO[0]   | null>(null);
  const [ingresos,  setIngresos]  = useState<typeof RANGOS_INGRESOS[0]    | null>(null);
  const [educacion, setEducacion] = useState<typeof NIVELES_EDUCACION[0]  | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState('');

  const seleccionActual = [empleo, ingresos, educacion][paso];
  const todoCompleto = empleo !== null && ingresos !== null && educacion !== null;

  function handleSelect(op: any) {
    if (paso === 0) setEmpleo(op);
    else if (paso === 1) setIngresos(op);
    else setEducacion(op);
  }

  function handleSiguiente() {
    if (paso < 2) { setPaso(p => p + 1); return; }
    guardarYContinuar();
  }

  async function guardarYContinuar() {
    if (!todoCompleto) return;
    setGuardando(true);
    setError('');
    const semaforoParcial: Record<string, SemaforoColor> = {
      empleo:    empleo!.color,
      ingresos:  ingresos!.color,
      educacion: educacion!.color,
    };
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

  const pregunta = PREGUNTAS[paso];
  const seleccionPaso = [empleo, ingresos, educacion][paso];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d14' }}>

      {/* Header oscuro */}
      <div className="relative px-4 pt-12 pb-8" style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4B33CC 0%, transparent 60%)' }} />
        <button
          onClick={() => router.push('/dashboard')}
          className="relative z-10 flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> Volver
        </button>
        <div className="relative z-10">
          <div className="flex gap-1.5 mb-4">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="h-1 rounded-full flex-1 transition-all duration-300"
                style={{ background: i <= paso ? '#7048F0' : 'rgba(255,255,255,0.15)' }}
              />
            ))}
          </div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">
            Antes de grabar · Pregunta {paso + 1} de 3
          </p>
          <h1 className="text-white font-bold text-2xl leading-tight">
            {pregunta.pregunta}
          </h1>
        </div>
      </div>

      {/* Opciones */}
      <div className="flex-1 px-4 pt-5 pb-6 space-y-3">
        {pregunta.opciones.map((op: any) => {
          const selected = seleccionPaso?.value === op.value || seleccionPaso?.label === op.label;
          return (
            <button
              key={op.value ?? op.label}
              type="button"
              onClick={() => handleSelect(op)}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border text-left transition-all active:scale-[0.98]"
              style={selected
                ? { background: 'linear-gradient(135deg,#4B33CC,#7048F0)', borderColor: 'transparent', boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }
                : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }
              }
            >
              <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected ? 'border-white' : 'border-white/20'
              }`}>
                {selected && <span className="w-2.5 h-2.5 rounded-full bg-white block" />}
              </span>
              <span className={`text-sm font-medium flex-1 leading-tight ${selected ? 'text-white' : 'text-white/70'}`}>
                {op.label}
              </span>
              {selected && <CheckCircle size={16} className="text-white/80 flex-shrink-0" />}
            </button>
          );
        })}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      {/* CTA sticky */}
      <div className="px-4 pb-8 pt-2 space-y-3">
        <button
          onClick={handleSiguiente}
          disabled={!seleccionPaso || guardando}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={seleccionPaso && !guardando
            ? { background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }
            : { background: 'rgba(255,255,255,0.08)' }
          }
        >
          {guardando ? (
            'Guardando...'
          ) : paso < 2 ? (
            <>Siguiente →</>
          ) : (
            <>🎥 Grabar mi Video CV</>
          )}
        </button>

        <button
          type="button"
          onClick={onContinuar}
          className="w-full text-sm text-white/30 hover:text-white/50 py-2 transition-colors text-center"
        >
          Hacerlo en otro momento →
        </button>
      </div>
    </div>
  );
}

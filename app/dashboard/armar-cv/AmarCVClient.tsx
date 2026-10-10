'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Download, CheckCircle, Loader2, Video, Plus, X, ChevronDown } from 'lucide-react';

interface VideoAnalisis {
  puntaje: number;
  titulo: string;
  fortalezas: string[];
  mejoras: { titulo: string; consejo: string }[];
  tip_estrella: string;
}

interface Props {
  nombre: string;
  cvExistente: boolean;
  cvResumenActual: string | null;
  videoAnalisis: VideoAnalisis | null;
  videoSecciones: { nombre: string; intentos: number }[] | null;
}

type Stage = 'form' | 'generating' | 'done' | 'error';

const HABILIDADES_SUGERIDAS = [
  'Atención al cliente', 'Trabajo en equipo', 'Comunicación', 'Puntualidad',
  'Responsabilidad', 'Proactividad', 'Manejo de caja', 'Ventas',
  'Cocina', 'Limpieza', 'Cuidado de personas', 'Conducción',
  'Excel / computación', 'Redes sociales', 'Inglés básico',
];

const NIVELES_ESTUDIOS = [
  'Primario incompleto', 'Primario completo',
  'Secundario incompleto', 'Secundario completo',
  'Terciario / Técnico incompleto', 'Terciario / Técnico completo',
  'Universitario incompleto', 'Universitario completo',
];

const DISPONIBILIDAD_OPCIONES = [
  'Tiempo completo', 'Medio tiempo', 'Por horas', 'Fines de semana', 'Rotativos',
];

interface Experiencia {
  empresa: string;
  cargo: string;
  periodo: string;
}

export default function AmarCVClient({
  nombre,
  cvExistente,
  cvResumenActual,
  videoAnalisis,
}: Props) {
  const router = useRouter();

  const [stage, setStage] = useState<Stage>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [cvResumenGenerado, setCvResumenGenerado] = useState<string | null>(null);

  // Campos del formulario
  const [experiencias, setExperiencias] = useState<Experiencia[]>([{ empresa: '', cargo: '', periodo: '' }]);
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [nivelEstudios, setNivelEstudios] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<string[]>([]);
  const [zona, setZona] = useState('');

  function agregarExperiencia() {
    setExperiencias(p => [...p, { empresa: '', cargo: '', periodo: '' }]);
  }

  function quitarExperiencia(i: number) {
    setExperiencias(p => p.filter((_, idx) => idx !== i));
  }

  function updateExp(i: number, field: keyof Experiencia, val: string) {
    setExperiencias(p => p.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  }

  function toggleHabilidad(h: string) {
    setHabilidades(p => p.includes(h) ? p.filter(x => x !== h) : [...p, h]);
  }

  function toggleDisponibilidad(d: string) {
    setDisponibilidad(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  }

  function buildTextoLibre(): string {
    const lines: string[] = [];

    if (nombre) lines.push(`Me llamo ${nombre}.`);

    const expsValidas = experiencias.filter(e => e.empresa.trim() || e.cargo.trim());
    if (expsValidas.length > 0) {
      lines.push('Mi experiencia laboral:');
      expsValidas.forEach(e => {
        const parts = [e.cargo, e.empresa, e.periodo].filter(Boolean);
        lines.push('- ' + parts.join(', '));
      });
    }

    if (habilidades.length > 0) {
      lines.push(`Mis habilidades: ${habilidades.join(', ')}.`);
    }

    if (nivelEstudios) {
      lines.push(`Nivel de estudios: ${nivelEstudios}.`);
    }

    if (disponibilidad.length > 0) {
      lines.push(`Disponibilidad: ${disponibilidad.join(', ')}.`);
    }

    if (zona.trim()) {
      lines.push(`Zona donde puedo trabajar: ${zona.trim()}.`);
    }

    return lines.join('\n');
  }

  const puedeGenerar = experiencias.some(e => e.empresa.trim() || e.cargo.trim()) || habilidades.length > 0;

  async function generarCV() {
    const textoFinal = buildTextoLibre();
    if (!textoFinal.trim() || textoFinal.length < 10) return;
    setStage('generating');
    setErrorMsg('');
    try {
      const res = await fetch('/api/cv/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto_libre: textoFinal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al generar el CV');
      setCvResumenGenerado(data.cv_datos?.resumen ?? null);
      setStage('done');
    } catch (e: any) {
      setErrorMsg(e.message);
      setStage('error');
    }
  }

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-ink-400 hover:text-ink-800 transition-colors p-1 -ml-1"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-ink-800 text-sm">
          {cvExistente ? 'Actualizá tu CV' : 'Armá tu CV'}
        </h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* ── FORMULARIO ─────────────────────────────────────────────── */}
        {stage === 'form' && (
          <>
            {/* Card video fortalezas */}
            {videoAnalisis && (
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-brand-600/10 flex items-center justify-center">
                    <Video size={14} className="text-brand-600" />
                  </div>
                  <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
                    Lo que mostraste en tu video
                  </p>
                </div>
                {videoAnalisis.fortalezas.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle size={13} className="text-brand-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-brand-800 leading-snug">{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CV existente */}
            {cvExistente && cvResumenActual && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                  Tu CV actual
                </p>
                <p className="text-sm text-emerald-800 leading-relaxed">{cvResumenActual}</p>
                <p className="text-xs text-emerald-600 mt-2">
                  Completá los datos abajo y vamos a actualizar tu CV.
                </p>
              </div>
            )}

            {/* ── Experiencia laboral ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div>
                <p className="font-semibold text-ink-800 text-base">¿Dónde trabajaste?</p>
                <p className="text-sm text-ink-400 mt-0.5">Podés agregar más de un trabajo.</p>
              </div>

              <div className="space-y-3">
                {experiencias.map((exp, i) => (
                  <div key={i} className="bg-ink-50 rounded-xl p-3 space-y-2 relative">
                    {experiencias.length > 1 && (
                      <button
                        onClick={() => quitarExperiencia(i)}
                        className="absolute top-2 right-2 text-ink-300 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <input
                      type="text"
                      placeholder="Cargo o puesto (ej: vendedor, cajera, limpieza)"
                      value={exp.cargo}
                      onChange={e => updateExp(i, 'cargo', e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Empresa o lugar"
                      value={exp.empresa}
                      onChange={e => updateExp(i, 'empresa', e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="¿Cuánto tiempo? (ej: 2 años, 6 meses)"
                      value={exp.periodo}
                      onChange={e => updateExp(i, 'periodo', e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={agregarExperiencia}
                className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors"
              >
                <Plus size={15} /> Agregar otro trabajo
              </button>
            </div>

            {/* ── Habilidades ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div>
                <p className="font-semibold text-ink-800 text-base">¿Qué sabés hacer?</p>
                <p className="text-sm text-ink-400 mt-0.5">Seleccioná todo lo que aplique.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {HABILIDADES_SUGERIDAS.map(h => (
                  <button
                    key={h}
                    onClick={() => toggleHabilidad(h)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      habilidades.includes(h)
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Estudios y datos extra ──────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="font-semibold text-ink-800 text-base">Un poco más sobre vos</p>

              {/* Nivel estudios */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink-600">Estudios</label>
                <div className="relative">
                  <select
                    value={nivelEstudios}
                    onChange={e => setNivelEstudios(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 appearance-none bg-white pr-8"
                  >
                    <option value="">Seleccioná tu nivel de estudios</option>
                    {NIVELES_ESTUDIOS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-ink-400 pointer-events-none" />
                </div>
              </div>

              {/* Disponibilidad */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink-600">Disponibilidad</label>
                <div className="flex flex-wrap gap-2">
                  {DISPONIBILIDAD_OPCIONES.map(d => (
                    <button
                      key={d}
                      onClick={() => toggleDisponibilidad(d)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        disponibilidad.includes(d)
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zona */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink-600">¿En qué zona podés trabajar?</label>
                <input
                  type="text"
                  placeholder="Ej: Quilmes, zona sur, CABA"
                  value={zona}
                  onChange={e => setZona(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>

            <button
              onClick={generarCV}
              disabled={!puedeGenerar}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-base"
            >
              <Sparkles size={18} />
              {cvExistente ? 'Actualizar mi CV' : 'Generarme el CV'}
            </button>

            <p className="text-center text-xs text-ink-300 -mt-1">
              Solo necesitás completar experiencia o habilidades para continuar
            </p>
          </>
        )}

        {/* ── GENERANDO ─────────────────────────────────────────────── */}
        {stage === 'generating' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-600/10 flex items-center justify-center">
              <Loader2 size={28} className="text-brand-600 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-ink-800 text-lg">Armando tu CV...</p>
              <p className="text-sm text-ink-400 mt-1 leading-relaxed">
                Convertimos lo que ingresaste en un CV profesional.
              </p>
            </div>
          </div>
        )}

        {/* ── LISTO ─────────────────────────────────────────────────── */}
        {stage === 'done' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-ink-800 text-xl">¡Tu CV está listo!</p>
                  <p className="text-sm text-ink-400 mt-1">
                    Ya está guardado en tu perfil.
                  </p>
                </div>
              </div>

              {cvResumenGenerado && (
                <div className="bg-ink-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Tu resumen profesional</p>
                  <p className="text-sm text-ink-700 leading-relaxed">{cvResumenGenerado}</p>
                </div>
              )}

              <a
                href="/api/cv/download"
                download
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 rounded-xl transition-colors text-base"
              >
                <Download size={18} />
                Descargar mi CV
              </a>

              <button
                onClick={() => router.push('/dashboard?tab=perfil')}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-ink-600 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Ver mi perfil completo →
              </button>
            </div>

            <button
              onClick={() => setStage('form')}
              className="w-full text-xs text-ink-300 hover:text-ink-500 py-2 transition-colors"
            >
              Actualizar con más información →
            </button>
          </div>
        )}

        {/* ── ERROR ─────────────────────────────────────────────────── */}
        {stage === 'error' && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 text-center space-y-3">
            <p className="font-semibold text-red-600">Algo salió mal</p>
            <p className="text-sm text-ink-400">{errorMsg}</p>
            <button
              onClick={() => setStage('form')}
              className="border border-gray-200 text-ink-600 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Volver a intentar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

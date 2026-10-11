'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Sparkles, Download, CheckCircle, Loader2,
  Video, Plus, X, ChevronDown, Briefcase, GraduationCap,
  MapPin, Clock, Zap, Share2, RotateCcw,
} from 'lucide-react';

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
    if (habilidades.length > 0) lines.push(`Mis habilidades: ${habilidades.join(', ')}.`);
    if (nivelEstudios) lines.push(`Nivel de estudios: ${nivelEstudios}.`);
    if (disponibilidad.length > 0) lines.push(`Disponibilidad: ${disponibilidad.join(', ')}.`);
    if (zona.trim()) lines.push(`Zona donde puedo trabajar: ${zona.trim()}.`);
    return lines.join('\n');
  }

  const puedeGenerar = experiencias.some(e => e.empresa.trim() || e.cargo.trim()) || habilidades.length > 0;
  const totalSeleccionado = habilidades.length + disponibilidad.length + (nivelEstudios ? 1 : 0) + (zona.trim() ? 1 : 0);

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
    <div className="min-h-screen" style={{ background: '#F5F5F7' }}>

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 -ml-1"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-sm leading-tight">
              {cvExistente ? 'Actualizá tu CV' : 'Armá tu CV'}
            </h1>
            {stage === 'form' && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {totalSeleccionado > 0 ? `${totalSeleccionado} dato${totalSeleccionado !== 1 ? 's' : ''} completado${totalSeleccionado !== 1 ? 's' : ''}` : 'Completá tu información'}
              </p>
            )}
          </div>
          {stage === 'form' && puedeGenerar && (
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>

        {/* Progress bar */}
        {stage === 'form' && (
          <div className="h-0.5 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-500"
              style={{ width: puedeGenerar ? `${Math.min(20 + totalSeleccionado * 8, 90)}%` : '5%' }}
            />
          </div>
        )}
        {stage === 'done' && <div className="h-0.5 bg-emerald-400" />}
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-32">

        {/* ── FORMULARIO ─────────────────────────────────────────────── */}
        {stage === 'form' && (
          <>
            {/* Video fortalezas */}
            {videoAnalisis && (
              <div className="rounded-2xl p-4 space-y-2" style={{ background: 'linear-gradient(135deg,#2d1b69,#4B33CC)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Video size={13} className="text-white" />
                  </div>
                  <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Lo que mostraste en tu video</p>
                </div>
                {videoAnalisis.fortalezas.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle size={13} className="text-violet-300 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-white/80 leading-snug">{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CV existente */}
            {cvExistente && cvResumenActual && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">Tu CV actual</p>
                <p className="text-sm text-emerald-800 leading-relaxed">{cvResumenActual}</p>
                <p className="text-xs text-emerald-600 mt-2">Completá los datos abajo para actualizar tu CV.</p>
              </div>
            )}

            {/* ── Experiencia laboral ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>
                  <Briefcase size={16} color="#fff" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">¿Dónde trabajaste?</p>
                  <p className="text-xs text-gray-400 mt-0.5">Podés agregar más de un trabajo</p>
                </div>
              </div>

              <div className="px-4 pb-3 space-y-3">
                {experiencias.map((exp, i) => (
                  <div key={i} className="rounded-xl p-3 space-y-2 relative" style={{ background: '#F5F5F7' }}>
                    {experiencias.length > 1 && (
                      <button
                        onClick={() => quitarExperiencia(i)}
                        className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center bg-gray-200 hover:bg-red-100 transition-colors"
                      >
                        <X size={10} className="text-gray-500 hover:text-red-500" />
                      </button>
                    )}
                    <input
                      type="text"
                      placeholder="Cargo o puesto (ej: vendedora, cajero)"
                      value={exp.cargo}
                      onChange={e => updateExp(i, 'cargo', e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white placeholder:text-gray-300"
                    />
                    <input
                      type="text"
                      placeholder="Empresa o lugar"
                      value={exp.empresa}
                      onChange={e => updateExp(i, 'empresa', e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white placeholder:text-gray-300"
                    />
                    <input
                      type="text"
                      placeholder="¿Cuánto tiempo? (ej: 2 años, 6 meses)"
                      value={exp.periodo}
                      onChange={e => updateExp(i, 'periodo', e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white placeholder:text-gray-300"
                    />
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={agregarExperiencia}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-violet-200 text-sm text-violet-600 font-medium hover:border-violet-400 hover:bg-violet-50 transition-all"
                >
                  <Plus size={15} /> Agregar otro trabajo
                </button>
              </div>
            </div>

            {/* ── Habilidades ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                    <Zap size={16} color="#fff" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">¿Qué sabés hacer?</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tocá todo lo que aplique</p>
                  </div>
                </div>
                {habilidades.length > 0 && (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">{habilidades.length}</span>
                )}
              </div>
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                {HABILIDADES_SUGERIDAS.map(h => (
                  <button
                    key={h}
                    onClick={() => toggleHabilidad(h)}
                    className={`px-3 py-2 rounded-full text-sm border font-medium transition-all active:scale-95 ${
                      habilidades.includes(h)
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Estudios y datos extra ──────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)' }}>
                  <GraduationCap size={16} color="#fff" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Un poco más sobre vos</p>
                  <p className="text-xs text-gray-400 mt-0.5">Opcional pero suma mucho</p>
                </div>
              </div>

              <div className="px-4 pb-4 space-y-4">
                {/* Nivel estudios */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap size={11} /> Nivel de estudios
                  </label>
                  <div className="relative">
                    <select
                      value={nivelEstudios}
                      onChange={e => setNivelEstudios(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400 appearance-none bg-white pr-8 text-gray-700"
                    >
                      <option value="">Seleccioná tu nivel</option>
                      {NIVELES_ESTUDIOS.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Disponibilidad */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={11} /> Disponibilidad
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DISPONIBILIDAD_OPCIONES.map(d => (
                      <button
                        key={d}
                        onClick={() => toggleDisponibilidad(d)}
                        className={`px-3 py-2 rounded-full text-sm border font-medium transition-all active:scale-95 ${
                          disponibilidad.includes(d)
                            ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-sky-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zona */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={11} /> Zona de trabajo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Quilmes, zona sur, CABA"
                    value={zona}
                    onChange={e => setZona(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── GENERANDO ─────────────────────────────────────────────── */}
        {stage === 'generating' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2d1b69,#4B33CC)' }}>
                <Sparkles size={30} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow">
                <Loader2 size={16} className="text-violet-600 animate-spin" />
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-xl">Preparando tu CV...</p>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xs">
                Estamos armando un CV profesional con tu información. Solo un momento.
              </p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-violet-400"
                  style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── LISTO ─────────────────────────────────────────────────── */}
        {stage === 'done' && (
          <div className="space-y-4">
            {/* Celebración */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#064e3b,#065f46)' }}>
              <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center gap-3">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <CheckCircle size={38} className="text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-bold text-white text-2xl leading-tight">¡Tu CV está listo!</p>
                  <p className="text-white/60 text-sm mt-1.5">Ya está guardado en tu perfil</p>
                </div>
              </div>

              {cvResumenGenerado && (
                <div className="mx-4 mb-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Tu resumen profesional</p>
                  <p className="text-sm text-white/90 leading-relaxed">{cvResumenGenerado}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <a
                href="/api/cv/download"
                download
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 14px rgba(109,40,217,0.25)' }}
              >
                <Download size={17} /> Descargar mi CV
              </a>

              <button
                onClick={() => router.push('/dashboard?tab=perfil')}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                <Share2 size={15} /> Ver mi perfil completo
              </button>
            </div>

            <button
              onClick={() => setStage('form')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 py-2 transition-colors"
            >
              <RotateCcw size={12} /> Agregar más información
            </button>
          </div>
        )}

        {/* ── ERROR ─────────────────────────────────────────────────── */}
        {stage === 'error' && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <X size={22} className="text-red-400" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Algo salió mal</p>
              <p className="text-sm text-gray-400 mt-1">{errorMsg}</p>
            </div>
            <button
              onClick={() => setStage('form')}
              className="border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Volver a intentar
            </button>
          </div>
        )}

      </div>

      {/* ── CTA sticky bottom — solo en formulario ─────────────────── */}
      {stage === 'form' && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-3" style={{ background: 'linear-gradient(to top, #F5F5F7 70%, transparent)' }}>
          <div className="max-w-lg mx-auto space-y-2">
            <button
              onClick={generarCV}
              disabled={!puedeGenerar}
              className="w-full flex items-center justify-center gap-2.5 font-bold py-4 rounded-2xl text-base text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={puedeGenerar ? { background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.35)' } : { background: '#9ca3af' }}
            >
              <Sparkles size={18} />
              {cvExistente ? 'Actualizar mi CV' : 'Generarme el CV'}
            </button>
            {!puedeGenerar && (
              <p className="text-center text-xs text-gray-400">
                Completá al menos un trabajo o habilidad para continuar
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

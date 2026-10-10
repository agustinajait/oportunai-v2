'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Download, CheckCircle, Loader2, Video } from 'lucide-react';

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

export default function AmarCVClient({
  nombre,
  cvExistente,
  cvResumenActual,
  videoAnalisis,
}: Props) {
  const router = useRouter();

  const [texto, setTexto] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [cvResumenGenerado, setCvResumenGenerado] = useState<string | null>(null);

  const placeholderTexto = nombre
    ? `Ej: Trabajé 3 años de empleada doméstica en casas de familia. Sé cocinar, planchar y hacer limpieza profunda. Terminé el secundario en 2020. Soy de Quilmes y puedo trabajar de lunes a viernes...`
    : `Ej: Me llamo María, trabajé 3 años limpiando casas. Sé cocinar, planchar y hacer limpieza profunda. Terminé el secundario en 2020. Soy de Quilmes...`;

  async function generarCV() {
    const textoFinal = texto.trim();
    if (textoFinal.length < 20) return;
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
          {cvExistente ? 'Actualizá tu CV' : 'Generá tu CV'}
        </h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* ── FORMULARIO ─────────────────────────────────────────────── */}
        {stage === 'form' && (
          <>
            {/* Card del video */}
            {videoAnalisis && (
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-brand-600/10 flex items-center justify-center">
                    <Video size={14} className="text-brand-600" />
                  </div>
                  <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
                    Lo que vimos en tu video
                  </p>
                </div>
                {videoAnalisis.fortalezas.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle size={13} className="text-brand-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-brand-800 leading-snug">{f}</span>
                  </div>
                ))}
                <p className="text-xs text-brand-500 pt-1">
                  Completá el texto de abajo para que podamos armar tu CV completo.
                </p>
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
                  Si escribís algo nuevo abajo, vamos a actualizar tu CV con esa info.
                </p>
              </div>
            )}

            {/* Formulario principal */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div>
                <p className="font-semibold text-ink-800 mb-1">
                  {cvExistente ? 'Agregá o actualizá tu información' : 'Contanos sobre vos'}
                </p>
                <p className="text-sm text-ink-400 leading-relaxed">
                  Escribí con tus palabras, como te salga. Nosotros lo convertimos en un CV profesional.
                </p>
              </div>

              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                rows={9}
                className="w-full text-sm text-ink-800 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed placeholder-ink-300"
                placeholder={placeholderTexto}
              />

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                  ¿Qué podés incluir?
                </p>
                {[
                  'Trabajos anteriores y cuánto tiempo duraron',
                  'Qué sabés hacer (limpieza, cocina, caja, computación…)',
                  'Si terminaste el secundario o algún estudio',
                  'En qué zona vivís y si podés viajar',
                ].map(hint => (
                  <div key={hint} className="flex items-start gap-2">
                    <span className="text-brand-400 text-xs mt-0.5 flex-shrink-0">→</span>
                    <p className="text-xs text-ink-400 leading-snug">{hint}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={generarCV}
                disabled={texto.trim().length < 20}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles size={16} />
                {cvExistente ? 'Actualizar mi CV' : 'Generarme el CV'}
              </button>
            </div>
          </>
        )}

        {/* ── GENERANDO ─────────────────────────────────────────────── */}
        {stage === 'generating' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-600/10 flex items-center justify-center">
              <Loader2 size={28} className="text-brand-600 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-ink-800">Armando tu CV...</p>
              <p className="text-sm text-ink-400 mt-1 leading-relaxed">
                Estamos convirtiendo lo que contaste en un CV profesional.
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
                  <p className="font-semibold text-ink-800 text-lg">¡Tu CV está listo!</p>
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
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                <Download size={16} />
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
              onClick={() => { setTexto(''); setStage('form'); }}
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

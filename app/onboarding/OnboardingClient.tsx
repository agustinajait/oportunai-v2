'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle, Video } from 'lucide-react';

interface Props {
  nombre:    string;
  areaLaboral: string;
  tieneVideo:  boolean;
  origen?:     string;
}

const AREAS = [
  'Gastronomía', 'Comercio', 'Construcción', 'Cuidados', 'Limpieza',
  'Logística', 'Administración', 'Tecnología', 'Salud', 'Educación', 'Otro',
];

const AREAS_EESS = [
  'Vendedor de playa', 'Vendedor de tienda', 'Lubriexperto',
  'Barista / Cafetería', 'Encargado de playa', 'Encargado de tienda',
  'Supervisor', 'Jefe de estación', 'Administrativo',
  'Embajador de tienda', 'Entrenador', 'Maestranza',
];

function OnboardingInner({ nombre, areaLaboral, tieneVideo, origen }: Props) {
  const esMentoress = origen === 'mentoress';
  const areas = esMentoress ? AREAS_EESS : AREAS;
  const router = useRouter();

  const [step, setStep]       = useState(1);
  const [area, setArea]       = useState(areaLaboral);
  const [videoOk, setVideoOk] = useState(tieneVideo);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const primer = nombre?.split(' ')[0] ?? 'hola';

  async function guardarAreaYContinuar() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/user/onboarding', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ area_laboral: area }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setStep(2);
    } catch {
      setError('No pudimos guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function completar(destino: string) {
    setSaving(true);
    try {
      await fetch('/api/user/onboarding', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ completar: true }),
      });
      router.push(destino);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {esMentoress ? (
            <>
              <img src="/logo-mentoress.png" alt="Mentor EESS" className="w-8 h-8 object-contain" />
              <span className="font-semibold text-ink-900">Mentor <span style={{ color: '#00B6D8' }}>EESS</span></span>
            </>
          ) : (
            <>
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs">✦</div>
              <span className="font-semibold text-ink-900">Oportunai</span>
            </>
          )}
        </div>
        <button
          onClick={() => completar('/dashboard')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Saltar →
        </button>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-gray-100 px-5 py-2.5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex gap-1.5">
            {[1, 2].map(n => (
              <div
                key={n}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  n < step ? 'bg-brand-600 w-8' : n === step ? 'bg-brand-600 w-8' : 'bg-gray-200 w-4'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">Paso {step} de 2</span>
        </div>
      </div>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">

          {/* ── Paso 1: Área laboral ────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-ink-900">Hola, {primer} 👋</h1>
                <p className="text-gray-500 mt-1">¿En qué área querés trabajar?</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {areas.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setArea(a)}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
                      area === a
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={guardarAreaYContinuar}
                disabled={!area || saving}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-40"
              >
                {saving ? 'Guardando...' : 'Continuar →'}
              </button>
            </div>
          )}

          {/* ── Paso 2: Video CV ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-ink-900">Grabá tu Video CV</h1>
                <p className="text-gray-500 mt-1">
                  En 90 segundos mostrás quién sos. Usamos ese video para armar tu perfil.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

                {/* Preview visual */}
                <div className="bg-ink-900 rounded-xl aspect-video flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center">
                    <Video size={22} className="text-white" />
                  </div>
                  <p className="text-white/60 text-sm">3 secciones guiadas · ~90 segundos</p>
                </div>

                {videoOk ? (
                  <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3.5">
                    <CheckCircle size={18} className="text-teal-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-teal-800 text-sm">Video grabado</p>
                      <p className="text-teal-600 text-xs">Tu presentación ya está en tu perfil.</p>
                    </div>
                  </div>
                ) : (
                  <a
                    href="/dashboard/grabar-cv?from=onboarding"
                    className="flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-center"
                    style={{ textDecoration: 'none' }}
                  >
                    🎥 Grabar mi Video CV
                  </a>
                )}

                {!videoOk && (
                  <button
                    onClick={() => setVideoOk(true)}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
                  >
                    Ya grabé mi video →
                  </button>
                )}
              </div>

              {/* Qué pasa después */}
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Después del video</p>
                {[
                  'Generamos tu CV profesional en segundos',
                  'Podés postularte a ofertas de trabajo',
                  'Las empresas te encuentran por tu perfil',
                ].map(t => (
                  <div key={t} className="flex items-start gap-2">
                    <span className="text-brand-500 text-xs mt-0.5 flex-shrink-0">→</span>
                    <p className="text-xs text-brand-800 leading-snug">{t}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => completar(videoOk ? '/dashboard/armar-cv' : '/dashboard')}
                disabled={saving}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Cargando...' : videoOk ? 'Generarme el CV →' : 'Hacerlo después →'}
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
              >
                ← Volver
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function OnboardingClient(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink-50" />}>
      <OnboardingInner {...props} />
    </Suspense>
  );
}

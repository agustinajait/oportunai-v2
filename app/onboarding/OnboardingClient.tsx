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
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d14' }}>

      {/* Header */}
      <div className="relative px-4 pt-12 pb-8" style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4B33CC 0%, transparent 60%)' }} />
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {esMentoress ? (
              <>
                <img src="/logo-mentoress.png" alt="Mentor EESS" className="w-8 h-8 object-contain" />
                <span className="font-bold text-white text-sm">Mentor <span style={{ color: '#00B6D8' }}>EESS</span></span>
              </>
            ) : (
              <>
                <img src="/logo.png" alt="Oportunai" className="w-7 h-7" />
                <span className="font-bold text-white text-sm">Oportunai</span>
              </>
            )}
          </div>
          <button
            onClick={() => completar('/dashboard')}
            className="text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Saltar →
          </button>
        </div>

        {/* Progress */}
        <div className="relative z-10">
          <div className="flex gap-1.5 mb-3">
            {[1, 2].map(n => (
              <div
                key={n}
                className="h-1 rounded-full flex-1 transition-all duration-300"
                style={{ background: n <= step ? '#7048F0' : 'rgba(255,255,255,0.15)' }}
              />
            ))}
          </div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Paso {step} de 2</p>
          <h1 className="text-white font-bold text-2xl leading-tight">
            {step === 1 ? `Hola, ${primer}` : 'Grabá tu Video CV'}
          </h1>
          <p className="text-white/55 text-sm mt-1">
            {step === 1 ? '¿En qué área querés trabajar?' : 'En 90 segundos mostrás quién sos.'}
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-8">

        {/* ── Paso 1: Área laboral ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {areas.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(a)}
                  className="px-4 py-2.5 rounded-full text-sm font-medium border transition-all active:scale-[0.97]"
                  style={area === a
                    ? { background: 'linear-gradient(135deg,#4B33CC,#7048F0)', borderColor: 'transparent', color: 'white', boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }
                    : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }
                  }
                >
                  {a}
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={guardarAreaYContinuar}
              disabled={!area || saving}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-40"
              style={area && !saving
                ? { background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }
                : { background: 'rgba(255,255,255,0.08)' }
              }
            >
              {saving ? 'Guardando...' : 'Continuar →'}
            </button>
          </div>
        )}

        {/* ── Paso 2: Video CV ── */}
        {step === 2 && (
          <div className="space-y-4">

            {/* Video preview card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(160deg,rgba(26,15,60,0.97),rgba(45,27,105,0.97))', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="aspect-video flex flex-col items-center justify-center gap-3"
                style={{ background: 'linear-gradient(135deg,#0d0d14,#1a0f3c)' }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}
                >
                  <Video size={24} className="text-white" />
                </div>
                <p className="text-white/50 text-xs">3 secciones guiadas · ~90 segundos</p>
              </div>

              <div className="p-4 space-y-3">
                {videoOk ? (
                  <div
                    className="flex items-center gap-3 rounded-xl p-3.5"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
                  >
                    <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-300 text-sm">Video grabado</p>
                      <p className="text-emerald-400/70 text-xs">Tu presentación ya está en tu perfil.</p>
                    </div>
                  </div>
                ) : (
                  <a
                    href="/dashboard/grabar-cv?from=onboarding"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm text-white text-center"
                    style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 14px rgba(109,40,217,0.35)', textDecoration: 'none' }}
                  >
                    🎥 Grabar mi Video CV
                  </a>
                )}

                {!videoOk && (
                  <button
                    onClick={() => setVideoOk(true)}
                    className="w-full text-xs py-1 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    Ya grabé mi video →
                  </button>
                )}
              </div>
            </div>

            {/* Beneficios */}
            <div
              className="rounded-2xl p-4 space-y-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Después del video</p>
              {[
                'Generamos tu CV profesional en segundos',
                'Podés postularte a ofertas de trabajo',
                'Las empresas te encuentran por tu perfil',
              ].map(t => (
                <div key={t} className="flex items-start gap-2.5">
                  <span className="text-violet-400 text-xs mt-0.5 flex-shrink-0">✓</span>
                  <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.6)' }}>{t}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => completar(videoOk ? '/dashboard/armar-cv' : '/dashboard')}
              disabled={saving}
              className="w-full flex items-center justify-center py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}
            >
              {saving ? 'Cargando...' : videoOk ? 'Generarme el CV →' : 'Hacerlo después →'}
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full text-sm py-2 transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              ← Volver
            </button>
          </div>
        )}

      </div>
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

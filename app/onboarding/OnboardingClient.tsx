'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle, Video } from 'lucide-react';

interface Props {
  nombre:      string;
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

const INTRO_SLIDES = [
  {
    title: 'Armá tu perfil',
    text: 'En minutos tenés tu perfil laboral digital completo. Las empresas te encuentran y vos encontrás las mejores oportunidades.',
    icon: (
      <svg viewBox="0 0 120 120" width="130" height="130" fill="none">
        <circle cx="60" cy="40" r="26" fill="#C7C7CC" />
        <ellipse cx="60" cy="100" rx="44" ry="24" fill="#C7C7CC" />
      </svg>
    ),
  },
  {
    title: 'Grabá tu Video CV',
    text: '90 segundos para mostrar quién sos. Las empresas te ven antes de leer nada. Tu cara, tu voz, tu personalidad.',
    icon: (
      <svg viewBox="0 0 120 120" width="130" height="130" fill="none">
        <rect x="8" y="28" width="72" height="64" rx="8" fill="#C7C7CC" />
        <polygon points="88,40 112,28 112,92 88,80" fill="#AEAEB2" />
        <circle cx="44" cy="60" r="16" fill="#E5E5EA" />
        <polygon points="38,52 38,68 56,60" fill="#C7C7CC" />
      </svg>
    ),
  },
  {
    title: 'Conseguí trabajo',
    text: 'Compartí tu perfil con empleadores, capacitate con cursos con certificado y conseguí tu próxima oportunidad laboral.',
    icon: (
      <svg viewBox="0 0 120 120" width="130" height="130" fill="none">
        <rect x="14" y="44" width="92" height="60" rx="8" fill="#C7C7CC" />
        <rect x="36" y="30" width="48" height="24" rx="6" fill="#AEAEB2" />
        <rect x="48" y="38" width="24" height="8" rx="2" fill="#C7C7CC" />
        <rect x="48" y="72" width="24" height="20" rx="4" fill="#E5E5EA" />
      </svg>
    ),
  },
];

function OnboardingInner({ nombre, areaLaboral, tieneVideo, origen }: Props) {
  const esMentoress = origen === 'mentoress';
  const router = useRouter();

  // intro slides (step 0), then real steps 1-2
  const [introSlide, setIntroSlide] = useState(0);
  const [showIntro, setShowIntro]   = useState(true);
  const [step, setStep]             = useState(1);
  const [areas, setAreas]           = useState<string[]>(() =>
    areaLaboral ? areaLaboral.split(',').map(a => a.trim()).filter(Boolean) : []
  );
  const [videoOk, setVideoOk] = useState(tieneVideo);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const primer = nombre?.split(' ')[0] ?? 'hola';

  function toggleArea(a: string) {
    setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  function introNext() {
    if (introSlide < INTRO_SLIDES.length - 1) {
      setIntroSlide(s => s + 1);
    } else {
      setShowIntro(false);
    }
  }

  async function saltear() {
    setShowIntro(false);
  }

  async function guardarAreaYContinuar() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/user/onboarding', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ area_laboral: areas.join(', ') }),
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

  const brandColor = esMentoress ? '#00B6D8' : '#5B3FE0';
  const slide = INTRO_SLIDES[introSlide];

  /* ── Pantallas de intro ─────────────────────────────────────── */
  if (showIntro) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Saltear */}
        <div className="flex justify-end px-5 pt-5">
          <button
            onClick={saltear}
            className="text-sm font-medium"
            style={{ color: '#8E8E93' }}
          >
            Saltear
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-8">
          {/* Título */}
          <h1
            className="text-4xl font-extrabold tracking-tight"
            style={{ color: brandColor }}
          >
            {slide.title}
          </h1>

          {/* Ícono */}
          <div className="opacity-80">
            {slide.icon}
          </div>

          {/* Descripción */}
          <p className="text-base text-ink-600 leading-relaxed max-w-xs">
            {slide.text}
          </p>
        </div>

        {/* Puntos + botón siguiente */}
        <div className="flex flex-col items-center gap-6 pb-12 px-8">
          {/* Dots */}
          <div className="flex gap-2 items-center">
            {INTRO_SLIDES.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width:  i === introSlide ? 20 : 8,
                  height: 8,
                  background: i === introSlide ? brandColor : '#D1D1D6',
                }}
              />
            ))}
          </div>

          {/* Botón */}
          <button
            onClick={introNext}
            className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.98]"
            style={{ background: brandColor }}
          >
            {introSlide < INTRO_SLIDES.length - 1 ? 'Siguiente' : 'Empezar →'}
          </button>
        </div>
      </div>
    );
  }

  /* ── Onboarding real ────────────────────────────────────────── */
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
                <p className="text-gray-500 mt-1">¿En qué áreas querés trabajar? <span className="text-gray-400 text-xs">(podés elegir más de una)</span></p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(esMentoress ? AREAS_EESS : AREAS).map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleArea(a)}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
                      areas.includes(a)
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
                disabled={areas.length === 0 || saving}
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
                  'Compartís tu perfil con empleadores',
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
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <OnboardingInner {...props} />
    </Suspense>
  );
}

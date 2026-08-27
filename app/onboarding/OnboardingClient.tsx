'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Props {
  nombre:           string;
  bioInicial:       string;
  fotoInicial:      string;
  areaLaboral:      string;
  tieneVideo:       boolean;
  tieneDiagnostico: boolean;
  tieneWhatsapp:    boolean;
}

const AREAS = [
  'Gastronomía', 'Comercio', 'Construcción', 'Cuidados', 'Limpieza',
  'Logística', 'Administración', 'Tecnología', 'Salud', 'Educación', 'Otro',
];

function OnboardingInner({ nombre, bioInicial, fotoInicial, areaLaboral, tieneVideo, tieneDiagnostico, tieneWhatsapp }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Determinar paso inicial: desde URL o desde progreso ya hecho
  const stepParam = parseInt(searchParams.get('step') ?? '0');
  const [step, setStep] = useState(() => {
    if (stepParam >= 1 && stepParam <= 4) return stepParam;
    // Recuperar paso guardado en localStorage (por si volvieron de grabar-cv)
    try {
      const saved = parseInt(localStorage.getItem('onboarding_step') ?? '1');
      if (saved >= 1 && saved <= 4) return saved;
    } catch { /* localStorage no disponible */ }
    return 1;
  });

  const [bio,       setBio]       = useState(bioInicial);
  const [area,      setArea]      = useState(areaLaboral);
  const [guardando, setGuardando] = useState(false);
  const [videoOk,   setVideoOk]   = useState(tieneVideo);
  const [diagOk,    setDiagOk]    = useState(tieneDiagnostico);
  const [error,     setError]     = useState('');

  // Persistir paso actual en localStorage
  useEffect(() => {
    try { localStorage.setItem('onboarding_step', String(step)); } catch { /* noop */ }
  }, [step]);

  const primer = nombre.split(' ')[0];
  const TOTAL  = 4;

  async function guardarPerfil() {
    setGuardando(true);
    setError('');
    try {
      const res = await fetch('/api/user/onboarding', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bio, area_laboral: area }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setStep(2);
    } catch {
      setError('No pudimos guardar. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function completarOnboarding() {
    setGuardando(true);
    try {
      // Activar WhatsApp opt-in
      await fetch('/api/whatsapp/opt-in', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ activo: true }),
      });
      // Marcar onboarding completo
      await fetch('/api/user/onboarding', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ completar: true }),
      });
      try { localStorage.removeItem('onboarding_step'); } catch { /* noop */ }
      router.push('/dashboard?bienvenida=onboarding');
    } catch {
      setError('Error al finalizar. Intentá de nuevo.');
      setGuardando(false);
    }
  }

  async function saltarYCompletar() {
    setGuardando(true);
    try {
      await fetch('/api/user/onboarding', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ completar: true }),
      });
      router.push('/dashboard');
    } catch {
      setGuardando(false);
    }
  }

  const barWidth = `${((step - 1) / (TOTAL - 1)) * 100}%`;

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">✦</div>
          <span className="font-semibold text-ink-900 text-lg">Oportunai</span>
        </div>
        <button
          onClick={saltarYCompletar}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Saltar →
        </button>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Paso {step} de {TOTAL}</span>
            <span>{Math.round(((step - 1) / (TOTAL - 1)) * 100)}% completado</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
              style={{ width: barWidth }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* ── Paso 1: Perfil básico ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-1">Paso 1 · Tu perfil</p>
                <h1 className="text-2xl font-bold text-ink-900">Hola, {primer} 👋</h1>
                <p className="text-gray-500 mt-1">Contanos un poco sobre vos para armar tu perfil laboral.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

                {/* Área laboral */}
                <div>
                  <label className="block text-sm font-semibold text-ink-900 mb-2">
                    ¿En qué área querés trabajar?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AREAS.map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setArea(a)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          area === a
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-ink-900 mb-1">
                    Contate brevemente (1-2 oraciones)
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Ej: Tengo 3 años de experiencia en gastronomía y estoy buscando trabajo en zona norte."
                    rows={3}
                    maxLength={300}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-ink-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/300</p>
                </div>

              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={guardarPerfil}
                disabled={!area || guardando}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Continuar →'}
              </button>
            </div>
          )}

          {/* ── Paso 2: Video CV ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-1">Paso 2 · Tu presentación</p>
                <h1 className="text-2xl font-bold text-ink-900">Grabá tu Video CV</h1>
                <p className="text-gray-500 mt-1">En 90 segundos tenés tu carta de presentación. El sistema te guía con preguntas.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="bg-ink-900 rounded-xl aspect-video flex flex-col items-center justify-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center">
                    <span className="text-white text-xl">▶</span>
                  </div>
                  <p className="text-white text-sm opacity-70">3 preguntas guiadas · 90 segundos</p>
                </div>

                {videoOk ? (
                  <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4">
                    <span className="text-teal-600 text-xl">✓</span>
                    <div>
                      <p className="font-semibold text-teal-800 text-sm">Video grabado</p>
                      <p className="text-teal-600 text-xs">Tu presentación ya está lista en tu perfil.</p>
                    </div>
                  </div>
                ) : (
                  <a
                    href="/dashboard/grabar-cv?from=onboarding"
                    className="block w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-center mb-3"
                  >
                    🎥 Grabar mi Video CV
                  </a>
                )}

                {!videoOk && (
                  <button
                    onClick={() => setVideoOk(true)}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
                  >
                    Ya grabé mi video →
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-2 flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {videoOk ? 'Continuar →' : 'Hacer después →'}
                </button>
              </div>
            </div>
          )}

          {/* ── Paso 3: Diagnóstico Korai ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-1">Paso 3 · Tu situación</p>
                <h1 className="text-2xl font-bold text-ink-900">Diagnóstico Korai</h1>
                <p className="text-gray-500 mt-1">Para acompañarte bien, Korai necesita entender tu situación actual. Son 3 minutos.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

                {/* Semáforo preview */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {['Empleo', 'Educación', 'Ingresos', 'Salud', 'Vivienda', 'Red social'].map(dim => (
                    <div key={dim} className="flex flex-col items-center gap-1 py-3 bg-gray-50 rounded-xl">
                      <div className={`w-3 h-3 rounded-full ${diagOk ? 'bg-teal-500' : 'bg-gray-200'}`} />
                      <span className="text-xs text-gray-500">{dim}</span>
                    </div>
                  ))}
                </div>

                {diagOk ? (
                  <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4">
                    <span className="text-teal-600 text-xl">✓</span>
                    <div>
                      <p className="font-semibold text-teal-800 text-sm">Diagnóstico completado</p>
                      <p className="text-teal-600 text-xs">Korai ya tiene tu contexto cargado.</p>
                    </div>
                  </div>
                ) : (
                  <a
                    href="/api/korai/redirect?from=onboarding"
                    className="block w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-center mb-3"
                  >
                    🚦 Hacer el diagnóstico
                  </a>
                )}

                {!diagOk && (
                  <button
                    onClick={() => setDiagOk(true)}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
                  >
                    Ya lo hice →
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {diagOk ? 'Continuar →' : 'Hacer después →'}
                </button>
              </div>
            </div>
          )}

          {/* ── Paso 4: WhatsApp ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-1">Paso 4 · Acompañamiento</p>
                <h1 className="text-2xl font-bold text-ink-900">Activar Korai por WhatsApp</h1>
                <p className="text-gray-500 mt-1">Korai te va a acompañar en tu búsqueda. Te escribe cuando hay algo concreto que hacer.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="text-2xl">🤝</span>
                  <div>
                    <p className="font-semibold text-ink-900 text-sm">Nunca empieza de cero</p>
                    <p className="text-gray-500 text-xs mt-0.5">Retoma la conversación desde donde quedaste, aunque pasen semanas.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-semibold text-ink-900 text-sm">Mensajes con motivo concreto</p>
                    <p className="text-gray-500 text-xs mt-0.5">No te manda mensajes genéricos. Te escribe cuando hay algo que avanzar.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="text-2xl">📲</span>
                  <div>
                    <p className="font-semibold text-ink-900 text-sm">Podés desactivarlo cuando quieras</p>
                    <p className="text-gray-500 text-xs mt-0.5">Desde tu perfil podés pausar el acompañamiento en cualquier momento.</p>
                  </div>
                </div>

              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={completarOnboarding}
                disabled={guardando}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {guardando ? 'Activando...' : '✓ Activar y entrar al dashboard'}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  ← Atrás
                </button>
                <button
                  onClick={saltarYCompletar}
                  disabled={guardando}
                  className="flex-1 text-sm text-gray-400 hover:text-gray-600 py-3 rounded-xl transition-colors"
                >
                  Entrar sin activar →
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function OnboardingClient(props: Props) {
  return (
    <Suspense>
      <OnboardingInner {...props} />
    </Suspense>
  );
}

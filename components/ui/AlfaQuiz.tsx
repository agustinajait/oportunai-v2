'use client';

import { useState } from 'react';

interface Props {
  onComplete: (score: number, badge: string) => void;
  onSkip: () => void;
}

const PREGUNTAS = [
  {
    emoji: '📱',
    pregunta: '¿Tenés celular propio con internet?',
    sub: null,
    opciones: [
      { emoji: '✅', texto: 'Sí, tengo y siempre tengo datos', pts: 3 },
      { emoji: '🔋', texto: 'Sí, pero a veces me quedo sin datos', pts: 2 },
      { emoji: '👨‍👩‍👧', texto: 'Uso el de un familiar o comparto', pts: 1 },
      { emoji: '❌', texto: 'No tengo celular propio con internet', pts: 0 },
    ],
  },
  {
    emoji: '💬',
    pregunta: '¿Usás WhatsApp para el trabajo o para buscar trabajo?',
    sub: 'Mandás mensajes, fotos, coordinás horarios...',
    opciones: [
      { emoji: '🔥', texto: 'Sí, todo el tiempo', pts: 3 },
      { emoji: '👍', texto: 'Sí, de vez en cuando', pts: 2 },
      { emoji: '🆕', texto: 'Lo tengo pero recién estoy aprendiendo', pts: 1 },
      { emoji: '❌', texto: 'No uso WhatsApp', pts: 0 },
    ],
  },
  {
    emoji: '💳',
    pregunta: '¿Alguna vez hiciste un pago o cobro por el celular?',
    sub: 'Mercado Pago, billetera virtual, transferencia...',
    opciones: [
      { emoji: '💪', texto: 'Sí, lo uso seguido', pts: 3 },
      { emoji: '👀', texto: 'Lo hice alguna vez', pts: 2 },
      { emoji: '📰', texto: 'Lo vi pero todavía no lo usé', pts: 1 },
      { emoji: '💵', texto: 'Prefiero el efectivo, no lo uso', pts: 0 },
    ],
  },
  {
    emoji: '📲',
    pregunta: '¿Usaste alguna vez una app para buscar trabajo, pedir un auto o pedir comida?',
    sub: 'Computrabajo, Rappi, Uber, PedidosYa...',
    opciones: [
      { emoji: '🚀', texto: 'Sí, uso varias apps así', pts: 3 },
      { emoji: '👌', texto: 'Usé alguna sí', pts: 2 },
      { emoji: '🆕', texto: 'Conozco pero todavía no las usé', pts: 1 },
      { emoji: '❌', texto: 'No uso ese tipo de apps', pts: 0 },
    ],
  },
  {
    emoji: '🤖',
    pregunta: '¿Escuchaste hablar de ChatGPT o alguna inteligencia artificial?',
    sub: 'Programas que responden preguntas, generan texto o imágenes...',
    opciones: [
      { emoji: '🤩', texto: 'Sí, lo uso seguido', pts: 3 },
      { emoji: '🧪', texto: 'Lo probé alguna vez', pts: 2 },
      { emoji: '📺', texto: 'Escuché en las noticias pero no lo usé', pts: 1 },
      { emoji: '❓', texto: 'No sé qué es', pts: 0 },
    ],
  },
];

function calcularNivel(score: number): { nivel: string; badge: string; emoji: string; descripcion: string } {
  if (score <= 4) {
    return {
      nivel: 'Empezando digital',
      badge: 'En desarrollo digital',
      emoji: '🌱',
      descripcion: 'Estás comenzando tu camino digital. Con pequeños pasos vas a poder aprovechar más las herramientas que te ofrece el celular.',
    };
  }
  if (score <= 9) {
    return {
      nivel: 'Usuario activo',
      badge: 'Usuario digital activo',
      emoji: '⚡',
      descripcion: 'Ya usás el celular para cosas importantes del día a día. Tenés una base sólida para seguir creciendo digitalmente.',
    };
  }
  return {
    nivel: 'Nativo digital',
    badge: 'Perfil nativo digital',
    emoji: '🚀',
    descripcion: 'Manejás las herramientas digitales con soltura. Tu perfil tecnológico es un diferencial real en el mercado laboral.',
  };
}

type Stage = 'intro' | 'quiz' | 'resultado';

export default function AlfaQuiz({ onComplete, onSkip }: Props) {
  const [stage, setStage] = useState<Stage>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [respuestas, setRespuestas] = useState<number[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const score = respuestas.reduce((a, b) => a + b, 0);
  const resultado = calcularNivel(score);

  function handleOpcion(pts: number, idx: number) {
    if (advancing) return;
    setSelectedIdx(idx);
    setAdvancing(true);
    setTimeout(() => {
      const nuevas = [...respuestas, pts];
      setRespuestas(nuevas);
      setSelectedIdx(null);
      setAdvancing(false);
      if (currentQ + 1 < PREGUNTAS.length) {
        setCurrentQ(currentQ + 1);
      } else {
        setStage('resultado');
      }
    }, 400);
  }

  const pregunta = PREGUNTAS[currentQ];
  const progreso = ((currentQ) / PREGUNTAS.length) * 100;

  /* ── INTRO ───────────────────────────────────────────────────────── */
  if (stage === 'intro') {
    return (
      <div className="w-full max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-[#533AB7] px-8 py-10 text-center">
            <div className="text-6xl mb-4">📱</div>
            <h1 className="text-2xl font-bold text-white mb-2">Test de alfabetización digital</h1>
            <p className="text-purple-200 text-sm">5 preguntas · 2 minutos</p>
          </div>
          <div className="px-8 py-6">
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Respondé estas 5 preguntas para saber cuál es tu perfil digital. El resultado se va a mostrar a las empresas que vean tu perfil.
            </p>
            <div className="space-y-3 mb-8">
              {['Sin respuestas incorrectas', 'Completamente anónimo', 'Solo tarda 2 minutos'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#533AB7] flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStage('quiz')}
              className="w-full bg-[#533AB7] hover:bg-purple-800 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Empezar el test →
            </button>
            <button
              onClick={onSkip}
              className="w-full mt-3 text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
            >
              Omitir por ahora
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── QUIZ ────────────────────────────────────────────────────────── */
  if (stage === 'quiz') {
    return (
      <div className="w-full max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-purple-100">
            <div
              className="h-full bg-[#533AB7] transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>

          {/* Question header */}
          <div className="bg-[rgba(83,58,183,0.07)] px-8 py-6 text-center">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-purple-500 font-medium">
                {currentQ + 1} de {PREGUNTAS.length}
              </span>
              <div className="flex gap-1">
                {PREGUNTAS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < currentQ ? 'bg-[#533AB7]' : i === currentQ ? 'bg-[#533AB7] opacity-60' : 'bg-purple-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-4xl mb-3">{pregunta.emoji}</div>
            <h2 className="text-lg font-semibold text-gray-800 leading-snug">{pregunta.pregunta}</h2>
            {pregunta.sub && (
              <p className="text-sm text-gray-400 mt-1">{pregunta.sub}</p>
            )}
          </div>

          {/* Options */}
          <div className="px-6 py-5 space-y-3">
            {pregunta.opciones.map((op, idx) => (
              <button
                key={idx}
                onClick={() => handleOpcion(op.pts, idx)}
                disabled={advancing}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                  selectedIdx === idx
                    ? 'border-[#533AB7] bg-[rgba(83,58,183,0.08)] scale-[0.98]'
                    : 'border-gray-100 hover:border-purple-300 hover:bg-purple-50'
                } ${advancing && selectedIdx !== idx ? 'opacity-40' : ''}`}
              >
                <span className="text-xl flex-shrink-0">{op.emoji}</span>
                <span className="text-sm text-gray-700 font-medium">{op.texto}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── RESULTADO ───────────────────────────────────────────────────── */
  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#533AB7] px-8 py-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
            {resultado.emoji}
          </div>
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
            {resultado.nivel}
          </span>
          <h2 className="text-xl font-bold text-white">{resultado.badge}</h2>
          <p className="text-purple-200 text-sm mt-1">{score} / 15 puntos</p>
        </div>

        <div className="px-8 py-6">
          <p className="text-gray-600 text-sm leading-relaxed mb-5">{resultado.descripcion}</p>

          {/* Score bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>0</span>
              <span>15</span>
            </div>
            <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#533AB7] rounded-full transition-all duration-700"
                style={{ width: `${(score / 15) * 100}%` }}
              />
            </div>
          </div>

          {/* Lo que verán las empresas */}
          <div className="bg-[rgba(83,58,183,0.06)] border border-purple-100 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">
              Lo que verán las empresas
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg">{resultado.emoji}</span>
              <span className="text-sm font-medium text-gray-800">{resultado.badge}</span>
            </div>
          </div>

          <button
            onClick={() => onComplete(score, resultado.badge)}
            className="w-full bg-[#533AB7] hover:bg-purple-800 text-white font-semibold py-3.5 rounded-xl transition-colors"
          >
            Guardar y continuar →
          </button>
          <button
            onClick={onSkip}
            className="w-full mt-3 text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
          >
            Omitir
          </button>
        </div>
      </div>
    </div>
  );
}

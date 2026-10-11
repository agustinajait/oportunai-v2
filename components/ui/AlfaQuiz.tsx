'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';

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
  const progreso = (currentQ / PREGUNTAS.length) * 100;

  /* ── INTRO ───────────────────────────────────────────────────────── */
  if (stage === 'intro') {
    return (
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="relative px-4 pt-12 pb-8" style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4B33CC 0%, transparent 60%)' }} />
          <button onClick={onSkip} className="relative z-10 flex items-center gap-1.5 text-sm mb-5 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft size={15} /> Volver
          </button>
          <div className="relative z-10 text-center">
            <span className="text-5xl block mb-3">📱</span>
            <h1 className="text-white font-bold text-2xl leading-tight mb-1.5">Test de alfabetización digital</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>5 preguntas · 2 minutos</p>
          </div>
        </div>

        <div className="flex-1 px-4 pt-5 pb-8 max-w-lg mx-auto w-full space-y-4">
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Respondé estas 5 preguntas para saber cuál es tu perfil digital. El resultado se va a mostrar a las empresas que vean tu perfil.
            </p>
            <div className="space-y-2.5 pt-1">
              {['Sin respuestas incorrectas', 'Completamente anónimo', 'Solo tarda 2 minutos'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle size={15} style={{ color: '#34d399', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStage('quiz')}
            className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}
          >
            Empezar el test →
          </button>
          <button
            onClick={onSkip}
            className="w-full text-sm py-2 transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Omitir por ahora
          </button>
        </div>
      </div>
    );
  }

  /* ── QUIZ ────────────────────────────────────────────────────────── */
  if (stage === 'quiz') {
    return (
      <div className="flex flex-col flex-1">
        {/* Header con progreso */}
        <div className="relative px-4 pt-10 pb-7" style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4B33CC 0%, transparent 60%)' }} />
          <div className="relative z-10">
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>{currentQ + 1} de {PREGUNTAS.length}</span>
              <div className="flex gap-1.5">
                {PREGUNTAS.map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-1.5 rounded-full transition-all duration-300"
                    style={{ background: i < currentQ ? '#7048F0' : i === currentQ ? 'rgba(112,72,240,0.6)' : 'rgba(255,255,255,0.15)' }}
                  />
                ))}
              </div>
            </div>
            <div className="h-1 rounded-full overflow-hidden mb-5" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progreso}%`, background: 'linear-gradient(90deg,#4B33CC,#7048F0)' }} />
            </div>

            {/* Question */}
            <div className="text-center">
              <span className="text-4xl block mb-3">{pregunta.emoji}</span>
              <h2 className="font-bold text-lg leading-snug" style={{ color: 'rgba(255,255,255,0.95)' }}>{pregunta.pregunta}</h2>
              {pregunta.sub && (
                <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{pregunta.sub}</p>
              )}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="flex-1 px-4 pt-5 pb-8 max-w-lg mx-auto w-full space-y-3">
          {pregunta.opciones.map((op, idx) => (
            <button
              key={idx}
              onClick={() => handleOpcion(op.pts, idx)}
              disabled={advancing}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={selectedIdx === idx
                ? { background: 'linear-gradient(135deg,rgba(75,51,204,0.35),rgba(112,72,240,0.35))', border: '1.5px solid rgba(112,72,240,0.6)', transform: 'scale(0.98)' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', opacity: advancing && selectedIdx !== idx ? 0.4 : 1 }
              }
            >
              <span className="text-xl flex-shrink-0">{op.emoji}</span>
              <span className="text-sm font-medium" style={{ color: selectedIdx === idx ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)' }}>{op.texto}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── RESULTADO ───────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col flex-1">
      {/* Header celebración */}
      <div className="relative px-4 pt-12 pb-8 text-center" style={{ background: 'linear-gradient(135deg,#1a0f3c,#2d1b69,#064e3b)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 40%, #34d399 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl" style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)' }}>
            {resultado.emoji}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span className="text-xs font-bold uppercase tracking-wider text-white">{resultado.nivel}</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{resultado.badge}</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{score} / 15 puntos</p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-8 max-w-lg mx-auto w-full space-y-4">
        {/* Descripción */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{resultado.descripcion}</p>

          {/* Barra de score */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span>0 pts</span>
              <span>15 pts</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(score / 15) * 100}%`, background: 'linear-gradient(90deg,#4B33CC,#34d399)' }}
              />
            </div>
          </div>
        </div>

        {/* Badge preview */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#34d399' }}>Lo que verán las empresas</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">{resultado.emoji}</span>
              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{resultado.badge}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onComplete(score, resultado.badge)}
          className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}
        >
          Guardar y continuar →
        </button>
        <button
          onClick={onSkip}
          className="w-full text-sm py-2 transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          Omitir
        </button>
      </div>
    </div>
  );
}

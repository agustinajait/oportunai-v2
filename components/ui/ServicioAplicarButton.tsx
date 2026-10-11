'use client';
import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

interface Props {
  servicioId: string;
  yaAplico: boolean;
}

export default function ServicioAplicarButton({ servicioId, yaAplico: initialYaAplico }: Props) {
  const [yaAplico, setYaAplico] = useState(initialYaAplico);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function aplicar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/servicios/${servicioId}/aplicar`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setYaAplico(true);
      } else {
        setError(data.error ?? 'Error al aplicar. Intentá de nuevo.');
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    }
    setLoading(false);
  }

  if (yaAplico) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="flex items-center gap-2 font-semibold mb-1" style={{ color: '#34d399' }}>
          <CheckCircle2 size={20} />
          ¡Postulación enviada!
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          La empresa revisará tu perfil y te contactará si avanzás.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="font-semibold text-sm mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>¿Te interesa este servicio?</p>
      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Enviá tu postulación ahora. La empresa verá tu Video CV y te contactará.
      </p>
      <button
        onClick={aplicar}
        disabled={loading}
        className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 16px rgba(109,40,217,0.35)' }}
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Enviando…</>
          : <><Send size={15} /> Aplicar a este servicio</>
        }
      </button>
      {error && (
        <p className="text-sm mt-2" style={{ color: '#fca5a5' }}>{error}</p>
      )}
    </div>
  );
}

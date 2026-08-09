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
      <div className="card p-5">
        <div className="flex items-center gap-2 text-teal-700 font-semibold mb-1">
          <CheckCircle2 size={20} />
          ¡Postulación enviada!
        </div>
        <p className="text-sm text-ink-500">
          La empresa revisará tu perfil y te contactará si avanzás.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <p className="font-semibold text-ink-900 mb-1">¿Te interesa este servicio?</p>
      <p className="text-sm text-ink-500 mb-4">
        Enviá tu postulación ahora. La empresa verá tu Video CV y te contactará.
      </p>
      <button
        onClick={aplicar}
        disabled={loading}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Enviando…</>
          : <><Send size={15} /> Aplicar a este servicio</>
        }
      </button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}

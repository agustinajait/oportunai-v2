'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Building2, User, Star, Briefcase, Mail } from 'lucide-react';

export default function ValidarClient({
  token, candidato, empresa_nombre, referidor_nombre, estadoInicial,
}: {
  token: string;
  candidato: string;
  empresa_nombre: string;
  referidor_nombre: string;
  estadoInicial: string;
}) {
  const [validando, setValidando] = useState(false);
  const [cargo, setCargo] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [done, setDone] = useState(estadoInicial === 'validada');
  const [error, setError] = useState<string | null>(null);

  const handleValidar = async () => {
    if (!cargo.trim()) { setError('Completá tu cargo o puesto en la empresa'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Ingresá un email válido'); return; }
    setValidando(true);
    setError(null);
    try {
      const res = await fetch(`/api/referencias/validar/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cargo: cargo.trim(), email: email.trim(), mensaje }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const j = await res.json();
        setError(j.error ?? 'Error al validar');
      }
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setValidando(false);
    }
  };

  const firstName = candidato.split(' ')[0];

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Star size={16} className="text-white" fill="white" />
            </div>
            <span className="font-display text-xl font-semibold text-ink-800">Oportunai</span>
          </Link>
        </div>

        {done ? (
          <div className="card p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} className="text-emerald-600" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink-900">¡Gracias por validar!</h1>
            <p className="text-ink-500 text-sm leading-relaxed">
              La referencia de <strong>{candidato}</strong> quedó verificada y aparece en su perfil con el badge ⭐ Verificado.
            </p>
            <Link href="/" className="btn-primary justify-center w-full mt-2">
              Conocer Oportunai →
            </Link>
          </div>
        ) : (
          <div className="card p-8 space-y-5">
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink-900 mb-2">
                Validar referencia laboral
              </h1>
              <p className="text-ink-500 text-sm leading-relaxed">
                <strong>{candidato}</strong> te nombró como referente. Si trabajaste con esa persona, confirmalo completando los datos.
              </p>
            </div>

            {/* Datos del candidato */}
            <div className="space-y-2">
              <div className="bg-ink-50 rounded-xl p-4 flex items-start gap-3">
                <Building2 size={16} className="text-ink-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-ink-400 mb-0.5">Empresa</p>
                  <p className="font-medium text-ink-800">{empresa_nombre}</p>
                </div>
              </div>
              <div className="bg-ink-50 rounded-xl p-4 flex items-start gap-3">
                <User size={16} className="text-ink-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-ink-400 mb-0.5">Tu nombre (ingresado por el candidato)</p>
                  <p className="font-medium text-ink-800">{referidor_nombre}</p>
                </div>
              </div>
            </div>

            {/* Datos del referente — obligatorios */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest">Tus datos para verificar</p>
              <div>
                <label className="text-xs font-medium text-ink-600 block mb-1.5">
                  Tu cargo en {empresa_nombre} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    value={cargo}
                    onChange={e => setCargo(e.target.value)}
                    placeholder="Ej: Gerente, Supervisor, Encargado..."
                    className="input-field text-sm pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-600 block mb-1.5">
                  Tu email de contacto <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    className="input-field text-sm pl-9"
                  />
                </div>
                <p className="text-xs text-ink-300 mt-1">
                  Visible para las empresas que quieran verificar. No se usa para nada más.
                </p>
              </div>
            </div>

            {/* Mensaje opcional */}
            <div>
              <label className="text-xs font-medium text-ink-600 block mb-1.5">
                Mensaje opcional — aparecerá en el perfil de {firstName}
              </label>
              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder={`Ej: "${firstName} trabajó con nosotros y es muy responsable y puntual..."`}
                className="input-field resize-none text-sm"
              />
              <p className="text-xs text-ink-300 mt-1 text-right">{mensaje.length}/300</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              onClick={handleValidar}
              disabled={validando}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {validando
                ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <CheckCircle2 size={18} />
              }
              {validando ? 'Validando...' : 'Confirmar referencia'}
            </button>

            <p className="text-xs text-ink-300 text-center">
              Si no conocés a {firstName} o no querés validar, cerrá esta página.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

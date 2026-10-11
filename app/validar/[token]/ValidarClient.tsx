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

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12, padding: '11px 12px 11px 36px', fontSize: 14, color: 'rgba(255,255,255,0.9)',
    outline: 'none',
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 6 };
  const iconWrapStyle: React.CSSProperties = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d14' }}>

      {/* Header */}
      <div className="relative px-4 pt-12 pb-8 text-center" style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4B33CC 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>
              <Star size={14} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-white text-sm">Oportunai</span>
          </Link>
          <h1 className="font-bold text-2xl text-white mb-1.5">Validar referencia laboral</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{candidato}</strong> te nombró como referente
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 pb-8 max-w-md mx-auto w-full">

        {done ? (
          <div className="rounded-2xl p-8 text-center space-y-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <CheckCircle2 size={36} style={{ color: '#34d399' }} />
            </div>
            <h2 className="font-bold text-xl" style={{ color: 'rgba(255,255,255,0.95)' }}>¡Gracias por validar!</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              La referencia de <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{candidato}</strong> quedó verificada y aparece en su perfil con el badge ⭐ Verificado.
            </p>
            <Link
              href="/"
              className="flex items-center justify-center w-full py-3.5 rounded-2xl font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 16px rgba(109,40,217,0.4)' }}
            >
              Conocer Oportunai →
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Info del candidato */}
            <div className="space-y-2">
              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Building2 size={15} style={{ color: 'rgba(255,255,255,0.4)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Empresa</p>
                  <p className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{empresa_nombre}</p>
                </div>
              </div>
              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <User size={15} style={{ color: 'rgba(255,255,255,0.4)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Tu nombre (ingresado por el candidato)</p>
                  <p className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{referidor_nombre}</p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Tus datos para verificar</p>

              <div>
                <label style={labelStyle}>Tu cargo en {empresa_nombre} <span style={{ color: '#f87171' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrapStyle}><Briefcase size={13} /></span>
                  <input
                    value={cargo}
                    onChange={e => setCargo(e.target.value)}
                    placeholder="Ej: Gerente, Supervisor, Encargado..."
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tu email de contacto <span style={{ color: '#f87171' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrapStyle}><Mail size={13} /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    style={inputStyle}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Visible para las empresas que quieran verificar. No se usa para nada más.</p>
              </div>
            </div>

            {/* Mensaje opcional */}
            <div>
              <label style={labelStyle}>Mensaje opcional — aparecerá en el perfil de {firstName}</label>
              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder={`Ej: "${firstName} trabajó con nosotros y es muy responsable y puntual..."`}
                style={{ ...inputStyle, padding: '11px 12px', resize: 'none', height: 'auto' }}
              />
              <p className="text-xs mt-1 text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>{mensaje.length}/300</p>
            </div>

            {error && (
              <p className="text-sm rounded-xl px-4 py-3" style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
            )}

            <button
              onClick={handleValidar}
              disabled={validando}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}
            >
              {validando
                ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <CheckCircle2 size={18} />
              }
              {validando ? 'Validando...' : 'Confirmar referencia'}
            </button>

            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Si no conocés a {firstName} o no querés validar, cerrá esta página.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

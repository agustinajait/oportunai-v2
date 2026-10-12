'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterEmpresaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origen = searchParams.get('origen') ?? undefined;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    nombre_empresa: '',
    rubro: '',
    ciudad: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register-empresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, origen }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar');
      router.push('/empresa/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 10,
    padding: '9px 12px', fontSize: 14, color: 'rgba(255,255,255,0.85)',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
    display: 'block', marginBottom: 5,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: 32, width: '100%', maxWidth: 440,
      }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>Registrá tu empresa</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 6, fontSize: 14 }}>Publicá ofertas y encontrá candidatos con Video CV</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre de la empresa *</label>
            <input
              name="nombre_empresa"
              value={form.nombre_empresa}
              onChange={handleChange}
              placeholder="Ej: Acme S.A."
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Rubro</label>
              <input
                name="rubro"
                value={form.rubro}
                onChange={handleChange}
                placeholder="Ej: Tecnología"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Ciudad</label>
              <input
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
                placeholder="Ej: Buenos Aires"
                style={inputStyle}
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

          <div>
            <label style={labelStyle}>Tu nombre completo *</label>
            <input
              name="nombre_completo"
              value={form.nombre_completo}
              onChange={handleChange}
              placeholder="Ej: María González"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="empresa@mail.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Contraseña *</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 13, borderRadius: 8, padding: '8px 12px' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', background: 'linear-gradient(135deg,#4B33CC,#7048F0)',
              color: '#fff', borderRadius: 10, padding: '11px 0',
              fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s',
              boxShadow: '0 4px 14px rgba(109,40,217,0.3)',
            }}
          >
            {loading ? 'Registrando...' : 'Crear cuenta de empresa'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 20 }}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" style={{ color: '#a78bfa', textDecoration: 'none' }}>Iniciá sesión</Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          ¿Sos candidato?{' '}
          <Link href="/register" style={{ color: '#a78bfa', textDecoration: 'none' }}>Registrate acá</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterEmpresaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0d0d14' }} />}>
      <RegisterEmpresaForm />
    </Suspense>
  );
}

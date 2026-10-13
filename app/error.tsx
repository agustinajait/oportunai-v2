'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F0F0F8', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#4B33CC,#7048F0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28 }}>
          ⚠️
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111118', marginBottom: 8 }}>Algo salió mal</h1>
        <p style={{ fontSize: 14, color: '#6B6B80', lineHeight: 1.6, marginBottom: 28 }}>
          Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={reset} style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Intentar de nuevo
          </button>
          <Link href="/dashboard" style={{ background: '#fff', color: '#5B3FE0', border: '1.5px solid #D0C8F8', borderRadius: 12, padding: '11px 22px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

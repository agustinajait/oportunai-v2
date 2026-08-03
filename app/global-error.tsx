'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F0F0F8', margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 400, textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111118', marginBottom: 8 }}>Error crítico</h1>
          <p style={{ fontSize: 14, color: '#6B6B80', lineHeight: 1.6, marginBottom: 28 }}>
            La aplicación tuvo un problema grave. Intentá recargar la página.
          </p>
          <button onClick={reset} style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}

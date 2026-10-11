import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: '#0d0d14' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)' }}>
        <span style={{ color: '#fff', fontSize: 24, fontWeight: 900 }}>O</span>
      </div>
      <h1 className="font-bold text-6xl mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>404</h1>
      <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Esta página no existe o el perfil no fue encontrado.</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl font-bold text-white transition-all active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}

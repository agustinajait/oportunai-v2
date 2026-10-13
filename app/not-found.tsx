import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mb-6">
        <Sparkles size={26} className="text-brand-600" />
      </div>
      <h1 className="font-display text-5xl font-semibold text-ink-900 mb-3">404</h1>
      <p className="text-ink-500 text-lg mb-8">Esta página no existe o el perfil no fue encontrado.</p>
      <Link href="/" className="btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
}

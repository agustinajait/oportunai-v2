import Link from 'next/link';
import { Video, Mic, Share2, ChevronRight, Sparkles, Building2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-50 overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-ink-800">Oportunai</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/register-empresa" className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-brand-600 transition-colors font-medium">
            <Building2 size={15} />
            Soy empresa
          </Link>
          <Link href="/login" className="btn-ghost text-sm">
            Iniciar sesión
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2">
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-brand-200 animate-fade-in">
          <Sparkles size={13} />
          <span>Plataforma de capacitación laboral</span>
        </div>

        <h1
          className="font-display text-5xl md:text-7xl font-light text-ink-900 leading-tight mb-6"
          style={{ animationDelay: '0.1s' }}
        >
          Creá tu{' '}
          <span className="text-brand-600 font-semibold italic">Video CV</span>
          <br />o{' '}
          <span className="text-brand-600 font-semibold italic">Video Pitch</span>
          <br />
          <span className="text-ink-400 font-light">en minutos</span>
        </h1>

        <p className="text-ink-500 text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
          Presentate con video, compartí tu perfil y destacate en el mercado laboral o como emprendedor.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <Link href="/register?tipo=cv" className="btn-primary text-base px-8 py-4 rounded-2xl shadow-lg shadow-brand-200">
            <Video size={18} />
            Crear mi Video CV
            <ChevronRight size={16} />
          </Link>
          <Link href="/register?tipo=pitch" className="btn-secondary text-base px-8 py-4 rounded-2xl">
            <Mic size={18} />
            Crear mi Video Pitch
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Video,
              title: 'Video CV',
              desc: 'Presentate visualmente: estudios, experiencia y motivación en menos de 60 segundos.',
              color: 'bg-brand-50 text-brand-600',
            },
            {
              icon: Mic,
              title: 'Video Pitch',
              desc: 'Mostrá tu emprendimiento: problema, solución, producto y cierre en 60 segundos.',
              color: 'bg-emerald-50 text-emerald-600',
            },
            {
              icon: Share2,
              title: 'Compartí tu perfil',
              desc: 'Cada usuario tiene su URL pública optimizada para compartir por WhatsApp y redes.',
              color: 'bg-amber-50 text-amber-600',
            },
          ].map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon size={22} />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink-800 mb-2">{f.title}</h3>
              <p className="text-ink-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sección empresas */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-medium text-sm mb-3">
              <Building2 size={16} />
              Para empresas
            </div>
            <h2 className="font-display text-3xl font-semibold text-ink-900 mb-3">
              ¿Buscás talento?
            </h2>
            <p className="text-ink-500 text-base max-w-md leading-relaxed">
              Publicá ofertas de trabajo y recibí postulaciones con Video CV. Conocé a los candidatos antes de la entrevista.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link
              href="/register-empresa"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-blue-700 transition-colors"
            >
              <Building2 size={18} />
              Registrar empresa
              <ChevronRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-8 py-3 rounded-2xl hover:bg-gray-50 transition-colors text-sm"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="bg-brand-600 py-16 px-6 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mb-4">
          ¿Listo para destacarte?
        </h2>
        <p className="text-brand-200 mb-8">Registrate gratis y creá tu perfil hoy.</p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-4 rounded-2xl hover:bg-brand-50 transition-colors">
          Empezar ahora
          <ChevronRight size={18} />
        </Link>
      </section>
    </div>
  );
}

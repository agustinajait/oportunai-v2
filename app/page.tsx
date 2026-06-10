import Link from 'next/link';
import { Video, Mic, Share2, ChevronRight, Building2, MapPin, Briefcase } from 'lucide-react';
import { prisma } from '@/lib/prisma';

const MODALIDAD_LABEL: Record<string, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

export default async function LandingPage() {
  const ofertasDestacadas = await prisma.oferta.findMany({
    where: { estado: 'activa' },
    include: { empresa: { select: { nombre: true, logo_url: true } } },
    orderBy: { created_at: 'desc' },
    take: 3,
  });
  return (
    <div className="min-h-screen bg-ink-50 overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Oportunai" className="w-8 h-8" />
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
          <img src="/logo.svg" alt="" className="w-3.5 h-3.5" />
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

      {/* Ofertas destacadas */}
      {ofertasDestacadas.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">Ofertas de trabajo</h2>
              <p className="text-ink-500 text-sm mt-1">Empresas buscando candidatos ahora</p>
            </div>
            <Link
              href="/ofertas"
              className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors"
            >
              Ver todas <ChevronRight size={15} />
            </Link>
          </div>

          <div className="space-y-4">
            {ofertasDestacadas.map((o) => (
              <div key={o.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-ink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {o.empresa.logo_url
                      ? <img src={o.empresa.logo_url} alt={o.empresa.nombre} className="w-full h-full object-cover" />
                      : <Building2 size={18} className="text-ink-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink-900 leading-tight">{o.titulo}</h3>
                    <p className="text-brand-600 text-sm font-medium mt-0.5">{o.empresa.nombre}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-ink-400 text-xs">
                      {o.ciudad && <span className="flex items-center gap-1"><MapPin size={11} />{o.ciudad}</span>}
                      <span className="flex items-center gap-1"><Briefcase size={11} />{MODALIDAD_LABEL[o.modalidad] ?? o.modalidad}</span>
                      {o.area && <span>{o.area}</span>}
                    </div>
                  </div>
                  <Link
                    href={`/register?oferta_id=${o.id}`}
                    className="btn-primary text-sm py-2 px-4 flex-shrink-0"
                  >
                    Postularme
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/ofertas"
              className="inline-flex items-center gap-2 border border-brand-200 text-brand-700 font-medium px-6 py-3 rounded-2xl hover:bg-brand-50 transition-colors text-sm"
            >
              Ver todas las ofertas <ChevronRight size={16} />
            </Link>
          </div>
        </section>
      )}

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

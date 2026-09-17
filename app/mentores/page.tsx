import { Poppins, DM_Sans } from 'next/font/google';
import s from './mentores.module.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700', '800', '900'], display: 'swap' });
const dmSans  = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

const CTA_URL = 'https://oportunai.korai.lat/register-empresa?origen=mentores';
const CAP_URL = 'https://oportunai.korai.lat/capacitate';

const BRANDS = ['McDonald\'s', 'Día', 'Blue Star Group', 'Grupo Cencosud', 'Frávega', 'Farmacity'];

const CURSOS = [
  { icon: '⛽', titulo: 'Vendedor de Playa EES',          desc: 'Atención en playa de combustibles: procedimientos, seguridad y trato al cliente en la estación.' },
  { icon: '🏪', titulo: 'Vendedor de Tienda',             desc: 'Atención en minimarket y tienda: ventas, stock, reposición y caja en punto de venta.' },
  { icon: '🛢️', titulo: 'Especialista en Lubricentro',   desc: 'Cambio de aceite, filtros y revisión de fluidos — formación técnica para el lubricentro.' },
  { icon: '💬', titulo: 'Atención al Cliente',            desc: 'Cómo escuchar, comunicarse con claridad y resolver situaciones difíciles con clientes.' },
  { icon: '🛡️', titulo: 'Seguridad en EES',              desc: 'Normas de seguridad, prevención de accidentes y qué hacer en una emergencia.' },
  { icon: '🧾', titulo: 'Cajero/a de Comercio',           desc: 'Manejo de caja, cobros, cierres de turno y atención en punto de venta.' },
];

const PUESTOS = [
  'Vendedor de playa', 'Vendedor de tienda', 'Especialista de lubricentro',
  'Cajero/a', 'Supervisor de turno', 'Lavado de autos', 'Seguridad nocturna', 'Encargado de patio',
];

function Stripe() {
  return (
    <div className={s.stripe}>
      <span className={s.s1} /><span className={s.s2} /><span className={s.s3} /><span className={s.s4} />
    </div>
  );
}

function LogoMark() {
  return (
    <svg className={s.logoMark} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="none" stroke="#E8188A" strokeWidth="8" strokeDasharray="56.5 56.5" strokeDashoffset="0"/>
      <circle cx="40" cy="40" r="36" fill="none" stroke="#78C21E" strokeWidth="8" strokeDasharray="56.5 56.5" strokeDashoffset="-56.5"/>
      <circle cx="40" cy="40" r="36" fill="none" stroke="#1A5AC8" strokeWidth="8" strokeDasharray="56.5 56.5" strokeDashoffset="-113"/>
      <circle cx="40" cy="40" r="36" fill="none" stroke="#00B6D8" strokeWidth="8" strokeDasharray="56.5 56.5" strokeDashoffset="-169.5"/>
      <circle cx="40" cy="40" r="27" fill="white"/>
      <path d="M26 54V30c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v10l3-3 2 2-4 4v11H26z" fill="#0E1117"/>
      <rect x="29" y="33" width="12" height="7" rx="1" fill="white"/>
      <circle cx="53" cy="29" r="2.5" fill="#0E1117"/>
      <line x1="53" y1="31.5" x2="53" y2="34" stroke="#0E1117" strokeWidth="1.5"/>
      <line x1="53" y1="34" x2="44" y2="34" stroke="#0E1117" strokeWidth="1.5"/>
    </svg>
  );
}

export default function MentoresPage() {
  return (
    <div className={`${s.page} ${dmSans.className}`}>

      {/* Nav */}
      <nav className={s.nav}>
        <div className={s.navLogo}>
          <LogoMark />
          <div>
            <div className={`${s.navLogoText} ${poppins.className}`}>Mentor EES</div>
            <div className={`${s.navLogoSub} ${poppins.className}`}>Estaciones de Servicio</div>
          </div>
        </div>
        <a href={CTA_URL} className={s.ctaNav}>Sumar mi estación</a>
      </nav>
      <Stripe />

      {/* Hero */}
      <div className={s.hero}>
        <span className={`${s.heroEyebrow} ${poppins.className}`}>Conectamos talento con estaciones de servicio</span>
        <h1 className={`${s.heroH1} ${poppins.className}`}>
          Conocé el talento real<br />de tu próximo candidato<br />antes de entrevistarlo.
        </h1>
        <p className={`${s.heroTagline} ${poppins.className}`}>Perfiles, selección y capacitación para todo el sector.</p>
        <p className={s.heroSub}>
          Los candidatos de Mentor EES conocen el rubro, se capacitaron en los procedimientos de la estación y armaron su perfil con video. Vos llegás a elegir, no a explicar.
        </p>
        <a href={CTA_URL} className={s.heroCta}>Sumar mi estación →</a>
        <p className={s.heroNote}>Sin costo inicial · 2 minutos para empezar</p>
      </div>
      <Stripe />

      {/* Trust */}
      <section className={`${s.section} ${s.trust}`}>
        <div className={s.container}>
          <p className={`${s.sectionLabel} ${poppins.className}`}>Quiénes somos</p>
          <h2 className={`${s.sectionTitle} ${poppins.className}`}>Tecnología con historia,<br />enfocada en tu sector.</h2>
          <div className={s.trustGrid}>
            <div className={s.trustCard}>
              <div className={`${s.trustIcon} ${s.blue2}`}>🎥</div>
              <h3 className={poppins.className}>+10 años transformando la selección</h3>
              <p>OportunAI cuenta con el respaldo de Tu VideoCV, la startup argentina pionera en la incorporación del Video CV en procesos de selección.</p>
              <p>Desde 2015 desarrollamos tecnología utilizada por grandes empresas. Hoy esa experiencia se pone al servicio del sector EES.</p>
            </div>
          </div>
          <p className={`${s.brandsLabel} ${poppins.className}`}>Tecnología usada por</p>
          <div className={s.brandsRow}>
            {BRANDS.map(b => <span key={b} className={`${s.brandChip} ${poppins.className}`}>{b}</span>)}
          </div>
        </div>
      </section>
      <Stripe />

      {/* Benefits */}
      <section className={`${s.section} ${s.benefits}`}>
        <div className={s.container}>
          <p className={`${s.sectionLabel} ${poppins.className}`}>Lo que cambia</p>
          <h2 className={`${s.sectionTitle} ${poppins.className}`}>Llegás a la entrevista<br />sabiendo con quién hablás.</h2>
          <div className={s.benefitsGrid}>
            {[
              { icon: '🎥', title: 'Ves quién es antes de llamarlo',  body: 'Cada candidato graba una presentación en video. Sin sorpresas en la entrevista, sin CV que no dicen nada.' },
              { icon: '⛽', title: 'Solo del rubro EES',              body: 'Vendedores de playa y tienda, especialistas en lubricentro. Gente que ya sabe lo que es una estación, no hay que explicarle todo desde cero.' },
              { icon: '📋', title: 'Llegan con el curso hecho',       body: 'Antes de que los conozcas, el candidato ya se capacitó en los procedimientos del rubro. Entrás a elegir, no a enseñar.' },
              { icon: '🔧', title: 'Sin intermediarios',              body: 'Publicás el puesto, recibís candidatos, contratás. Sin consultoras que cobran por candidato ni formularios interminables.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className={s.benefitCard}>
                <span className={s.benefitIcon}>{icon}</span>
                <h3 className={poppins.className}>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Stripe />

      {/* How it works */}
      <section className={`${s.section} ${s.how}`}>
        <div className={s.container}>
          <p className={`${s.sectionLabel} ${poppins.className}`}>Cómo funciona</p>
          <h2 className={`${s.sectionTitle} ${poppins.className}`}>Publicás. Capacitamos. Elegís.</h2>
          <div className={s.steps}>
            {[
              { n: '01', title: 'Registrás tu estación',   body: 'En 2 minutos cargás los datos básicos y publicás el puesto. Sin papeles, sin llamadas, sin esperas.' },
              { n: '02', title: 'El candidato se prepara',  body: 'Quien se postula accede gratis a cursos del rubro. Llega a tu entrevista con certificado y video de presentación.' },
              { n: '03', title: 'Vos elegís al que vale',  body: 'Ves el video, revisás el certificado, citás al que te convence. El resto lo manejamos nosotros.' },
            ].map(({ n, title, body }) => (
              <div key={n} className={s.step}>
                <div className={`${s.stepNum} ${poppins.className}`}>{n}</div>
                <h3 className={poppins.className}>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Stripe />

      {/* Puestos */}
      <section className={`${s.section} ${s.puestos}`}>
        <div className={s.container}>
          <p className={`${s.sectionLabel} ${poppins.className}`}>Roles que cubrimos</p>
          <h2 className={`${s.sectionTitle} ${poppins.className}`}>Los que no pueden faltar en tu estación</h2>
          <div className={s.puestosTags}>
            {PUESTOS.map(p => <span key={p} className={`${s.puestoTag} ${poppins.className}`}>{p}</span>)}
          </div>
        </div>
      </section>
      <Stripe />

      {/* Capacitate */}
      <section className={`${s.section} ${s.capacitate}`}>
        <div className={s.container}>
          <div className={s.sectionHeader}>
            <div>
              <p className={`${s.sectionLabel} ${poppins.className}`}>El candidato llega listo</p>
              <h2 className={`${s.sectionTitle} ${poppins.className}`}>Cursos del rubro,<br />gratis para quien se postula.</h2>
            </div>
            <a href={CAP_URL} className={s.verTodosLink}>Ver todos →</a>
          </div>
          <div className={s.capGrid}>
            {CURSOS.map(({ icon, titulo, desc }) => (
              <div key={titulo} className={s.capCard}>
                <div className={s.capCardIcon}>{icon}</div>
                <span className={s.capCardCat}>Físicos · Oficios</span>
                <h3 className={poppins.className}>{titulo}</h3>
                <p>{desc}</p>
                <div className={s.capCardFooter}>
                  <span className={s.capBadge}>✓ Certificado</span>
                  <span className={s.capFree}>Gratis</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Stripe />

      {/* CTA final */}
      <div className={s.ctaSection}>
        <div className={s.container}>
          <h2 className={poppins.className}>El equipo de tu estación<br />está en Mentor EES.</h2>
          <p>Registrás la estación hoy. Esta semana ya tenés candidatos con video y certificado.</p>
          <a href={CTA_URL} className={s.ctaBig}>Sumar mi estación →</a>
        </div>
      </div>

      {/* Footer */}
      <footer className={s.footer}>
        <p>Mentor EES · Impulsado por <a href="https://oportunai.korai.lat">Oportunai</a></p>
      </footer>

    </div>
  );
}

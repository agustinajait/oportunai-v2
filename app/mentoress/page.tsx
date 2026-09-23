import Image from 'next/image';
import { Poppins, DM_Sans } from 'next/font/google';
import s from './mentores.module.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700', '800', '900'], display: 'swap' });
const dmSans  = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

const CTA_URL = 'https://oportunai.korai.lat/register-empresa?origen=mentores';
const CAP_URL = 'https://oportunai.korai.lat/capacitate';

const BRANDS = ['McDonald\'s', 'Día', 'Blue Star Group', 'Grupo Cencosud', 'Frávega', 'Farmacity'];

const MODULOS = [
  {
    num: '01', icon: '⛽', titulo: 'Combustibles',
    desc: 'Naftas, diésel, GNC, calidad del combustible y seguridad. El candidato sabe qué despacha y cómo hacerlo de forma segura antes de llegar a la playa.',
    duracion: '45 min', nivel: 'Introductorio',
  },
  {
    num: '02', icon: '🛢️', titulo: 'Lubricantes',
    desc: 'Función, viscosidad, clasificación y asesoramiento responsable. Saber escuchar al cliente y recomendar sin equivocarse.',
    duracion: '40 min', nivel: 'Introductorio',
  },
  {
    num: '03', icon: '☕', titulo: 'Café y Barista',
    desc: 'Operación de cafetería, elaboración, servicio, higiene, presentación y latte art. La tienda como unidad de negocio con impacto real en la experiencia.',
    duracion: '50 min', nivel: 'Introductorio',
  },
  {
    num: '04', icon: '🤝', titulo: 'Experiencia del Cliente',
    desc: 'Percepción, ciclo de atención, actitud de venta y momentos que generan fidelización. Más que amabilidad: servicio profesional.',
    duracion: '35 min', nivel: 'Introductorio',
  },
];

const PUESTOS = [
  { cat: 'Operación', roles: ['Vendedor de playa', 'Vendedor de tienda', 'Lubriexperto', 'Franquero'] },
  { cat: 'Supervisión', roles: ['Responsable de playa', 'Responsable de tienda', 'Encargado de estación'] },
  { cat: 'Soporte', roles: ['Administrativo', 'Embajador de tienda', 'Entrenador', 'Maestranza'] },
];

const SUELDOS = [
  { categoria: 'Encargado de estación',        sep: '$ 1.550.413', oct: '$ 1.581.421' },
  { categoria: 'Administrativo',               sep: '$ 1.540.642', oct: '$ 1.571.455' },
  { categoria: 'Vendedor de playa / tienda',   sep: '$ 1.527.299', oct: '$ 1.557.845' },
  { categoria: 'Sereno',                       sep: '$ 1.501.386', oct: '$ 1.531.413' },
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
    <Image
      src="/logo-mentoress.png"
      alt="Mentoress"
      width={72}
      height={72}
      className={s.logoMark}
    />
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
            <div className={`${s.navLogoText} ${poppins.className}`}>Mentoress</div>
            <div className={`${s.navLogoSub} ${poppins.className}`}>Estaciones de Servicio</div>
          </div>
        </div>
        <a href={CTA_URL} className={s.ctaNav}>Sumar mi estación</a>
      </nav>
      <Stripe />

      {/* Hero — video de fondo con overlay */}
      <div className={s.hero}>
        <video
          src="/lv_0_20260923144131.mp4"
          autoPlay
          muted
          loop
          playsInline
          className={s.heroBgVideo}
        />
        <div className={s.heroOverlay} />
        <div className={s.heroContent}>
          <div className={s.heroLogoRow}>
            <Image src="/logo-mentoress.png" alt="Mentoress" width={48} height={48} className={s.heroLogoImg} />
            <span className={`${s.heroLogoName} ${poppins.className}`}>Mentoress</span>
          </div>
          <span className={`${s.heroEyebrow} ${poppins.className}`}>Conectamos talento con estaciones de servicio</span>
          <h1 className={`${s.heroH1} ${poppins.className}`}>
            Conocé el talento real<br />de tu próximo candidato<br />antes de entrevistarlo.
          </h1>
          <p className={s.heroSub}>
            Los candidatos de Mentoress conocen el rubro, completaron los módulos de formación y armaron su perfil con video. Vos llegás a elegir, no a explicar.
          </p>
          <a href={CTA_URL} className={s.heroCta}>Sumar mi estación →</a>
          <p className={s.heroNote}>Sin costo inicial · 2 minutos para empezar</p>
        </div>
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
              <p>Mentoress es impulsada por OportunAI, con el respaldo de Tu VideoCV, la startup argentina pionera en Video CV en procesos de selección.</p>
              <p>Desde 2015 desarrollamos tecnología utilizada por grandes empresas. Hoy esa experiencia se enfoca exclusivamente en el sector EES.</p>
            </div>
          </div>
          <p className={`${s.brandsLabel} ${poppins.className}`}>Tecnología usada por</p>
          <div className={s.brandsRow}>
            {BRANDS.map(b => <span key={b} className={`${s.brandChip} ${poppins.className}`}>{b}</span>)}
          </div>
        </div>
      </section>
      <Stripe />

      {/* Qué trae el candidato */}
      <section className={`${s.section} ${s.prepared}`}>
        <div className={s.container}>
          <p className={`${s.sectionLabel} ${poppins.className}`}>Antes de que lo entrevistes</p>
          <h2 className={`${s.sectionTitle} ${poppins.className}`}>El candidato ya recorrió este camino.</h2>
          <div className={s.preparedGrid}>
            {[
              { icon: '📚', title: 'Conoce el rubro', body: 'Estudió cómo funciona una estación: sus áreas, puestos, turnos rotativos y dinámica 24/7. Entiende el contexto antes del primer día.' },
              { icon: '🎓', title: 'Completó los 4 módulos', body: 'Combustibles, Lubricantes, Café y Barista, y Experiencia del Cliente. Cada módulo con certificado digital incluido.' },
              { icon: '🎥', title: 'Armó su perfil con video', body: 'Grabó su presentación en video, completó disponibilidad horaria, experiencia previa y habilitaciones. Vos llegás a elegir.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className={s.preparedCard}>
                <div className={s.preparedIcon}>{icon}</div>
                <h3 className={poppins.className}>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
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
              { icon: '🎥', title: 'Ves quién es antes de llamarlo',  body: 'Cada candidato graba su presentación en video. Sin sorpresas, sin CV que no dicen nada.' },
              { icon: '⛽', title: 'Solo del rubro EES',              body: 'Vendedores de playa y tienda, lubriexpertos, encargados. Gente que ya entiende qué es una estación.' },
              { icon: '🎓', title: 'Llegan con los módulos hechos',   body: 'Combustibles, lubricantes, café, atención al cliente — cuatro módulos completados antes de la entrevista.' },
              { icon: '🔧', title: 'Sin intermediarios',              body: 'Publicás el puesto, recibís candidatos preparados, contratás. Sin consultoras ni formularios interminables.' },
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
              { n: '01', title: 'Registrás tu estación',  body: 'En 2 minutos cargás los datos y publicás el puesto. Sin papeles, sin llamadas, sin esperas.' },
              { n: '02', title: 'El candidato se prepara', body: 'Accede gratis a los 4 módulos del rubro y arma su perfil con video. Llega a la entrevista con certificado.' },
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
          <div className={s.puestosGroups}>
            {PUESTOS.map(({ cat, roles }) => (
              <div key={cat} className={s.puestosGroup}>
                <p className={`${s.puestosGroupLabel} ${poppins.className}`}>{cat}</p>
                <div className={s.puestosTags}>
                  {roles.map(r => <span key={r} className={`${s.puestoTag} ${poppins.className}`}>{r}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Stripe />

      {/* Sueldos CCT */}
      <section className={`${s.section} ${s.sueldos}`}>
        <div className={s.container}>
          <p className={`${s.sectionLabel} ${poppins.className}`}>Referencia salarial</p>
          <h2 className={`${s.sectionTitle} ${poppins.className}`}>Básicos de convenio<br />para que el candidato llegue informado.</h2>
          <div className={s.sueldosTable}>
            <div className={`${s.sueldosHeader} ${poppins.className}`}>
              <span>Categoría</span>
              <span>Sep 2026</span>
              <span>Oct 2026</span>
            </div>
            {SUELDOS.map(({ categoria, sep, oct }) => (
              <div key={categoria} className={s.sueldosRow}>
                <span>{categoria}</span>
                <span className={s.sueldoMonto}>{sep}</span>
                <span className={s.sueldoMonto}>{oct}</span>
              </div>
            ))}
          </div>
          <p className={s.sueldosNote}>CCT 428/05 · CABA y Prov. de Buenos Aires · Básicos de convenio, no equivalen al sueldo de bolsillo. Actualizado sep 2026.</p>
        </div>
      </section>
      <Stripe />

      {/* Módulos de formación */}
      <section className={`${s.section} ${s.capacitate}`}>
        <div className={s.container}>
          <div className={s.sectionHeader}>
            <div>
              <p className={`${s.sectionLabel} ${poppins.className}`}>Formación inicial Mentoress</p>
              <h2 className={`${s.sectionTitle} ${poppins.className}`}>4 cursos del rubro,<br />gratis para quien se postula.</h2>
            </div>
            <a href={CAP_URL} className={s.verTodosLink}>Ver todos los cursos →</a>
          </div>
          <div className={s.capGrid}>
            {MODULOS.map(({ num, icon, titulo, desc, duracion, nivel }) => (
              <div key={titulo} className={s.capCard}>
                {/* Video intro placeholder */}
                <div className={s.capVideo}>
                  <div className={s.capVideoInner}>
                    <span className={s.capVideoIcon}>{icon}</span>
                    <div className={s.capPlayBtn} aria-label="Ver intro">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="10" fill="white" fillOpacity="0.15"/>
                        <polygon points="8,6 15,10 8,14" fill="white"/>
                      </svg>
                    </div>
                  </div>
                  <span className={`${s.capModTag} ${poppins.className}`}>Módulo {num}</span>
                </div>
                <div className={s.capCardBody}>
                  <h3 className={poppins.className}>{titulo}</h3>
                  <p>{desc}</p>
                  <div className={s.capMeta}>
                    <span className={s.capMetaItem}>⏱ {duracion}</span>
                    <span className={s.capMetaItem}>📶 {nivel}</span>
                  </div>
                  <div className={s.capCardFooter}>
                    <span className={s.capBadge}>✓ Certificado</span>
                    <a href={CAP_URL} className={s.capCta}>Empezar gratis</a>
                  </div>
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
          <h2 className={poppins.className}>El equipo de tu estación<br />está en Mentoress.</h2>
          <p>Registrás la estación hoy. Esta semana ya tenés candidatos con video, certificado y formación del rubro.</p>
          <a href={CTA_URL} className={s.ctaBig}>Sumar mi estación →</a>
        </div>
      </div>

      {/* Footer */}
      <footer className={s.footer}>
        <p>Mentoress · Impulsado por <a href="https://oportunai.korai.lat">Oportunai</a></p>
      </footer>

    </div>
  );
}

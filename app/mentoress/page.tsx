import Image from 'next/image';
import { Poppins, DM_Sans } from 'next/font/google';
import s from './mentores.module.css';
import { prisma } from '../../lib/prisma';

const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700', '800', '900'], display: 'swap' });
const dmSans  = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

const CTA_URL      = 'https://oportunai.korai.lat/register-empresa?origen=mentores';
const REGISTER_URL = 'https://oportunai.korai.lat/register?origen=mentoress';
const CAP_URL      = 'https://oportunai.korai.lat/register?origen=mentoress';

const BRANDS = [
  { name: "McDonald's", src: '/logos/logo mcd.png' },
  { name: 'KFC',        src: '/logos/Kfc_logo-500x281.png' },
  { name: "Wendy's",    src: '/logos/logo wendys.jpg' },
  { name: 'Día',        src: '/logos/dia.png' },
  { name: 'Prisma',     src: '/logos/prisma.png' },
  { name: 'Todo Moda',  src: '/logos/todo moda.png' },
];

const MODULOS = [
  {
    num: '01', icon: '⛽', titulo: 'Combustibles',
    desc: 'Naftas, diésel, GNC, calidad del combustible y seguridad. El candidato sabe qué despacha y cómo hacerlo de forma segura antes de llegar a la playa.',
    duracion: '45 min', nivel: 'Introductorio',
    video: '/lv_0_20260924090254.mp4',
  },
  {
    num: '02', icon: '🛢️', titulo: 'Lubricantes',
    desc: 'Función, viscosidad, clasificación y asesoramiento responsable. Saber escuchar al cliente y recomendar sin equivocarse.',
    duracion: '40 min', nivel: 'Introductorio',
    video: '/lv_0_20260924141159.mp4',
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
    video: '/lv_0_20260924141306.mp4',
  },
];

const PUESTOS = [
  { cat: 'Operación',     roles: ['Vendedor de playa', 'Vendedor de tienda', 'Lubriexperto', 'Barista / Cafetería'] },
  { cat: 'Mandos medios', roles: ['Encargado de playa', 'Encargado de tienda', 'Supervisor', 'Jefe de estación'] },
  { cat: 'Soporte',       roles: ['Administrativo', 'Embajador de tienda', 'Entrenador', 'Maestranza'] },
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
      alt="MentorEESS"
      width={56}
      height={56}
      className={s.logoMark}
    />
  );
}

export default async function MentoresPage() {
  const [galeria, ofertasDestacadas] = await Promise.all([
    prisma.galeriaHome.findMany({
      where: { activa: true },
      orderBy: { orden: 'asc' },
      take: 6,
    }),
    prisma.oferta.findMany({
      where: { estado: 'activa', empresa: { origen: 'mentores' } },
      include: { empresa: { select: { nombre: true, logo_url: true, nombre_marca: true } } },
      orderBy: { created_at: 'desc' },
      take: 3,
    }),
  ]);
  return (
    <div className={`${s.page} ${dmSans.className}`}>

      {/* Nav */}
      <nav className={s.nav}>
        <div className={s.navLogo}>
          <LogoMark />
          <div>
            <div className={`${s.navLogoText} ${poppins.className}`}>Mentor<span className={s.eess}>EESS</span></div>
            <div className={`${s.navLogoSub} ${poppins.className}`}>Estaciones de Servicio</div>
          </div>
        </div>
        <a href={CTA_URL} className={s.ctaNav}>Sumar mi estación</a>
      </nav>
      <Stripe />

      {/* Hero */}
      <div className={s.hero}>
        <video src="/lv_0_20260923144131.mp4" autoPlay muted loop playsInline className={s.heroBgVideo} />
        <div className={s.heroOverlay} />
        <div className={s.heroContent}>
          <div className={s.heroTop}>
            <h1 className={`${s.heroH1} ${poppins.className}`}>
              Capacitación, talento y selección para <em>estaciones de servicio</em><span className={s.heroDot}>.</span>
            </h1>
            <p className={s.heroSub}>
              MentorEESS conecta personas capacitadas con estaciones de servicio.
            </p>
          </div>
          <div className={s.heroCards}>
            <div className={`${s.heroCard} ${s.heroCardCandidato}`}>
              <strong className={`${s.heroCardLabel} ${poppins.className}`}>Quiero trabajar</strong>
              <p>Capacitate, armá tu perfil y presentate con tu VideoCV.</p>
              <a href={REGISTER_URL} className={`${s.heroCardCta} ${s.heroCardCtaCandidato}`}>Crear mi perfil →</a>
            </div>
            <div className={`${s.heroCard} ${s.heroCardEmpresa}`}>
              <strong className={`${s.heroCardLabel} ${poppins.className}`}>Busco talento</strong>
              <p>Encontrá personas capacitadas, conocelas a través de su VideoCV y contactalas.</p>
              <a href={CTA_URL} className={`${s.heroCardCta} ${s.heroCardCtaEmpresa}`}>Sumar mi estación →</a>
            </div>
          </div>
        </div>
      </div>
      <Stripe />

      {/* How it works */}
      <section className={`${s.section} ${s.how}`}>
        <div className={s.container}>
          <p className={`${s.sectionLabel} ${poppins.className}`}>Cómo funciona</p>
          <h2 className={`${s.sectionTitle} ${poppins.className}`}>Publicás. Capacitamos. Elegís.</h2>
          <div className={s.steps}>
            {[
              { n: '01', title: 'Registrás tu estación',  body: 'En 2 minutos cargás los datos y publicás el puesto. Sin papeles, sin llamadas, sin esperas.',   color: 'var(--pink)' },
              { n: '02', title: 'El candidato se prepara', body: 'Accede gratis a los 4 módulos del rubro y arma su perfil con video. Llega a la entrevista con certificado.', color: 'var(--cyan)' },
              { n: '03', title: 'Vos elegís al que vale',  body: 'Ves el video, revisás el certificado, citás al que te convence. El resto lo manejamos nosotros.',  color: 'var(--green)' },
            ].map(({ n, title, body, color }) => (
              <div key={n} className={s.step}>
                <div className={`${s.stepNum} ${poppins.className}`} style={{ color }}>{n}</div>
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

      {/* Trust */}
      <section className={`${s.section} ${s.trust}`}>
        <div className={s.container}>
          <p className={`${s.sectionLabel} ${poppins.className}`}>Quiénes somos</p>
          <h2 className={`${s.sectionTitle} ${poppins.className}`}>Tecnología con historia,<br />enfocada en tu sector.</h2>
          <p className={s.trustIntro}>
            MentorEESS es impulsada por OportunAI, con el respaldo de <strong>Tu VideoCV</strong> — la startup argentina pionera en Video CV en procesos de selección desde 2015. Más de una década trabajando con las empresas más grandes del país, ahora enfocados exclusivamente en estaciones de servicio.
          </p>

          {/* Galería de impacto */}
          {galeria.length > 0 && (
            <div className={s.impactGrid}>
              {galeria.map((img) => (
                <div key={img.id} className={`${s.impactCell} ${img.big ? s.impactBig : ''}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt={img.label} className={s.impactImg} />
                </div>
              ))}
            </div>
          )}

          {/* Marquee de logos */}
          <p className={`${s.brandsLabel} ${poppins.className}`}>Tecnología usada por</p>
          <div className={s.marqueeWrap} aria-label="Empresas que usaron nuestra tecnología">
            <div className={s.marqueeTrack}>
              {[...BRANDS, ...BRANDS].map((b, i) => (
                <div key={i} className={s.brandLogo}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={encodeURI(b.src)}
                    alt={b.name}
                    className={s.brandLogoImg}
                    title={b.name}
                  />
                </div>
              ))}
            </div>
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
              <p className={`${s.sectionLabel} ${poppins.className}`}>Formación inicial MentorEESS</p>
              <h2 className={`${s.sectionTitle} ${poppins.className}`}>4 cursos del rubro,<br />gratis para quien se postula.</h2>
            </div>
            <a href={CAP_URL} className={s.verTodosLink}>Ver todos los cursos →</a>
          </div>
          <div className={s.capGrid}>
            {MODULOS.map(({ num, icon, titulo, desc, duracion, nivel, video }) => (
              <div key={titulo} className={s.capCard}>
                <div className={s.capVideo}>
                  {video ? (
                    <video src={video} autoPlay muted loop playsInline className={s.capVideoReal} />
                  ) : (
                    <div className={s.capVideoInner}>
                      <span className={s.capVideoIcon}>{icon}</span>
                      <div className={s.capPlayBtn} aria-label="Ver intro">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="10" fill="white" fillOpacity="0.15"/>
                          <polygon points="8,6 15,10 8,14" fill="white"/>
                        </svg>
                      </div>
                    </div>
                  )}
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

      {/* Más que un perfil */}
      <section className={s.oportunidad}>
        <div className={s.oportunidadInner}>
          <div className={s.oportunidadLeft}>
            <p className={`${s.oportunidadLabel} ${poppins.className}`}>Para el candidato</p>
            <h2 className={`${s.oportunidadH2} ${poppins.className}`}>
              Más que un perfil,<br />una <em>aportunidad.</em>
            </h2>
            <p className={s.oportunidadSub}>
              MentorEESS es la plataforma que impulsa el talento del sector, con formación, tecnología y oportunidades reales.
            </p>
            <a href={REGISTER_URL} className={`${s.oportunidadCta} ${poppins.className}`}>Crear mi perfil gratis →</a>
          </div>
          <div className={s.oportunidadCenter}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/candidato.png" alt="Candidato grabando su VideoCV" className={s.oportunidadImg} />
          </div>
          <div className={s.oportunidadRight}>
            {['CAPACITATE', 'CONECTATE', 'CRECÉ'].map((word, i) => (
              <span key={word} className={`${s.oportunidadWord} ${poppins.className}`} style={{ opacity: 1 - i * 0.22 }}>{word}</span>
            ))}
          </div>
        </div>
      </section>
      <Stripe />

      {/* Ofertas destacadas */}
      {ofertasDestacadas.length > 0 && (
        <>
          <section className={`${s.section} ${s.ofertasSection}`}>
            <div className={s.container}>
              <div className={s.sectionHeader}>
                <div>
                  <p className={`${s.sectionLabel} ${poppins.className}`}>Oportunidades reales</p>
                  <h2 className={`${s.sectionTitle} ${poppins.className}`}>Estaciones que buscan talento ahora</h2>
                </div>
                <a href={REGISTER_URL} className={s.verTodosLink}>Ver todas las ofertas →</a>
              </div>
              <div className={s.ofertasGrid}>
                {ofertasDestacadas.map((o) => (
                  <div key={o.id} className={s.ofertaCard}>
                    <div className={s.ofertaCardTop}>
                      {(o.empresa.logo_url || o.logo_url) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={o.empresa.logo_url ?? o.logo_url ?? ''}
                          alt={o.empresa.nombre_marca ?? o.empresa.nombre}
                          className={s.ofertaLogo}
                        />
                      )}
                      <div className={s.ofertaCardInfo}>
                        <p className={`${s.ofertaEmpresa} ${poppins.className}`}>
                          {o.nombre_marca ?? o.empresa.nombre_marca ?? o.empresa.nombre}
                        </p>
                        <h3 className={`${s.ofertaTitulo} ${poppins.className}`}>{o.titulo}</h3>
                      </div>
                    </div>
                    <div className={s.ofertaTags}>
                      {o.modalidad && <span className={s.ofertaTag}>{o.modalidad}</span>}
                      {o.ciudad && <span className={s.ofertaTag}>📍 {o.ciudad}</span>}
                      {o.area && <span className={s.ofertaTag}>{o.area}</span>}
                    </div>
                    <a href={REGISTER_URL} className={s.ofertaCta}>Postularme →</a>
                  </div>
                ))}
              </div>
              <div className={s.ofertasVerMas}>
                <a href={REGISTER_URL} className={`${s.ofertasVerMasBtn} ${poppins.className}`}>
                  Ver todas las ofertas disponibles →
                </a>
              </div>
            </div>
          </section>
          <Stripe />
        </>
      )}

      {/* CTA final */}
      <div className={s.ctaSection}>
        <div className={s.container}>
          <h2 className={poppins.className}>El equipo de tu estación<br />está en MentorEESS.</h2>
          <p>Registrás la estación hoy. Esta semana ya tenés candidatos con video, certificado y formación del rubro.</p>
          <a href={CTA_URL} className={s.ctaBig}>Sumar mi estación →</a>
        </div>
      </div>

      {/* Footer */}
      <footer className={s.footer}>
<p>MentorEESS · Impulsado por <a href="https://oportunai.korai.lat">Oportunai</a></p>
      </footer>

    </div>
  );
}

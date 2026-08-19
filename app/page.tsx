export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Fuel, Headphones, UtensilsCrossed,
  Video, FileText, User, Users, MapPin,
  GraduationCap, ClipboardList, RefreshCw,
  HardHat, Handshake, Building2, ChevronRight,
  Target, Smartphone, Smile, Play, Send, CircleCheck,
  Heart, Camera, ArrowRight, Download,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import s from './landing.module.css';
import AlfaExpandable from './AlfaExpandable';
import BuscadorNL from '@/components/ui/BuscadorNL';

interface Sector {
  label: string;
  desc:  string;
  Icon:  LucideIcon;
  href:  string;
  keys:  string[];
}

const SECTORES: Sector[] = [
  {
    label: 'Estaciones de servicio',
    desc:  'Playeros, cajeros, supervisores',
    Icon:  Fuel,
    href:  '/ofertas',
    keys:  ['estacion', 'playero', 'nafta', 'combustible', 'playa de'],
  },
  {
    label: 'Atención al cliente',
    desc:  'Vendedores, recepcionistas, call center',
    Icon:  Headphones,
    href:  '/ofertas',
    keys:  ['atencion', 'atención', 'call center', 'recepcion', 'recepción', 'vendedor', 'customer', 'telefonista', 'operador'],
  },
  {
    label: 'Comidas rápidas',
    desc:  'Cocina, atención, caja',
    Icon:  UtensilsCrossed,
    href:  '/ofertas',
    keys:  ['gastronomia', 'gastronomía', 'comida', 'restaurant', 'cocina', 'food', 'hamburgue', 'pizza'],
  },
];

const TALLER_ICONS = [
  { bg: '#ECE9FB', color: '#5B3FE0', rubro: 'Estación de servicio',  Icon: Fuel },
  { bg: '#E3FAF4', color: '#0E9C82', rubro: 'Atención al cliente',   Icon: Headphones },
  { bg: '#FFF3E8', color: '#D97706', rubro: 'Comidas rápidas',        Icon: UtensilsCrossed },
];

const GALLERY_SLOTS = [
  { big: true,  bg: 'linear-gradient(145deg,rgba(91,63,224,0.10),rgba(109,72,240,0.18))', color: '#5B3FE0', label: 'Implementaciones' },
  { big: false, bg: 'linear-gradient(145deg,rgba(20,199,168,0.10),rgba(10,148,133,0.18))', color: '#0A9485', label: 'Capacitaciones' },
  { big: false, bg: 'linear-gradient(145deg,rgba(0,0,0,0.04),rgba(0,0,0,0.09))',           color: '#94a3b8', label: 'Eventos' },
  { big: false, bg: 'linear-gradient(145deg,rgba(20,199,168,0.07),rgba(91,63,224,0.10))',  color: '#5B3FE0', label: 'Equipos' },
  { big: false, bg: 'linear-gradient(145deg,rgba(91,63,224,0.08),rgba(109,72,240,0.14))',  color: '#7048F0', label: 'Empresas' },
  { big: false, bg: 'linear-gradient(145deg,rgba(0,0,0,0.05),rgba(0,0,0,0.10))',           color: '#94a3b8', label: 'Historias' },
];


const CAP_FALLBACK = [
  { bg: '#ECE9FB', color: '#5B3FE0', rubro: 'Estación de servicio',  titulo: 'Atención al cliente en la playa',   dur: '8 min',  emp: 'YPF',           Icon: Fuel },
  { bg: '#E3FAF4', color: '#0E9C82', rubro: 'Atención al cliente',   titulo: 'Cómo atender bien al cliente',     dur: '10 min', emp: 'Empresa local',  Icon: Headphones },
  { bg: '#FFF3E8', color: '#D97706', rubro: 'Comidas rápidas',        titulo: 'Atención y manejo de caja',        dur: '10 min', emp: 'Empresa local',  Icon: UtensilsCrossed },
];

function countSector(ofertas: { area: string | null; titulo: string }[], keys: string[]) {
  return ofertas.filter(o =>
    keys.some(k => `${o.area ?? ''} ${o.titulo}`.toLowerCase().includes(k))
  ).length;
}

export default async function LandingPage() {
  const [ofertasActivas, talleres, galeriaDB] = await Promise.all([
    prisma.oferta.findMany({
      where: { estado: 'activa' },
      select: { id: true, titulo: true, area: true },
    }),
    prisma.taller.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, descripcion: true },
      take: 3,
    }),
    prisma.galeriaHome.findMany({
      where: { activa: true },
      orderBy: { orden: 'asc' },
    }),
  ]);

  const totalOfertas = ofertasActivas.length;
  const sectores = SECTORES.map(sec => ({
    ...sec,
    count: countSector(ofertasActivas, sec.keys),
  }));

  return (
    <div className={s.wrapper}>

      {/* ── NAV ── */}
      <nav className={s.nav}>
        <Link href="/" className={s.logo}>
          <div className={s.logoMark}>
            <img src="/logo.png" alt="Oportunai" className={s.logoImg} />
          </div>
          <div className={s.logoTexts}>
            <span className={s.logoText}>OportunAI</span>
            <span className={s.logoTagline}>Tu perfil. Tu oportunidad.</span>
          </div>
        </Link>

        <div className={s.navCenter}>
          <Link href="/"               className={`${s.navLink} ${s.navLinkActive}`}>Para vos</Link>
          <Link href="/register-empresa" className={s.navLink}>Para empresas</Link>
          <Link href="/register"        className={s.navLink}>Capacitaciones</Link>
        </div>

        <div className={s.navLinks}>
          <Link href="/login"    className={s.btnGhost}>Iniciar sesión</Link>
          <Link href="/register" className={s.btnFill}>Crear mi perfil gratis</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={s.heroNew}>

        {/* ── Izquierda: copy ── */}
        <div className={s.heroNewLeft}>
          <span className={s.heroNewBadge}>100% GRATIS</span>

          <h1 className={s.heroNewH}>
            El primer creador de<br/><span className={s.heroNewAccent}>Perfil Laboral Digital</span>
          </h1>

          <p className={s.heroNewSub}>
            VideoCV + CV optimizado para ATS + un link único para compartir con empresas.
            Todo en un solo perfil, con acompañamiento para potenciar tu búsqueda laboral.
          </p>

          <div className={s.heroNewPills}>
            <span className={s.heroNewPill}><Video size={13} strokeWidth={2}/> VideoCV</span>
            <span className={s.heroNewPill}><FileText size={13} strokeWidth={2}/> CV optimizado</span>
            <span className={s.heroNewPill}><Target size={13} strokeWidth={2}/> Diagnóstico</span>
            <span className={`${s.heroNewPill} ${s.heroNewPillActive}`}><Heart size={13} strokeWidth={2}/> Acompañamiento</span>
          </div>

          <Link href="/register" className={s.heroNewCtaBtn}>
            Crear mi perfil gratis <ArrowRight size={16} strokeWidth={2.5}/>
          </Link>

          <p className={s.heroNewHint}>
            <CircleCheck size={14} strokeWidth={2}/>
            Sin costos. Sin complicaciones.
          </p>
        </div>

        {/* ── Derecha: video o foto + cards flotantes ── */}
        <div className={s.heroNewRight}>
          <div className={s.heroNewPhotoWrap}>
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="/candidato.png"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
            >
              <source src="/hero-video.mp4" type="video/mp4" />
              <source src="/hero-video.webm" type="video/webm" />
            </video>
          </div>

          {/* Card 1 — VideoCV */}
          <div className={`${s.heroCard} ${s.heroCard1}`}>
            <div className={s.heroCardInner}>
              <div className={s.heroCardIco} style={{ background: 'rgba(91,63,224,0.12)' }}>
                <Video size={16} strokeWidth={1.75} color="#5B3FE0"/>
              </div>
              <div className={s.heroCardTitle}>VideoCV</div>
            </div>
            <div className={s.heroCardSub}>Presentate en 60 segundos</div>
            <div className={s.heroCardBar}><div className={`${s.heroCardBarFill} ${s.heroCardBarPurple}`}/></div>
          </div>

          {/* Card 2 — CV optimizado */}
          <div className={`${s.heroCard} ${s.heroCard2}`}>
            <div className={s.heroCardInner}>
              <div className={s.heroCardIco} style={{ background: 'rgba(20,199,168,0.12)' }}>
                <FileText size={16} strokeWidth={1.75} color="#14C7A8"/>
              </div>
              <div className={s.heroCardTitle}>CV optimizado</div>
              <Download size={14} strokeWidth={1.75} color="#14C7A8" style={{ marginLeft: 'auto' }}/>
            </div>
            <div className={s.heroCardSub}>Listo para postularte</div>
          </div>

          {/* Card 3 — Diagnóstico Korai */}
          <div className={`${s.heroCard} ${s.heroCard3}`}>
            <div className={s.heroCardInner}>
              <div className={s.heroCardIco} style={{ background: 'rgba(59,130,246,0.12)' }}>
                <Target size={16} strokeWidth={1.75} color="#3B82F6"/>
              </div>
              <div className={s.heroCardTitle}>Diagnóstico Korai</div>
            </div>
            <div className={s.heroCardSub}>Conocé tus fortalezas y qué podés mejorar</div>
            <div className={s.heroCardBar}><div className={`${s.heroCardBarFill} ${s.heroCardBarTeal}`}/></div>
          </div>
        </div>

      </section>

      {/* ── STEPS — Tu camino en 5 pasos ── */}
      <section className={s.secSteps}>
        <div className={s.secStepsHead}>
          <h2 className={s.secStepsH}>
            Tu camino en <span className={s.secStepsAccent}>5 pasos</span>
          </h2>
        </div>

        <div className={s.stepsNew}>
          {([
            { n: '1', numBg: '#5B3FE0', icoBg: 'rgba(91,63,224,0.10)',  icoColor: '#5B3FE0', Icon: User,     t: 'Creá tu perfil',                        d: 'Completá tus datos, experiencia y habilidades.' },
            { n: '2', numBg: '#EF4444', icoBg: 'rgba(239,68,68,0.10)',  icoColor: '#EF4444', Icon: Video,    t: 'Grabá tu VideoCV',                      d: 'Presentate con nuestra herramienta de VideoCV en 4 pasos.' },
            { n: '3', numBg: '#22C55E', icoBg: 'rgba(34,197,94,0.10)',  icoColor: '#22C55E', Icon: FileText, t: 'Generá tu CV para ATS',                 d: 'Obtené un CV optimizado para plataformas de búsqueda de empleo.' },
            { n: '4', numBg: '#3B82F6', icoBg: 'rgba(59,130,246,0.10)', icoColor: '#3B82F6', Icon: Target,   t: 'Conocé tu situación',                   d: 'Realizá un diagnóstico en áreas clave para iniciar tu camino laboral.' },
            { n: '5', numBg: '#F97316', icoBg: 'rgba(249,115,22,0.10)', icoColor: '#F97316', Icon: Heart,    t: 'Recibí oportunidades y acompañamiento', d: 'Accedé a herramientas, recursos y oportunidades personalizadas para tu búsqueda laboral.' },
          ] as const).flatMap((step, i, arr) => [
            <div key={step.n} className={s.stepNew}>
              <div className={s.stepNewNum} style={{ background: step.numBg }}>{step.n}</div>
              <div className={s.stepNewIco} style={{ background: step.icoBg }}>
                <step.Icon size={26} strokeWidth={1.75} color={step.icoColor}/>
              </div>
              <div className={s.stepNewT}>{step.t}</div>
              <div className={s.stepNewD}>{step.d}</div>
            </div>,
            i < arr.length - 1
              ? <div key={`a${i}`} className={s.stepNewArrow}><ChevronRight size={18} strokeWidth={2} color="#CBD5E1"/></div>
              : null,
          ])}
        </div>
      </section>

      {/* ── NICHOS — oculto temporalmente, descomentar para activar ── */}
      {false && <div className={s.nichosOuter}>
      <div className={s.nichos}>
        {[...sectores, ...sectores].map((sec, i) => (
          <Link key={i} href={sec.href} className={s.nicho} aria-hidden={i >= sectores.length ? 'true' : undefined}>
            <div className={s.nichoIco}><sec.Icon size={22} strokeWidth={1.75} /></div>
            <div className={s.nichoName}>{sec.label}</div>
            <div className={s.nichoDesc}>{sec.desc}</div>
            <div className={s.nichoGo}>Ver ofertas <ChevronRight size={13} /></div>
          </Link>
        ))}
      </div>
      </div>}

      {/* ── PERFIL PREVIEW ── */}
      <section className={s.profileSec}>
        {/* Left: texto */}
        <div>
          <h2 className={s.profileH}>Así se ve tu<br/>perfil laboral digital</h2>
          <p className={s.profileSub}>Un espacio profesional para mostrar quién sos y todo lo que podés lograr.</p>
          <div className={s.profileChecks}>
            {['Tu VideoCV','Tu experiencia y habilidades','Tu CV listo para descargar','Tu link para compartir'].map(t => (
              <span key={t} className={s.profileCheck}>
                <CircleCheck size={15} strokeWidth={2} color="#22C55E"/>
                {t}
              </span>
            ))}
          </div>
          <div className={s.profileHandwriting}>
            <ArrowRight size={13}/> Compartilo con quien quieras
          </div>
        </div>

        {/* Centro: video thumb */}
        <div className={s.profileVideoThumb}>
          <img src="/candidato.png" alt="Video CV"/>
          <div className={s.profilePlayBtn}>
            <Play size={20} fill="#5B3FE0" color="#5B3FE0"/>
          </div>
        </div>

        {/* Derecha: profile card mock */}
        <div className={s.profileCard}>
          <div className={s.profileCardHeader}>
            <div className={s.profileCardAvatar}>
              <User size={26} strokeWidth={1.5} color="#fff"/>
            </div>
            <div>
              <div className={s.profileCardName}>Federico Martinez</div>
              <div className={s.profileCardRole}>Operario | Técnico en mantenimiento industrial</div>
              <div className={s.profileCardLoc}><MapPin size={9} strokeWidth={2}/> Buenos Aires, Argentina</div>
            </div>
          </div>
          <div className={s.profileCardSkills}>
            {['Creatividad','Comunicación','Trabajo en equipo','Liderazgo'].map(sk => (
              <span key={sk} className={s.profileCardSkill}>{sk}</span>
            ))}
          </div>
          <div className={s.profileCardDivider}/>
          <div className={s.profileCardBioLabel}>Sobre mí</div>
          <div className={s.profileCardBioText}>Me apasiona crear proyectos que generen impacto. Soy responsable, creativo y me adapto rápido a nuevos desafíos.</div>
          <div className={s.profileCardBottom}>
            <div className={s.profileCardActions}>
              <Link href="/register" className={s.profileCardBtnPrimary}><Video size={11} strokeWidth={2}/> Ver VideoCV</Link>
              <Link href="/register" className={s.profileCardBtnSecondary}><Download size={11} strokeWidth={2}/> Descargar CV</Link>
              <Link href="/register" className={s.profileCardBtnOutline}><Send size={11} strokeWidth={2}/> Compartir perfil</Link>
            </div>
            <div className={s.profileCardQR}>▦</div>
          </div>
        </div>
      </section>

      {/* ── KORAI ── */}
      <section className={s.koraiSec}>
        {/* Left: texto */}
        <div>
          <div className={s.koraiLogo}>
            <span style={{ fontSize: 26 }}>🚦</span>
            <div>
              <div className={s.koraiLogoText}>KORAI</div>
              <div className={s.koraiLogoSub}>por OportunAI</div>
            </div>
          </div>
          <h2 className={s.koraiH}>Conocé tu punto de partida<br/>para llegar más lejos</h2>
          <p className={s.koraiSub}>El diagnóstico de Korai te ayuda a identificar tus fortalezas, detectar qué necesitás y armar un plan de acción personalizado.</p>
          <Link href="https://app.korai.lat" target="_blank" className={s.koraiCtaBtn}>
            Hacer diagnóstico gratis <ArrowRight size={14}/>
          </Link>
        </div>

        {/* Centro: ilustración */}
        <div className={s.koraiIllustrationWrap}>
          <img
            src="/korai-illustration.png"
            alt="Diagnóstico de acompañamiento Korai"
            className={s.koraiIllustrationImg}
          />
        </div>

        {/* Derecha: result box */}
        <div className={s.koraiResultBox}>
          <div className={s.koraiResultH}>Tu resultado</div>
          <div className={s.koraiResultGrid}>
            <div className={s.koraiResult} style={{ background: 'rgba(34,197,94,0.10)' }}>
              <div className={s.koraiResultN} style={{ color: '#16A34A' }}>3</div>
              <div className={s.koraiResultL} style={{ color: '#16A34A' }}>Fortalezas</div>
            </div>
            <div className={s.koraiResult} style={{ background: 'rgba(249,115,22,0.10)' }}>
              <div className={s.koraiResultN} style={{ color: '#EA580C' }}>2</div>
              <div className={s.koraiResultL} style={{ color: '#EA580C' }}>A mejorar</div>
            </div>
            <div className={s.koraiResult} style={{ background: 'rgba(239,68,68,0.10)' }}>
              <div className={s.koraiResultN} style={{ color: '#DC2626' }}>1</div>
              <div className={s.koraiResultL} style={{ color: '#DC2626' }}>Prioridad</div>
            </div>
          </div>
          <div className={s.koraiResultSub}>Recibí recomendaciones y recursos para avanzar en cada área.</div>
          <Link href="https://app.korai.lat" target="_blank" className={s.koraiResultCta}>
            Ver mi plan de acción <ArrowRight size={14}/>
          </Link>
        </div>
      </section>

      {/* ── CAPACITACIONES ── */}
      <section className={s.sec}>
        <div className={s.secHead}>
          <div>
            <p className={s.eyebrow}>Exclusivo Oportunai · Gratis</p>
            <h2 className={s.secH}>Aprendé antes de arrancar.<br/>Entrá capacitado desde el día uno.</h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 420, margin: '8px 0 0' }}>Capacitaciones en video para estaciones de servicio, atención al cliente y comidas rápidas. Cargadas por las mismas empresas que buscan personal.</p>
            <p style={{ fontSize: 13, color: '#5B3FE0', fontWeight: 600, margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CircleCheck size={14} strokeWidth={2}/> Incluye Test de Nativo Digital — completalo y destacate en tu perfil
            </p>
          </div>
          <Link href="/register" className={s.verMas}>Ver todas →</Link>
        </div>
        <div className={s.capGrid}>
          {talleres.length > 0
            ? talleres.map((t, i) => {
                const th = TALLER_ICONS[i % TALLER_ICONS.length];
                return (
                  <Link key={t.id} href="/register" className={s.capCard}>
                    <div className={s.capThumb} style={{ background: th.bg }}>
                      <div className={s.capThumbIcon}>
                        <th.Icon size={44} strokeWidth={1} color={th.color} />
                      </div>
                      <div className={s.capPlay}>
                        <Video size={12} /> Disponible · Gratis
                      </div>
                    </div>
                    <div className={s.capBody}>
                      <div className={s.capRubro}>{th.rubro}</div>
                      <div className={s.capTitle}>{t.nombre}</div>
                      {t.descripcion && (
                        <div className={s.capMeta}>{t.descripcion.slice(0, 55)}{t.descripcion.length > 55 ? '…' : ''}</div>
                      )}
                    </div>
                  </Link>
                );
              })
            : CAP_FALLBACK.map(c => (
                <Link key={c.titulo} href="/register" className={s.capCard}>
                  <div className={s.capThumb} style={{ background: c.bg }}>
                    <div className={s.capThumbIcon}>
                      <c.Icon size={44} strokeWidth={1} color={c.color} />
                    </div>
                    <div className={s.capPlay}>
                      <Video size={12} /> {c.dur} · Gratis
                    </div>
                  </div>
                  <div className={s.capBody}>
                    <div className={s.capRubro}>{c.rubro}</div>
                    <div className={s.capTitle}>{c.titulo}</div>
                    <div className={s.capMeta}>
                      <span>⏱ {c.dur}</span>
                      <span className={s.capEmpresa}>{c.emp}</span>
                    </div>
                  </div>
                </Link>
              ))
          }
        </div>
      </section>

      {/* ── EMPRESA ── */}
      <section className={s.empNewSec}>
        <div className={s.empNewL}>
          <div className={s.empNewIcon}><Building2 size={26} strokeWidth={1.75}/></div>
          <h2 className={s.empNewH}>¿Sos una empresa y buscás<br/>personas para tu equipo?</h2>
          <p className={s.empNewSub}>Conocé perfiles laborales y VideoCV de personas que están buscando nuevas oportunidades.</p>
          <div className={s.empNewBtns}>
            <Link href="/register-empresa" className={s.empNewBtnP}>Registrarme como empresa</Link>
            <Link href="/register-empresa" className={s.empNewBtnS}>Más información para empresas →</Link>
          </div>
        </div>
        <div className={s.empNewLaptop}>
          <div className={s.empNewLaptopBody}>
            <div className={s.empNewLaptopScreen}>
              <div className={s.empScreenTopBar}>
                <div className={s.empScreenDot} style={{ background: '#EF4444' }}/>
                <div className={s.empScreenDot} style={{ background: '#F59E0B' }}/>
                <div className={s.empScreenDot} style={{ background: '#22C55E' }}/>
              </div>
              <div className={s.empScreenGrid}>
                {([
                  { w: 80, c: 'linear-gradient(90deg,#5B3FE0,#8B6CF6)' },
                  { w: 60, c: 'linear-gradient(90deg,#14C7A8,#0A9485)' },
                  { w: 90, c: 'linear-gradient(90deg,#5B3FE0,#8B6CF6)' },
                  { w: 70, c: 'linear-gradient(90deg,#14C7A8,#0A9485)' },
                  { w: 85, c: 'linear-gradient(90deg,#5B3FE0,#8B6CF6)' },
                  { w: 55, c: 'linear-gradient(90deg,#14C7A8,#0A9485)' },
                ] as const).map((bar, i) => (
                  <div key={i} className={s.empScreenCard}>
                    <div className={s.empScreenBar} style={{ background: '#e2e8f0' }}>
                      <div style={{ width: `${bar.w}%`, height: '100%', borderRadius: 3, background: bar.c }}/>
                    </div>
                    <div className={s.empScreenBarLine}/>
                    <div className={s.empScreenBarLine} style={{ width: '65%' }}/>
                  </div>
                ))}
              </div>
            </div>
            <div className={s.empNewLaptopBase}/>
          </div>
          <div className={s.empNewLaptopFoot}/>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className={s.statsBarNew}>
        {([
          { Icon: Users,        t: 'Miles de personas\nya crearon su perfil' },
          { Icon: Video,        t: 'Miles de VideoCV\ncompartidos' },
          { Icon: ClipboardList,t: 'Acompañamiento real\npara tu búsqueda' },
          { Icon: Heart,        t: 'Herramientas gratuitas\npara crecer' },
        ] as const).map(item => (
          <div key={item.t} className={s.statsBarItem}>
            <div className={s.statsBarIco}><item.Icon size={18} strokeWidth={1.75}/></div>
            <span className={s.statsBarT}>{item.t}</span>
          </div>
        ))}
      </div>

      {/* ── BUSCADOR LENGUAJE NATURAL ── */}
      <BuscadorNL variant="home" />

      {/* ── POR QUÉ OPORTUNAI ── */}
      <section className={s.whySec}>
        <div className={s.whyHead}>
          <p className={s.eyebrow}>Confianza · Trayectoria · Propósito</p>
          <h2 className={s.secH}>¿Por qué OportunAI?</h2>
          <p className={s.whySub}>Tecnología con experiencia.<br/>Selección con propósito.</p>
        </div>
        <div className={s.whyBlocks}>
          <div className={s.whyBlock}>
            <div className={s.whyBlockIco} style={{ background: 'linear-gradient(135deg,#0A9485,#14C7A8)', boxShadow: '0 4px 16px rgba(20,199,168,0.35)' }}>
              <Heart size={20} color="#fff" strokeWidth={2} />
            </div>
            <h3 className={s.whyBlockH}>Impulsada por la ONG CAII</h3>
            <p className={s.whyBlockP}>OportunAI es una iniciativa desarrollada por la ONG CAII para generar más oportunidades de capacitación y empleo mediante tecnología.</p>
            <p className={s.whyBlockP}>Ayudamos a empresas, comercios y organizaciones a seleccionar mejor a sus candidatos mediante VideoCV y capacitación, mientras impulsamos más oportunidades laborales para quienes buscan trabajo.</p>
          </div>
          <div className={s.whyBlock}>
            <div className={s.whyBlockIco} style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 16px rgba(91,63,224,0.35)' }}>
              <Video size={20} color="#fff" strokeWidth={2} />
            </div>
            <h3 className={s.whyBlockH}>+10 años transformando la selección</h3>
            <p className={s.whyBlockP}>OportunAI cuenta con el respaldo de Tu VideoCV, la startup argentina pionera en la incorporación del VideoCV en procesos de selección.</p>
            <p className={s.whyBlockP}>Desde 2015 desarrollamos tecnología utilizada por grandes empresas. Hoy esa experiencia se pone al servicio de una plataforma con impacto social.</p>
          </div>
        </div>

        {/* Galería */}
        <div className={s.whyGallery}>
          {(galeriaDB.length > 0 ? galeriaDB : GALLERY_SLOTS).map((slot, i) => {
            const isReal = galeriaDB.length > 0;
            const big = slot.big;
            if (isReal) {
              const item = slot as typeof galeriaDB[0];
              return (
                <div key={item.id} className={`${s.whyGalleryItem}${big ? ` ${s.whyGalleryBig}` : ''}`}>
                  <img src={item.src} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              );
            }
            const placeholder = slot as typeof GALLERY_SLOTS[0];
            return (
              <div key={i} className={`${s.whyGalleryItem}${big ? ` ${s.whyGalleryBig}` : ''}`} style={{ background: placeholder.bg }}>
                <div className={s.whyGalleryPh}>
                  <Camera size={big ? 34 : 22} style={{ color: placeholder.color, opacity: 0.45 }} strokeWidth={1.5} />
                  <span style={{ color: placeholder.color, opacity: 0.55, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>{placeholder.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cierre */}
        <div className={s.whyClose}>
          <p className={s.whyCloseQ}>
            La tecnología cambia la forma de contratar.<br/>
            <span className={s.whyCloseQAccent}>La misión cambia la vida de las personas.</span>
          </p>
          <p className={s.whyCloseBody}>Cada empresa que utiliza OportunAI mejora sus procesos de selección y, al mismo tiempo, acompaña una iniciativa que amplía el acceso a la capacitación y al empleo.</p>
          <a href="#" className={s.whyCloseBtn}>Conocé nuestra historia →</a>
        </div>

      </section>

      {/* ── CTA FINAL ── */}
      <section className={s.ctaFinal}>
        <p className={s.ctaTag}>Gratis · Desde el celular · 2 minutos</p>
        <h2 className={s.ctaH}>Empezá hoy.<br/>Tu oportunidad te espera.</h2>
        <div className={s.ctaBtns}>
          <Link href="/register" className={s.ctaBtnP}>
            <Video size={16} strokeWidth={2} />
            Crear mi Video CV
          </Link>
          <Link href="/register-empresa" className={s.ctaBtnS}>
            <Building2 size={16} strokeWidth={2} />
            Soy empresa
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={s.foot}>
        <span className={s.footBrand}>OPORTUNAI</span>
        <div className={s.footLinks}>
          <Link href="#" className={s.footLink}>Privacidad</Link>
          <Link href="#" className={s.footLink}>Contacto</Link>
          <Link href="/register-empresa" className={s.footLink}>Para empresas</Link>
        </div>
        <span className={s.footCopy}>2026 · Video CV y capacitaciones</span>
      </footer>

    </div>
  );
}

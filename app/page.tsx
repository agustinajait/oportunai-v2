export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Fuel, Headphones, UtensilsCrossed,
  Video, FileText, User, Users, MapPin,
  GraduationCap, ClipboardList, RefreshCw,
  HardHat, Handshake, Building2, ChevronRight,
  Target, Smartphone, Smile, Play, Send, CircleCheck,
  Heart, Camera, ArrowRight, Download, BrainCircuit, Sparkles, BadgeCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import s from './landing.module.css';
import AlfaExpandable from './AlfaExpandable';
import BuscadorNL from '@/components/ui/BuscadorNL';
import HeroVideo from '@/components/ui/HeroVideo';
import ScrollReveal from '@/components/ui/ScrollReveal';
import ScrollArrow from '@/components/ui/ScrollArrow';

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
    label: 'Gastronomía',
    desc:  'Restaurantes, cafeterías, cocina, caja',
    Icon:  UtensilsCrossed,
    href:  '/ofertas',
    keys:  ['gastronomia', 'gastronomía', 'comida', 'restaurant', 'cafeteria', 'cafetería', 'cocina', 'food', 'hamburgue', 'pizza', 'mozo', 'barman'],
  },
];

const TALLER_ICONS = [
  { bg: '#ECE9FB', color: '#5B3FE0', rubro: 'Estación de servicio',  Icon: Fuel },
  { bg: '#E3FAF4', color: '#0E9C82', rubro: 'Atención al cliente',   Icon: Headphones },
  { bg: '#FFF3E8', color: '#D97706', rubro: 'Gastronomía',            Icon: UtensilsCrossed },
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
  { bg: '#FFF3E8', color: '#D97706', rubro: 'Gastronomía',            titulo: 'Atención y manejo de caja',        dur: '10 min', emp: 'Empresa local',  Icon: UtensilsCrossed },
];

function countSector(ofertas: { area: string | null; titulo: string }[], keys: string[]) {
  return ofertas.filter(o =>
    keys.some(k => `${o.area ?? ''} ${o.titulo}`.toLowerCase().includes(k))
  ).length;
}

export default async function LandingPage() {
  const [ofertasActivas, talleres, galeriaDB, capacitateContenidos] = await Promise.all([
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
    prisma.capacitateContenido.findMany({
      where: { activa: true },
      orderBy: { orden: 'asc' },
      select: { slug: true, titulo: true, icono: true, categoria: true, descripcion: true },
      take: 6,
    }).catch(() => [] as { slug: string; titulo: string; icono: string | null; categoria: string; descripcion: string }[]),
  ]);

  const totalOfertas = ofertasActivas.length;
  const sectores = SECTORES.map(sec => ({
    ...sec,
    count: countSector(ofertasActivas, sec.keys),
  }));

  return (
    <div className={s.wrapper}>
      <ScrollReveal />

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
          <Link href="/register" className={s.btnFill}>Crear mi perfil</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={s.heroNew}>

        {/* ── Izquierda: copy ── */}
        <div className={s.heroNewLeft}>
          <span className={s.heroNewBadge}>Tu perfil laboral digital</span>

          <h1 className={s.heroNewH}>
            El primer creador de<br/><span className={s.heroNewAccent}>Perfil Laboral Digital</span>
          </h1>

          <p className={s.heroNewSub}>
            No importa si nunca hiciste un CV. Contanos lo que sabés y te lo armamos nosotros.
            Grabá tu VideoCV, analizamos tu perfil y te damos el CV listo para cada oferta.
          </p>

          <div className={s.heroNewPills}>
            <span className={s.heroNewPill}><Video size={13} strokeWidth={2}/> VideoCV</span>
            <span className={s.heroNewPill}><FileText size={13} strokeWidth={2}/> CV optimizado ATS</span>
            <span className={s.heroNewPill}><BrainCircuit size={13} strokeWidth={2}/> Análisis de perfil</span>
            <span className={`${s.heroNewPill} ${s.heroNewPillActive}`}><Target size={13} strokeWidth={2}/> CV adaptado por oferta</span>
          </div>

          <Link href="/register" className={s.heroNewCtaBtn}>
            Crear mi perfil <ArrowRight size={16} strokeWidth={2.5}/>
          </Link>

          <p className={s.heroNewHint}>
            <CircleCheck size={14} strokeWidth={2}/>
            En minutos, desde tu celular.
          </p>

          {/* Scroll down arrow — desktop only */}
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScrollArrow targetId="steps" dark />
            <span style={{ fontSize: 12, color: '#b0b0c4', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Cómo funciona
            </span>
          </div>
        </div>

        {/* ── Derecha: video o foto + cards flotantes ── */}
        <div className={s.heroNewRight}>
          <div className={s.heroNewPhotoWrap}>
            <HeroVideo />
          </div>

          {/* Card 1 — VideoCV */}
          <div className={`${s.heroCard} ${s.heroCard1}`}>
            <div className={s.heroCardInner}>
              <div className={s.heroCardIco} style={{ background: 'rgba(91,63,224,0.12)' }}>
                <Video size={16} strokeWidth={1.75} color="#5B3FE0"/>
              </div>
              <div className={s.heroCardTitle}>VideoCV</div>
            </div>
            <div className={s.heroCardSub}>Mostrá lo que un CV no dice</div>
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

          {/* Card 3 — Fit Check */}
          <div className={`${s.heroCard} ${s.heroCard3}`}>
            <div className={s.heroCardInner}>
              <div className={s.heroCardIco} style={{ background: 'rgba(59,130,246,0.12)' }}>
                <BrainCircuit size={16} strokeWidth={1.75} color="#3B82F6"/>
              </div>
              <div className={s.heroCardTitle}>Adaptación al puesto</div>
            </div>
            <div className={s.heroCardSub}>Tu CV reescrito para cada oferta</div>
            <div className={s.heroCardBar}><div className={`${s.heroCardBarFill} ${s.heroCardBarTeal}`}/></div>
          </div>
        </div>

      </section>

      {/* ── STEPS — Tu camino en 5 pasos ── */}
      <section id="steps" className={s.secSteps}>
        <div className={`${s.secStepsHead} sr-up`}>
          <h2 className={s.secStepsH}>
            Tu camino en <span className={s.secStepsAccent}>5 pasos</span>
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
            Desde cero hasta conseguir tu trabajo — así es el proceso.
          </p>
        </div>

        <div className={s.stepsNew}>
          {([
            { n: '1', numBg: '#5B3FE0', icoBg: 'rgba(91,63,224,0.10)',  icoColor: '#5B3FE0', Icon: User,         t: 'Creá tu perfil',               d: 'Registrate y completá tus datos básicos. Tarda menos de 2 minutos.' },
            { n: '2', numBg: '#EF4444', icoBg: 'rgba(239,68,68,0.10)',  icoColor: '#EF4444', Icon: Video,        t: 'Grabá tu VideoCV',             d: 'Mostrá tu personalidad y habilidades que un CV no transmite. Cada grabación también te entrena para hablar mejor en tus entrevistas.' },
            { n: '3', numBg: '#22C55E', icoBg: 'rgba(34,197,94,0.10)',  icoColor: '#22C55E', Icon: Sparkles,     t: 'Te generamos el CV',           d: 'Contanos tu experiencia como puedas. Nosotros la convertimos en un CV profesional, optimizado para pasar los filtros automáticos de las empresas (ATS).' },
            { n: '4', numBg: '#F97316', icoBg: 'rgba(249,115,22,0.10)', icoColor: '#F97316', Icon: Target,       t: 'Postulate y destacate',        d: 'Adaptamos tu CV a cada oferta que te interesa. Las empresas te encuentran por tu perfil digital.' },
          ] as const).flatMap((step, i, arr) => [
            <div key={step.n} className={`${s.stepNew} sr-up sr-d${i + 1}`}>
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
            {['Tu VideoCV — mostrás lo que un CV no dice','Tu actitud y comunicación en 60 segundos','Tu CV optimizado listo para descargar','Tu link para compartir con cualquier empresa'].map(t => (
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

      {/* ── HERRAMIENTAS IA ── */}
      <section className={`${s.sec} sr-up`} style={{ background: 'linear-gradient(180deg,#f8f7ff 0%,#ffffff 100%)' }}>
        <div className={s.secHead}>
          <div>
            <p className={s.eyebrow}>Incluido en tu perfil</p>
            <h2 className={s.secH}>Hacemos el trabajo pesado<br/>para que vos te enfoqués en postularte.</h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, maxWidth: 480, margin: '8px 0 0' }}>
              No importa si nunca hiciste un CV. Contanos lo que sabés, nosotros lo convertimos en un perfil profesional, analizamos cómo estás posicionado y preparamos tu CV para cada oferta que te interesa.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, marginTop: 32 }}>
          {/* Herramienta 1 */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid rgba(91,63,224,0.12)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(91,63,224,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={22} strokeWidth={1.75} color="#5B3FE0"/>
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1e1b4b' }}>Te generamos el CV</div>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Escribí tu experiencia como puedas — informal, desordenada, en tus palabras. Lo convertimos en un CV completo, profesional y optimizado para pasar los filtros automáticos de selección (ATS) de las grandes empresas.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {['Optimizado para filtros ATS', 'Descargable en Word y PDF', 'Cualquier rubro'].map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 600, color: '#5B3FE0', background: 'rgba(91,63,224,0.08)', borderRadius: 20, padding: '3px 10px' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Herramienta 2 */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid rgba(20,199,168,0.15)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(20,199,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BrainCircuit size={22} strokeWidth={1.75} color="#0A9485"/>
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1e1b4b' }}>Analizamos tu CV</div>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Evaluamos tu CV con un puntaje del 0 al 100, detectamos qué falta, señalamos tus fortalezas y te damos consejos concretos para pasar los filtros de las grandes empresas.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {['Puntaje ATS', 'Qué mejorar', 'Fortalezas detectadas'].map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 600, color: '#0A9485', background: 'rgba(20,199,168,0.08)', borderRadius: 20, padding: '3px 10px' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Herramienta 3 */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid rgba(249,115,22,0.15)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(249,115,22,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={22} strokeWidth={1.75} color="#F97316"/>
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1e1b4b' }}>Adaptamos tu CV a cada oferta</div>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Pegá la descripción de cualquier oferta y te decimos qué tan compatible sos, qué requisitos cumplís y reescribimos tu CV resaltando lo más relevante para ese trabajo específico.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {['Match score', 'CV adaptado', 'Consejos de postulación'].map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 600, color: '#F97316', background: 'rgba(249,115,22,0.08)', borderRadius: 20, padding: '3px 10px' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/register" className={s.heroNewCtaBtn} style={{ display: 'inline-flex' }}>
            Crear mi perfil <ArrowRight size={16} strokeWidth={2.5}/>
          </Link>
        </div>
      </section>

      {/* ── CAPACITACIONES ── */}
      <section className={`${s.sec} sr-up`}>
        <div className={s.secHead}>
          <div>
            <p className={s.eyebrow}>Exclusivo Oportunai</p>
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
                        <Video size={12} /> Disponible
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
                      <Video size={12} /> {c.dur}
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

      {/* ── CAPACITATE: cursos propios ── */}
      <section className={`${s.sec} sr-up`} style={{ background: 'linear-gradient(180deg, #f0fdf9 0%, #ffffff 100%)' }}>
        <div className={s.secHead}>
          <div>
            <p className={s.eyebrow} style={{ color: '#0A9485' }}>🎓 Capacitate · Oportunai</p>
            <h2 className={s.secH}>Desarrollá competencias.<br/>Sumá certificados a tu perfil.</h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 420, margin: '8px 0 0' }}>
              Módulos cortos con quiz final. Cada curso que aprobás aparece certificado en tu perfil público y lo ven los empleadores.
            </p>
          </div>
          <Link href="/register" className={s.verMas} style={{ color: '#0A9485', borderColor: '#0A9485' }}>Ver todos →</Link>
          {/* "Ver todos" podría apuntar a /capacitate cuando haya listado público */}
        </div>

        <div className={s.capacitateGrid}>
          {(capacitateContenidos.length > 0 ? capacitateContenidos : [
            { slug: 'asistente-ia',     titulo: 'Asistente de IA',     icono: '🤖', categoria: 'Digital',       descripcion: 'Usá IA para resolver tareas laborales concretas.' },
            { slug: 'excel-basico',     titulo: 'Excel Básico',        icono: '📊', categoria: 'Digital',       descripcion: 'Tablas, fórmulas y formatos para el trabajo cotidiano.' },
            { slug: 'atencion-cliente', titulo: 'Atención al Cliente', icono: '🤝', categoria: 'Soft skills',   descripcion: 'Comunicación efectiva y manejo de situaciones difíciles.' },
            { slug: 'cv-digital',       titulo: 'CV y Perfil Digital', icono: '📄', categoria: 'Empleabilidad', descripcion: 'Cómo armar un perfil que llame la atención de los empleadores.' },
            { slug: 'entrevista',       titulo: 'Entrevista Laboral',  icono: '🎯', categoria: 'Empleabilidad', descripcion: 'Preparate para responder con confianza y claridad.' },
            { slug: 'trabajo-equipo',   titulo: 'Trabajo en Equipo',   icono: '👥', categoria: 'Soft skills',   descripcion: 'Colaboración, comunicación y resolución de conflictos.' },
          ]).map((c) => (
            <Link key={c.slug} href={`/capacitate/${c.slug}`} className={s.capacitateCard}>
              <div className={s.capacitateIcon}>{c.icono ?? '📚'}</div>
              <div>
                <p className={s.capacitateTitle}>{c.titulo}</p>
                <p className={s.capacitateCategoria}>{c.categoria}</p>
                {c.descripcion && (
                  <p className={s.capacitateDesc}>
                    {c.descripcion.length > 70 ? c.descripcion.slice(0, 70) + '…' : c.descripcion}
                  </p>
                )}
              </div>
              <div className={s.capacitateFoot}>
                <span className={s.capacitateBadge}>✓ Certificado</span>
                
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── EMPRESA ── */}
      <section className={`${s.empNewSec} sr-up`}>
        <div className={s.empNewL}>
          <div className={s.empNewIcon}><Building2 size={26} strokeWidth={1.75}/></div>
          <h2 className={s.empNewH}>¿Sos una empresa y buscás<br/>personas para tu equipo?</h2>
          <p className={s.empNewSub}>Conocé perfiles laborales y VideoCV de personas que están buscando nuevas oportunidades.</p>
          <div className={s.empNewBtns}>
            <Link href="/register-empresa" className={s.empNewBtnP}>Registrarme como empresa</Link>
            <Link href="/register-empresa" className={s.empNewBtnS}>Más información para empresas →</Link>
          </div>
        </div>
        <div className={s.empNewVideoWrap}>
          <video
            src="/lv_0_20260820064441.mp4"
            autoPlay
            muted
            loop
            playsInline
            className={s.empNewVideo}
          />
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
          <h2 className={s.secH}>Quiénes estamos detrás</h2>
          <p className={s.whySub}>No somos una startup de Silicon Valley.<br/>Somos un equipo argentino con 10 años en el campo.</p>
        </div>
        <div className={s.whyBlocks}>
          <div className={s.whyBlock}>
            <div className={s.whyBlockIco} style={{ background: 'linear-gradient(135deg,#0A9485,#14C7A8)', boxShadow: '0 4px 16px rgba(20,199,168,0.35)' }}>
              <Heart size={20} color="#fff" strokeWidth={2} />
            </div>
            <h3 className={s.whyBlockH}>ONG CAII — 10 años acompañando la empleabilidad</h3>
            <p className={s.whyBlockP}>La ONG CAII trabaja desde 2015 en Argentina acompañando a personas en situación de vulnerabilidad social hacia el empleo formal. No lo hacemos desde un escritorio — lo hacemos en territorio, con las personas y para las personas.</p>
            <p className={s.whyBlockP}>OportunAI es nuestra apuesta tecnológica para multiplicar ese impacto. La IA nos permite llegar a más personas con mejores herramientas, sin perder el foco humano que nos define.</p>
          </div>
          <div className={s.whyBlock}>
            <div className={s.whyBlockIco} style={{ background: 'linear-gradient(135deg,#4B33CC,#7048F0)', boxShadow: '0 4px 16px rgba(91,63,224,0.35)' }}>
              <Video size={20} color="#fff" strokeWidth={2} />
            </div>
            <h3 className={s.whyBlockH}>Tu VideoCV — pioneros del VideoCV en Argentina</h3>
            <p className={s.whyBlockP}>Antes de que fuera tendencia, ya lo estábamos construyendo. Desde 2015 desarrollamos tecnología de VideoCV que hoy usan empresas líderes de Argentina para sus procesos de selección.</p>
            <p className={s.whyBlockP}>Con esa experiencia acumulada en miles de procesos de selección, hoy ponemos esa misma tecnología — y todo lo que aprendimos — al servicio de los candidatos.</p>
          </div>
        </div>

        {/* Stats de trayectoria */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', margin: '32px 0' }}>
          {[
            { n: '+10 años', d: 'de experiencia en RRHH y tecnología' },
            { n: '+500 empresas', d: 'utilizaron nuestra tecnología de VideoCV' },
            { n: '100% Argentina', d: 'equipo local, conocemos el mercado' },
            { n: 'IA + propósito', d: 'tecnología al servicio del impacto social' },
          ].map(stat => (
            <div key={stat.n} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '18px 24px', textAlign: 'center', minWidth: 180 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#5B3FE0', letterSpacing: '-0.02em' }}>{stat.n}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>{stat.d}</div>
            </div>
          ))}
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
        <p className={s.ctaTag}>Desde el celular · 2 minutos</p>
        <h2 className={s.ctaH}>Tu próximo trabajo<br/>empieza acá.</h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, margin: '0 0 28px', maxWidth: 420, textAlign: 'center', lineHeight: 1.6 }}>
          Creá tu perfil, grabá tu VideoCV y nosotros te armamos el CV.
        </p>
        <div className={s.ctaBtns}>
          <Link href="/register" className={s.ctaBtnP}>
            <Sparkles size={16} strokeWidth={2} />
            Crear mi perfil
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
        <span className={s.footCopy}>2026 · OportunAI — impulsado por ONG CAII</span>
      </footer>

    </div>
  );
}

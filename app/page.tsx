export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Fuel, Headphones, UtensilsCrossed,
  Video, FileText, User,
  GraduationCap, ClipboardList, RefreshCw,
  HardHat, Handshake, Building2, ChevronRight,
  Target, Smartphone, Smile, Play, Send, CircleCheck,
  Heart, Camera, ArrowRight, Download,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import s from './landing.module.css';
import AlfaExpandable from './AlfaExpandable';

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
          <Link href="#"               className={s.navLink}>Sobre OportunAI</Link>
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
            Creá tu perfil<br/>laboral digital<br/>con <span className={s.heroNewAccent}>VideoCV.</span>
          </h1>

          <p className={s.heroNewSub}>
            Mostrá quién sos, destacá lo que sabés hacer y recibí herramientas,
            oportunidades y acompañamiento para encontrar trabajo.
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

        {/* ── Derecha: foto + cards flotantes ── */}
        <div className={s.heroNewRight}>
          <div className={s.heroNewPhotoWrap}>
            <img src="/candidato.png" alt="Candidata con celular buscando trabajo" />
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

      {/* ── NICHOS ── */}
      <div className={s.nichosOuter}>
      <div className={s.nichos}>
        {[...sectores, ...sectores].map((sec, i) => (
          <Link key={i} href={sec.href} className={s.nicho} aria-hidden={i >= sectores.length ? 'true' : undefined}>
            <div className={s.nichoIco}>
              <sec.Icon size={22} strokeWidth={1.75} />
            </div>
            <div className={s.nichoName}>{sec.label}</div>
            <div className={s.nichoDesc}>{sec.desc}</div>
            <div className={s.nichoGo}>Ver ofertas <ChevronRight size={13} /></div>
          </Link>
        ))}
      </div>
      </div>

      {/* ── STEPS — Tu camino en 5 pasos ── */}
      <section className={s.secSteps}>
        <div className={s.secStepsHead}>
          <h2 className={s.secStepsH}>
            Tu camino en <span className={s.secStepsAccent}>5 pasos</span>
          </h2>
        </div>

        <div className={s.stepsNew}>
          {([
            { n: '1', numBg: '#5B3FE0', icoBg: 'rgba(91,63,224,0.10)',  icoColor: '#5B3FE0', Icon: User,     t: 'Armá tu perfil',         d: 'Contá tu experiencia, habilidades y lo que buscás.' },
            { n: '2', numBg: '#EF4444', icoBg: 'rgba(239,68,68,0.10)',  icoColor: '#EF4444', Icon: Video,    t: 'Grabá tu VideoCV',        d: 'Presentate en video y mostrá quién sos en 60 segundos.' },
            { n: '3', numBg: '#22C55E', icoBg: 'rgba(34,197,94,0.10)',  icoColor: '#22C55E', Icon: FileText, t: 'Obtené tu CV',            d: 'Generamos tu CV optimizado listo para postularte.' },
            { n: '4', numBg: '#3B82F6', icoBg: 'rgba(59,130,246,0.10)', icoColor: '#3B82F6', Icon: Target,   t: 'Hacé tu diagnóstico',     d: 'Identificá tus fortalezas y qué podés mejorar.' },
            { n: '5', numBg: '#F97316', icoBg: 'rgba(249,115,22,0.10)', icoColor: '#F97316', Icon: Heart,    t: 'Recibí acompañamiento',   d: 'Te acercamos oportunidades, recursos y herramientas.' },
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

      {/* ── CAPACITACIONES ── */}
      <section className={s.sec}>
        <div className={s.secHead}>
          <div>
            <p className={s.eyebrow}>Exclusivo Oportunai · Gratis</p>
            <h2 className={s.secH}>Aprendé antes de arrancar.<br/>Entrá capacitado desde el día uno.</h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 420, margin: '8px 0 0' }}>Capacitaciones en video para estaciones de servicio, atención al cliente y comidas rápidas. Cargadas por las mismas empresas que buscan personal.</p>
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

      {/* ── ALFA DIGITAL ── */}
      <div className={s.alfaStrip}>
        <div className={s.alfaStripHead}>
          <div>
            <p className={s.alfaStripTag}>Exclusivo Oportunai</p>
            <h2 className={s.alfaStripH}>Test de Nativo Digital.<br/>Completalo y destacate.</h2>
            <p className={s.alfaStripP}>Respondés preguntas rápidas y tu perfil suma un badge visible para las empresas. No te lleva más de 2 minutos.</p>
          </div>
          <AlfaExpandable ctaHref="/register" />
        </div>
      </div>

      {/* ── EMPRESA SPLIT ── */}
      <section className={s.empSplit}>
        <div className={s.empL}>
          <div>
            <p className={`${s.eyebrow} ${s.empLEyebrow}`}>Para empresas</p>
            <h2 className={`${s.secH} ${s.empLH}`}>Conocés al candidato<br/>antes de llamarlo.<br/>Y llega capacitado.</h2>
            <p className={s.empLP}>Subís tus propias capacitaciones y recibís candidatos preparados. Menos entrevistas perdidas, más contrataciones exitosas.</p>
          </div>
          <Link href="/register-empresa" className={s.empLBtn}>
            <Building2 size={16} strokeWidth={2} />
            Registrar mi empresa
          </Link>
        </div>
        <div className={s.empR}>
          {[
            { Icon: Video,         t: 'Ves el video antes de entrevistar', d: 'Conocés la actitud del candidato antes de llamarlo.' },
            { Icon: GraduationCap, t: 'Subís tus propias capacitaciones',   d: 'Cargás videos para tu rubro y los candidatos los ven.' },
            { Icon: ClipboardList, t: 'Pipeline de selección',              d: 'Pendiente, contactado, contratado en un tablero.' },
            { Icon: RefreshCw,     t: 'Hecho para alta rotación',           d: 'Estaciones, atención al cliente, gastronomía — siempre hay vacantes.' },
          ].map(f => (
            <div key={f.t} className={s.efeat}>
              <div className={s.efeatIco}>
                <f.Icon size={18} strokeWidth={1.75} />
              </div>
              <div>
                <div className={s.efeatT}>{f.t}</div>
                <div className={s.efeatD}>{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── POR QUÉ OPORTUNAI ── */}
      <section className={s.whySec}>

        {/* Header */}
        <div className={s.whyHead}>
          <p className={s.eyebrow}>Confianza · Trayectoria · Propósito</p>
          <h2 className={s.secH}>¿Por qué OportunAI?</h2>
          <p className={s.whySub}>Tecnología con experiencia.<br/>Selección con propósito.</p>
        </div>

        {/* Dos bloques */}
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
        <p className={s.ctaSub}>Miles de personas en estaciones, atención al cliente y comidas rápidas<br/>ya encontraron trabajo con Oportunai.</p>
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

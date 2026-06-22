export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Fuel, Headphones, UtensilsCrossed,
  Video, Smartphone, PhoneCall,
  CreditCard, Bot, LayoutGrid,
  GraduationCap, ClipboardList, RefreshCw,
  HardHat, Handshake, Building2, ChevronRight,
  Target, Smile, Play, Send, CircleCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import s from './landing.module.css';

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

function fmtNum(n: number): string {
  if (n >= 10000) return `+${Math.floor(n / 1000)}K`;
  if (n > 0) return `+${n}`;
  return '0';
}

export default async function LandingPage() {
  const [totalCandidatos, totalEmpresas, ofertasActivas, talleres] = await Promise.all([
    prisma.usuario.count({ where: { role: 'user' } }),
    prisma.empresa.count({ where: { activa: true } }),
    prisma.oferta.findMany({
      where: { estado: 'activa' },
      select: { id: true, titulo: true, area: true },
    }),
    prisma.taller.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, descripcion: true },
      take: 3,
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
          <span className={s.logoText}>OPORTUNAI</span>
        </Link>
        <div className={s.navLinks}>
          <Link href="/ofertas" className={s.btnGhost}>Capacitaciones</Link>
          <Link href="/login" className={s.btnGhost}>Iniciar sesión</Link>
          <Link href="/register" className={s.btnFill}>Empezar gratis</Link>
        </div>
      </nav>

      {/* ── HERO SPLIT ── */}
      <div className={s.heroOuter}>
      <section className={s.heroSplit}>
        <div className={`${s.panel} ${s.panelCandidato}`}>
          <div>
            <p className={s.panelTag}>
              <HardHat size={13} strokeWidth={2} />
              Para candidatos
            </p>
            <h1 className={s.panelH}>Buscás<br/><span className={s.panelHPill}>trabajo.</span></h1>
            <p className={s.panelSub}>Grabás 60 segundos desde el celular. Las empresas te ven y te llaman. Sin CV, sin papeles.</p>
          </div>
          <Link href="/register" className={`${s.panelCta} ${s.candidatoCta}`}>
            <Video size={16} strokeWidth={2} />
            Crear mi Video CV
          </Link>
          <div className={s.panelDecor}>
            <HardHat size={140} strokeWidth={0.75} />
          </div>
        </div>
        <div className={`${s.panel} ${s.panelEmpresa}`}>
          <div>
            <p className={s.panelTag}>
              <Building2 size={13} strokeWidth={2} />
              Para empresas
            </p>
            <h1 className={s.panelH}>Buscás<br/><span className={s.panelHPill}>personal.</span></h1>
            <p className={s.panelSub}>Publicás la oferta, recibís videos y elegís. Más rápido, menos entrevistas perdidas.</p>
          </div>
          <Link href="/register-empresa" className={`${s.panelCta} ${s.empresaCta}`}>
            <Building2 size={16} strokeWidth={2} />
            Registrar mi empresa
          </Link>
          <div className={s.panelDecor}>
            <Handshake size={140} strokeWidth={0.75} />
          </div>
        </div>
      </section>
      </div>

      {/* ── STATS ROW ── */}
      <div className={s.statsOuter}>
      <div className={s.statsRow}>
        <div className={s.stat}>
          <div className={s.statN}>{fmtNum(totalCandidatos)}</div>
          <div className={s.statL}>Personas registradas</div>
        </div>
        <div className={s.stat}>
          <div className={s.statN}>{totalOfertas || '0'}</div>
          <div className={s.statL}>Ofertas activas hoy</div>
        </div>
      </div>
      </div>

      {/* ── CAP STRIP ── */}
      <div className={s.capStrip}>
        <div>
          <p className={s.capStripTag}>Exclusivo Oportunai</p>
          <h2 className={s.capStripH}>Aprendé antes de arrancar. Gratis.</h2>
          <p className={s.capStripP}>Capacitaciones en video para estaciones de servicio, atención al cliente y comidas rápidas. Cargadas por las mismas empresas que buscan personal.</p>
        </div>
        <Link href="/register" className={s.capStripBtn}>Ver capacitaciones →</Link>
      </div>

      {/* ── NICHOS ── */}
      <div className={s.nichosOuter}>
      <div className={s.nichos}>
        {sectores.map((sec) => (
          <Link key={sec.label} href={sec.href} className={s.nicho}>
            <div className={s.nichoIco}>
              <sec.Icon size={22} strokeWidth={1.75} />
            </div>
            <div className={s.nichoNum}>{sec.count}</div>
            <div className={s.nichoName}>{sec.label}</div>
            <div className={s.nichoDesc}>{sec.desc}</div>
            <div className={s.nichoGo}>Ver ofertas <ChevronRight size={13} /></div>
          </Link>
        ))}
      </div>
      </div>

      {/* ── STEPS ── */}
      <section className={`${s.sec} ${s.secDark}`}>

        {/* Intro: texto izquierda + foto derecha */}
        <div className={s.secDarkIntro}>
          <div className={s.secDarkIntroText}>
            <p className={s.eyebrow}>Es simple,</p>
            <h2 className={s.secH}>Oportunai te guía<br/><span className={s.secHPill}>paso a paso</span></h2>
            <p className={s.secDarkSub}>para que te presentes mejor que con un CV escrito.</p>
          </div>
          <div className={s.secDarkIntroVisual}>
            <div className={s.secPhotoCircle}>
              <img src="/candidato.jpg" alt="Candidato grabando Video CV" className={s.secPhoto} />
            </div>
            <div className={s.recCard}>
              <div className={s.recHeader}><span className={s.recDot}/> REC</div>
              <div className={s.recTimer}>00:60</div>
              <p className={s.recText}>Contanos quién sos y qué buscás.</p>
              <div className={s.recBtn}/>
            </div>
          </div>
        </div>

        <div className={s.steps}>
          {[
            { n: '1', Icon: Target,     t: 'Preparáte',       d: 'Pensá qué querés contar y qué te hace único/a.' },
            { n: '2', Icon: Smartphone, t: 'Grabá',            d: 'Usá tu celular. 60 segundos son suficientes.' },
            { n: '3', Icon: Smile,      t: 'Mostrate',         d: 'Sé claro/a, auténtico/a y hablá de tu experiencia.' },
            { n: '4', Icon: Play,       t: 'Revisá',           d: 'Mirá tu video, asegurate que se escuche y entienda.' },
            { n: '5', Icon: Send,       t: 'Enviá y conectá',  d: 'Las empresas te ven y te llaman. Sin CV. Sin papeles.' },
          ].flatMap((step, i, arr) => [
            <div key={step.n} className={s.step}>
              <div className={s.stepBadge}>{step.n}</div>
              <div className={s.stepIco}>
                <step.Icon size={28} strokeWidth={1.75} />
              </div>
              <div className={s.stepT}>{step.t}</div>
              <div className={s.stepD}>{step.d}</div>
            </div>,
            i < arr.length - 1
              ? <div key={`c${i}`} className={s.stepConnect}><div className={s.stepConnectLine}/></div>
              : null,
          ])}
        </div>
        <div className={s.stepsTagline}>
          <CircleCheck size={20} strokeWidth={2} />
          Más auténtico. Más rápido. Más vos. <strong>Mejores oportunidades.</strong>
        </div>
      </section>

      {/* ── CAPACITACIONES ── */}
      <section className={s.sec}>
        <div className={s.secHead}>
          <div>
            <p className={s.eyebrow}>Capacitaciones gratuitas</p>
            <h2 className={s.secH} style={{ marginBottom: 0 }}>Entrá capacitado<br/>desde el día uno.</h2>
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
      <section className={`${s.sec} ${s.secAlt}`}>
        <p className={s.eyebrow}>Para candidatos</p>
        <h2 className={s.secH}>Test de Nativo Digital.<br/>Completalo y destacate.</h2>
        <div className={s.alfaGrid}>
          {[
            { Icon: Smartphone,  t: 'Celular y conectividad', d: '¿Cómo usás el teléfono en tu vida diaria?',      badge: 'Suma a tu perfil' },
            { Icon: CreditCard,  t: 'Pagos y finanzas',        d: '¿Manejás herramientas de pago digital?',          badge: 'Suma a tu perfil' },
            { Icon: Bot,         t: 'Nuevas tecnologías',      d: '¿Conocés y usás las últimas herramientas?',        badge: 'Nativo digital' },
            { Icon: LayoutGrid,  t: 'Apps cotidianas',         d: '¿Qué apps forman parte de tu rutina?',             badge: 'Suma a tu perfil' },
          ].map(a => (
            <div key={a.t} className={s.alfaCard}>
              <div className={s.alfaIco}>
                <a.Icon size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className={s.alfaT}>{a.t}</div>
                <div className={s.alfaD}>{a.d}</div>
                <div className={s.alfaBadge}>{a.badge}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={s.alfaNote}>
          <strong>¿Cómo funciona?</strong> Respondés 4 preguntas rápidas y tu perfil suma un badge visible para las empresas. Más de dos minutos no te lleva.
        </div>
      </section>

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

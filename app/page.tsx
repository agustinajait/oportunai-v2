export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Fuel, Headphones, UtensilsCrossed,
  Video,
  GraduationCap, ClipboardList, RefreshCw,
  HardHat, Handshake, Building2, ChevronRight,
  Target, Smartphone, Smile, Play, Send, CircleCheck,
  Heart, Camera,
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
          <span className={s.logoText}>OPORTUNAI</span>
        </Link>
        <div className={s.navLinks}>
          <Link href="/login" className={s.btnGhost}>Iniciar sesión</Link>
          <Link href="/register" className={s.btnFill}>Empezar gratis</Link>
        </div>
      </nav>

      {/* ── HERO CANDIDATO ── */}
      <div className={s.heroOuter}>
        <div className={s.heroFull}>
          <div className={s.heroMain}>

            {/* Izquierda: copy principal */}
            <div className={s.heroLeft}>
              <p className={s.heroTag}>
                <span className={s.heroTagDot} />
                100% Gratis · Desde el celular
              </p>
              <h1 className={s.heroH}>
                Encontrá<br/>
                <span className={s.heroHAccent}>trabajo.</span>
              </h1>
              <p className={s.heroSub}>
                Hacé tu diagnóstico gratuito, grabá tu Video CV y recibí
                oportunidades y recursos adaptados a tu situación.
                Te acompañamos en cada paso.
              </p>
              <div className={s.heroCtas}>
                <Link href="/register" className={s.heroCtaPrimary}>
                  <Video size={16} strokeWidth={2} />
                  Empezar gratis →
                </Link>
                <Link href="/register-empresa" className={s.heroCtaSecondary}>
                  Soy empresa →
                </Link>
              </div>
            </div>

            {/* Derecha: chips de features */}
            <div className={s.heroRight}>
              {[
                {
                  bg: 'rgba(20,199,168,0.20)', color: '#1DD9BA',
                  Icon: Target,
                  t: 'Diagnóstico Korai',
                  d: 'Conocemos tu situación y te acompañamos desde donde estás',
                },
                {
                  bg: 'rgba(255,255,255,0.15)', color: '#fff',
                  Icon: Video,
                  t: 'Video CV en 60 segundos',
                  d: 'Las empresas te ven antes de llamarte. Sin papeles, desde el celular',
                },
                {
                  bg: 'rgba(109,72,240,0.25)', color: '#B99FFF',
                  Icon: GraduationCap,
                  t: 'Capacitaciones gratuitas',
                  d: 'Aprendé lo que necesitás para destacarte en tu rubro',
                },
                {
                  bg: 'rgba(255,255,255,0.10)', color: '#A0C4FF',
                  Icon: Handshake,
                  t: 'Recursos municipales',
                  d: 'Programas de empleo, salud y vivienda de San Isidro',
                },
              ].map(f => (
                <div key={f.t} className={s.heroChip}>
                  <div className={s.heroChipIco} style={{ background: f.bg }}>
                    <f.Icon size={18} strokeWidth={1.75} color={f.color} />
                  </div>
                  <div>
                    <div className={s.heroChipT}>{f.t}</div>
                    <div className={s.heroChipD}>{f.d}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

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
              <img src="/candidato.png" alt="Candidato grabando Video CV" className={s.secPhoto} />
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

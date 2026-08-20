'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Search, Loader2, MapPin, ExternalLink, ArrowRight, X, Sparkles, UserCheck } from 'lucide-react';
import styles from './BuscadorNL.module.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Resultado {
  id: string;
  tipo: 'interna' | 'externa';
  titulo: string;
  empresa_nombre: string;
  logo_url?: string | null;
  ciudad?: string | null;
  area?: string | null;
  modalidad?: string | null;
  descripcion?: string | null;
  url: string;
  fuente: string;
  salario?: string | null;
}

interface BuscarResponse {
  ok: boolean;
  query: string;
  parsed?: { resumen: string };
  total: number;
  internos: number;
  externos: number;
  resultados: Resultado[];
}

// ─── Sugerencias de ejemplo ───────────────────────────────────────────────────

const SUGERENCIAS = [
  'Trabajo de cajero en Buenos Aires',
  'Mozo o camarero con horario part time',
  'Operario en zona norte GBA',
  'Atención al cliente sin experiencia',
  'Repositor en supermercado cerca de San Isidro',
  'Trabajo en McDonald\'s o Starbucks',
  'Limpieza o mantenimiento industrial',
];

// ─── Chips de categoría ───────────────────────────────────────────────────────

const CATEGORIAS = [
  { emoji: '⛽', label: 'Estación de servicio', query: 'Trabajo en estación de servicio o playa de combustible' },
  { emoji: '🍔', label: 'Gastronomía', query: 'Trabajo en gastronomía, cocina o atención en restaurante' },
  { emoji: '🛒', label: 'Supermercado', query: 'Trabajo en supermercado, repositor o cajero' },
  { emoji: '🎧', label: 'Atención al cliente', query: 'Trabajo de atención al cliente o call center' },
  { emoji: '🏗️', label: 'Operario / Industria', query: 'Trabajo de operario o producción industrial' },
  { emoji: '🚚', label: 'Logística', query: 'Trabajo en logística, depósito o reparto' },
  { emoji: '🧹', label: 'Limpieza', query: 'Trabajo de limpieza o maestranza' },
  { emoji: '🏪', label: 'Comercio / Ventas', query: 'Trabajo de vendedor o en local comercial' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  variant?: 'home' | 'dashboard';
  className?: string;
}

export default function BuscadorNL({ variant = 'home', className = '' }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [resumen, setResumen] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sugerenciaIdx, setSugerenciaIdx] = useState(0);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [activeCategoria, setActiveCategoria] = useState<string | null>(null);
  // Gate de registro para ofertas externas
  const [gateOferta, setGateOferta] = useState<{ titulo: string; empresa: string; url: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Rotar sugerencias en placeholder
  useEffect(() => {
    const t = setInterval(() => {
      setSugerenciaIdx((i) => (i + 1) % SUGERENCIAS.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  async function handleSearch(e?: FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setShowSugerencias(false);
    try {
      const res = await fetch('/api/buscar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: 20 }),
      });
      const data: BuscarResponse = await res.json();
      if (!data.ok) throw new Error('Error en la búsqueda');
      setResultados(data.resultados);
      setResumen(data.parsed?.resumen || query);
      setTotal(data.total);
      // Scroll a resultados
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setError('No pudimos completar la búsqueda. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function handleSugerencia(sug: string) {
    setQuery(sug);
    setShowSugerencias(false);
    inputRef.current?.focus();
  }

  async function handleCategoria(cat: typeof CATEGORIAS[0]) {
    setActiveCategoria(cat.label);
    setQuery(cat.query);
    setShowSugerencias(false);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/buscar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: cat.query, limit: 20 }),
      });
      const data: BuscarResponse = await res.json();
      if (!data.ok) throw new Error('Error en la búsqueda');
      setResultados(data.resultados);
      setResumen(cat.label);
      setTotal(data.total);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setError('No pudimos completar la búsqueda. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function clearResults() {
    setResultados(null);
    setQuery('');
    setError(null);
    setActiveCategoria(null);
    inputRef.current?.focus();
  }

  /** Avatar con inicial de la empresa cuando no hay logo */
  function CompanyAvatar({ name, fuente }: { name: string; fuente: string }) {
    const fuenteColors: Record<string, string> = {
      computrabajo: '#1d4ed8',
      zonajobs: '#059669',
      bumeran: '#d97706',
      oportunai: '#6d28d9',
      linkedin: '#0a66c2',
      mcdonalds: '#b45309',
      mostaza: '#c2410c',
      starbucks: '#065f46',
      ypf: '#854d0e',
      sanisidro: '#075985',
    };
    const bg = fuenteColors[fuente] ?? (() => {
      const palette = ['#6d28d9','#1d4ed8','#059669','#d97706','#dc2626','#0891b2'];
      let h = 0;
      for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xfffffff;
      return palette[Math.abs(h) % palette.length];
    })();
    const letter = (name || '?')[0].toUpperCase();
    return (
      <div className={styles.cardLogoInitial} style={{ background: bg }}>
        {letter}
      </div>
    );
  }

  const fuente_label: Record<string, string> = {
    oportunai: 'OportunAI',
    computrabajo: 'Computrabajo',
    zonajobs: 'ZonaJobs',
    bumeran: 'Bumeran',
    sanisidro: 'San Isidro',
    mercadolibre: 'Mercado Libre',
    mcdonalds: "McDonald's",
    mostaza: 'Mostaza',
    starbucks: 'Starbucks',
    ypf: 'YPF',
  };

  const isHome = variant === 'home';

  return (
    <div className={`${styles.wrap} ${isHome ? styles.wrapHome : styles.wrapDash} ${className}`}>
      {/* ── Header ─────────────────────────────────────────────── */}
      {isHome && (
        <div className={styles.header}>
          <span className={styles.badge}>
            <Sparkles size={13} /> Buscador inteligente
          </span>
          <h2 className={styles.heading}>
            Encontrá tu próximo trabajo
            <br />
            <span className={styles.headingAccent}>como si le hablaras a alguien</span>
          </h2>
          <p className={styles.sub}>
            Elegí una categoría o escribí lo que buscás con tus palabras. Nuestro buscador entiende y filtra por vos.
          </p>

          {/* Chips de categoría */}
          <div className={styles.categorias}>
            {CATEGORIAS.map((cat) => (
              <button
                key={cat.label}
                type="button"
                className={`${styles.catChip} ${activeCategoria === cat.label ? styles.catChipActive : ''}`}
                onClick={() => handleCategoria(cat)}
                disabled={loading}
              >
                <span className={styles.catEmoji}>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Search box ─────────────────────────────────────────── */}
      <form className={styles.form} onSubmit={handleSearch}>
        <div className={styles.inputWrap}>
          <Search className={styles.searchIco} size={20} />
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSugerencias(e.target.value.length === 0);
            }}
            onFocus={() => !query && setShowSugerencias(true)}
            onBlur={() => setTimeout(() => setShowSugerencias(false), 200)}
            placeholder={SUGERENCIAS[sugerenciaIdx]}
            autoComplete="off"
            disabled={loading}
          />
          {query && !loading && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => { setQuery(''); setShowSugerencias(false); }}
              aria-label="Limpiar"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className={styles.searchBtn}
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <Loader2 size={20} className={styles.spin} />
          ) : (
            <>
              <span>Buscar</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Sugerencias dropdown */}
        {showSugerencias && (
          <ul className={styles.sugList}>
            <li className={styles.sugHeader}>Ejemplos de búsqueda</li>
            {SUGERENCIAS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className={styles.sugItem}
                  onMouseDown={() => handleSugerencia(s)}
                >
                  <Search size={13} className={styles.sugIco} />
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className={styles.errorBox}>
          {error}
        </div>
      )}

      {/* ── Resultados ────────────────────────────────────────── */}
      {resultados !== null && (
        <div ref={resultsRef} className={styles.results}>
          {/* Header de resultados */}
          <div className={styles.resultsHeader}>
            <div className={styles.resultsInfo}>
              <strong>{total}</strong> resultado{total !== 1 ? 's' : ''} para &ldquo;{resumen}&rdquo;
            </div>
            <button className={styles.clearResultsBtn} onClick={clearResults}>
              <X size={14} /> Nueva búsqueda
            </button>
          </div>

          {total === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIco}>🔍</div>
              <p>No encontramos ofertas exactas para esa búsqueda.</p>
              <p className={styles.emptySub}>Probá con otras palabras o creá tu perfil para recibir alertas cuando haya nuevas oportunidades.</p>
              <a href="/register" className={styles.emptyRegisterBtn}>
                <UserCheck size={15} /> Crear mi perfil gratis
              </a>
            </div>
          ) : (
            <>
            <div className={styles.grid}>
              {resultados.map((r) => (
                <div key={r.id} className={styles.card}>
                  {/* Logo / Avatar */}
                  <div className={styles.cardLogo}>
                    {r.logo_url ? (
                      <img src={r.logo_url} alt={r.empresa_nombre} className={styles.cardLogoImg} />
                    ) : (
                      <CompanyAvatar name={r.empresa_nombre} fuente={r.fuente} />
                    )}
                  </div>

                  {/* Info */}
                  <div className={styles.cardInfo}>
                    <div className={styles.cardTop}>
                      <span className={`${styles.cardFuente} ${styles[`fuente_${r.fuente.replace(/[^a-z]/g, '')}`] || ''}`}>
                        {fuente_label[r.fuente] || r.fuente}
                      </span>
                    </div>
                    <h3 className={styles.cardTitle}>{r.titulo}</h3>
                    <p className={styles.cardEmpresa}>{r.empresa_nombre}</p>
                    <div className={styles.cardMeta}>
                      {r.ciudad && (
                        <span className={styles.cardMetaItem}>
                          <MapPin size={12} /> {r.ciudad}
                        </span>
                      )}
                      {r.modalidad && (
                        <span className={styles.cardMetaItem}>
                          {r.modalidad}
                        </span>
                      )}
                      {r.salario && (
                        <span className={styles.cardMetaItem}>
                          💰 {r.salario}
                        </span>
                      )}
                    </div>
                    {r.descripcion && (
                      <p className={styles.cardDesc}>{r.descripcion}</p>
                    )}
                  </div>

                  {/* CTA — distinto para interna vs externa */}
                  {r.tipo === 'interna' ? (
                    <a href={r.url} className={styles.cardBtnPrimary}>
                      Postularme <ArrowRight size={14} />
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={styles.cardBtnSecondary}
                      onClick={() => setGateOferta({ titulo: r.titulo, empresa: r.empresa_nombre, url: r.url })}
                    >
                      Ver oferta <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* CTA crear perfil al pie de resultados */}
            {isHome && (
              <div className={styles.resultsRegisterCta}>
                <div className={styles.resultsRegisterCtaText}>
                  <UserCheck size={18} className={styles.resultsRegisterCtaIcon} />
                  <div>
                    <strong>¿Querés que te avisen cuando haya más?</strong>
                    <p>Creá tu perfil gratis y recibí oportunidades personalizadas.</p>
                  </div>
                </div>
                <a href="/register" className={styles.resultsRegisterCtaBtn}>
                  Crear mi perfil <ArrowRight size={14} />
                </a>
              </div>
            )}
            </>
          )}
        </div>
      )}
      {/* ── Gate de registro para ofertas externas ──── */}
      {gateOferta && (
        <div className={styles.gateOverlay} onClick={() => setGateOferta(null)}>
          <div className={styles.gateModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.gateClose} onClick={() => setGateOferta(null)} aria-label="Cerrar">
              <X size={18} />
            </button>
            <div className={styles.gateBadge}>✨ Gratis</div>
            <h3 className={styles.gateTitle}>Accedé a esta oferta y a cientos más</h3>
            <p className={styles.gateSub}>
              <strong>{gateOferta.titulo}</strong> · {gateOferta.empresa}
            </p>
            <p className={styles.gateDesc}>
              Creá tu perfil gratuito en OportunAI, aplicá con tu video CV y recibí notificaciones de nuevas oportunidades.
            </p>
            <a
              href={`/register`}
              className={styles.gateBtnPrimary}
            >
              Crear mi cuenta gratis <ArrowRight size={15} />
            </a>
            <a
              href="/login"
              className={styles.gateBtnSecondary}
            >
              Ya tengo cuenta → Ingresar
            </a>
            <button
              type="button"
              className={styles.gateSkip}
              onClick={() => { window.open(gateOferta.url, '_blank', 'noopener'); setGateOferta(null); }}
            >
              Ver oferta sin registrarme ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

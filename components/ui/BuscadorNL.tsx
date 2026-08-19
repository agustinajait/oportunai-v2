'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Search, Loader2, MapPin, Building2, ExternalLink, ArrowRight, X, Sparkles } from 'lucide-react';
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

  function clearResults() {
    setResultados(null);
    setQuery('');
    setError(null);
    inputRef.current?.focus();
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
            Encontrá tu próximo trabajo<br />
            <span className={styles.headingAccent}>como si le hablaras a alguien</span>
          </h2>
          <p className={styles.sub}>
            Escribí lo que buscás con tus palabras. Nuestro buscador entiende y filtra por vos.
          </p>
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
              <p>No encontramos ofertas para esa búsqueda.</p>
              <p className={styles.emptySub}>Probá con otras palabras o revisá las ofertas disponibles abajo.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {resultados.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target={r.tipo === 'externa' ? '_blank' : '_self'}
                  rel={r.tipo === 'externa' ? 'noopener noreferrer' : undefined}
                  className={styles.card}
                >
                  {/* Logo / Avatar */}
                  <div className={styles.cardLogo}>
                    {r.logo_url ? (
                      <img src={r.logo_url} alt={r.empresa_nombre} className={styles.cardLogoImg} />
                    ) : (
                      <div className={styles.cardLogoFallback}>
                        <Building2 size={20} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className={styles.cardInfo}>
                    <div className={styles.cardTop}>
                      <span className={`${styles.cardFuente} ${styles[`fuente_${r.fuente.replace(/[^a-z]/g, '')}`] || ''}`}>
                        {fuente_label[r.fuente] || r.fuente}
                      </span>
                      {r.tipo === 'externa' && <ExternalLink size={12} className={styles.extIco} />}
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

                  <ArrowRight size={16} className={styles.cardArrow} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

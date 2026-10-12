'use client';

import { useEffect, useState } from 'react';
import {
  Users, Activity, MessageCircle, AlertTriangle, TrendingUp,
  BarChart2, Download, X, Phone, ExternalLink, ChevronRight,
  MapPin, Quote, RefreshCw, Check, Loader2,
} from 'lucide-react';

const DIMS_META: Record<string, { label: string; icon: string }> = {
  empleo:    { label: 'Empleo',    icon: '💼' },
  educacion: { label: 'Educación', icon: '📚' },
  ingresos:  { label: 'Ingresos',  icon: '💰' },
  salud:     { label: 'Salud',     icon: '❤️' },
  vivienda:  { label: 'Vivienda',  icon: '🏠' },
  red:       { label: 'Red',       icon: '🤝' },
};

type Color = 'verde' | 'amarillo' | 'rojo';

interface DimStat {
  dim: string; rojo: number; amarillo: number; verde: number;
  total: number; pct_rojo: number; pct_amarillo: number; pct_verde: number;
}

interface CursoStat {
  slug: string; titulo: string; icono: string | null; categoria: string;
  total: number; puntaje_promedio: number | null;
}

interface GobData {
  kpis: {
    total_usuarios: number; con_diagnostico: number; whatsapp_activo: number;
    pct_diagnostico: number; pct_wa: number; registrados_30d: number;
    con_video_cv: number; con_capacitacion: number; con_modulo: number; con_postulacion: number;
  };
  estadoGeneral: {
    critico: number; alerta: number; estable: number;
    pct_critico: number; pct_alerta: number; pct_estable: number;
  };
  porDimension: Record<string, { verde: number; amarillo: number; rojo: number; sin_dato: number }>;
  rankingCriticidad: DimStat[];
  estadisticasSociales: {
    situacion_laboral: Record<string, number>;
    ingreso_hogar:     Record<string, number>;
    tipo_vivienda:     Record<string, number>;
  };
  perfilFormativo: {
    nivelesEstudios: Record<string, number>;
    topHabilidades:  { nombre: string; total: number }[];
    topRubros:       { rubro: string; total: number }[];
    topIdiomas:      { idioma: string; total: number }[];
    experienciaPromedio: number;
    conCvCargado: number;
  };
  alfabetizacionDigital: {
    porNivel: Record<string, number>;
    scorePromedio: number | null;
    conDato: number;
  };
  actividadPlataforma: {
    conVideoCV: number; sinVideoCV: number;
    conCapacitacion: number; sinCapacitacion: number;
    conTaller: number; conModulo: number; conPostulacion: number; conReferencia: number;
    totalCapacitaciones: number; totalPostulaciones: number; totalModulos: number;
  };
  detallePorDimension: Record<string, {
    verde: number; amarillo: number; rojo: number; sin_dato: number; total: number;
    pct_verde: number; pct_amarillo: number; pct_rojo: number;
    barriosRojo: { barrio: string; rojo: number; amarillo: number; verde: number; total: number }[];
    situacionEnRojo: { sit: string; n: number }[];
  }>;
  porBarrio: { barrio: string; total: number; rojo: number; amarillo: number; pct_rojo: number; topRubros?: string[] }[];
  voces: { barrio: string; texto: string; fecha: string }[];
  capacitacionesData: {
    totalAprobadas: number; enCurso: number; totalCursos: number;
    topCursos: CursoStat[];
    topCompetencias: { nombre: string; total: number }[];
  };
}

interface Candidato {
  id: string; nombre_completo: string; email: string;
  telefono: string; slug: string; whatsapp_activo: boolean;
  created_at: string; semaforo: Record<string, string>;
}

/* ── Tile KPI ──────────────────────────────────────────── */
function StatTile({ label, value, sub, icon: Icon, color = 'brand' }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: 'brand' | 'emerald' | 'amber' | 'red';
}) {
  const bgStyle = {
    brand:   { background: 'rgba(45,212,191,0.15)' },
    emerald: { background: 'rgba(52,211,153,0.15)' },
    amber:   { background: 'rgba(251,191,36,0.15)' },
    red:     { background: 'rgba(248,113,113,0.15)' },
  }[color];
  const ic = { brand: 'text-brand-600', emerald: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600' }[color];
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={bgStyle}>
          <Icon size={18} className={ic} />
        </div>
        <p className="text-xs font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>}
    </div>
  );
}

/* ── Barra apilada clickeable ──────────────────────────── */
function StackedBar({ dim, data, onDrillDown }: {
  dim: string; data: DimStat;
  onDrillDown: (dim: string, color: Color) => void;
}) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const meta = DIMS_META[dim];
  if (!meta || data.total === 0) return null;

  const pVerde    = (data.verde    / data.total) * 100;
  const pAmarillo = (data.amarillo / data.total) * 100;
  const pRojo     = (data.rojo     / data.total) * 100;

  return (
    <div className="group">
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-base w-6 text-center flex-shrink-0">{meta.icon}</span>
        <span className="text-sm font-medium w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.8)' }}>{meta.label}</span>
        <div className="flex-1 relative">
          <div className="h-7 rounded-lg overflow-hidden flex cursor-pointer" onMouseLeave={() => setTooltip(null)}>
            {pVerde > 0 && (
              <div
                className="h-full bg-emerald-500 hover:brightness-110 transition-all"
                style={{ width: `${pVerde}%`, borderRight: pAmarillo > 0 || pRojo > 0 ? '2px solid rgba(0,0,0,0.3)' : undefined }}
                onMouseEnter={() => setTooltip(`✅ Bien: ${data.verde} personas (${data.pct_verde}%)`)}
                onClick={() => onDrillDown(dim, 'verde')}
              />
            )}
            {pAmarillo > 0 && (
              <div
                className="h-full bg-amber-400 hover:brightness-110 transition-all"
                style={{ width: `${pAmarillo}%`, borderRight: pRojo > 0 ? '2px solid rgba(0,0,0,0.3)' : undefined }}
                onMouseEnter={() => setTooltip(`⚠️ Atención: ${data.amarillo} personas (${data.pct_amarillo}%)`)}
                onClick={() => onDrillDown(dim, 'amarillo')}
              />
            )}
            {pRojo > 0 && (
              <div
                className="h-full bg-red-500 hover:brightness-110 transition-all"
                style={{ width: `${pRojo}%` }}
                onMouseEnter={() => setTooltip(`🔴 Prioritario: ${data.rojo} personas (${data.pct_rojo}%)`)}
                onClick={() => onDrillDown(dim, 'rojo')}
              />
            )}
          </div>
          {tooltip && (
            <div className="absolute left-0 -top-8 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10 pointer-events-none shadow-lg" style={{ background: 'rgba(0,0,0,0.85)' }}>
              {tooltip}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs w-28 justify-end" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {data.rojo > 0 && <span className="text-red-400 font-semibold">{data.pct_rojo}% crit.</span>}
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>|</span>
          <span>{data.total} diag.</span>
        </div>
      </div>
    </div>
  );
}

/* ── Fila de stat social ───────────────────────────────── */
function SocialStatRow({ label, value, total, color }: {
  label: string; value: number; total: number; color: 'emerald' | 'amber' | 'red' | 'gray';
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const barColor = {
    emerald: 'bg-emerald-500',
    amber:   'bg-amber-400',
    red:     'bg-red-500',
    gray:    'bg-gray-300',
  }[color];
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
        <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{pct}% <span className="font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>({value})</span></span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Panel drill-down ──────────────────────────────────── */
const COLOR_LABEL: Record<Color, string> = {
  verde: '✅ Bien', amarillo: '⚠️ Atención', rojo: '🔴 Prioritario',
};
const COLOR_BG: Record<Color, React.CSSProperties> = {
  verde:    { background: 'rgba(52,211,153,0.12)',  borderBottom: '1px solid rgba(52,211,153,0.25)' },
  amarillo: { background: 'rgba(251,191,36,0.12)',  borderBottom: '1px solid rgba(251,191,36,0.25)' },
  rojo:     { background: 'rgba(248,113,113,0.12)', borderBottom: '1px solid rgba(248,113,113,0.25)' },
};
const DIMS_ALL = ['empleo', 'educacion', 'ingresos', 'salud', 'vivienda', 'red'] as const;

function DrillDownPanel({ dim, color, onClose }: { dim: string; color: Color; onClose: () => void }) {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const meta = DIMS_META[dim];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/gobierno/candidatos?dim=${dim}&color=${color}`)
      .then(r => r.json())
      .then(d => setCandidatos(d.candidatos ?? []))
      .finally(() => setLoading(false));
  }, [dim, color]);

  const colorDot = (c: string) =>
    c === 'verde' ? 'bg-emerald-500' : c === 'amarillo' ? 'bg-amber-400' : c === 'rojo' ? 'bg-red-500' : 'bg-ink-200';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:p-6">
      <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" style={{ background: 'rgba(20,20,30,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={COLOR_BG[color]}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta?.icon}</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{meta?.label} — {COLOR_LABEL[color]}</p>
              {!loading && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{candidatos.length} persona{candidatos.length !== 1 ? 's' : ''}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <div className="w-5 h-5 rounded-full border-2 border-brand-400 border-t-transparent animate-spin mr-2" />
              Cargando...
            </div>
          ) : candidatos.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <Users size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin candidatos en esta categoría</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.08]">
              {candidatos.map(c => (
                <div key={c.id} className="px-5 py-3.5 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{c.nombre_completo}</p>
                        {c.whatsapp_activo && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399' }}>💬 WA</span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.email}</p>
                      {c.telefono && (
                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <Phone size={10} /> {c.telefono}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {DIMS_ALL.map(d => (
                        <div
                          key={d}
                          className={`w-2 h-2 rounded-full ${colorDot(c.semaforo?.[d])}`}
                          title={`${DIMS_META[d]?.label}: ${c.semaforo?.[d] ?? '—'}`}
                        />
                      ))}
                      <a
                        href={`${appUrl}/u/${c.slug}/cv`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 hover:text-brand-400 transition-colors"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                        title="Ver perfil"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Hacé clic en una barra para filtrar otra dimensión</p>
          <a href="/api/admin/gobierno/export" download className="text-xs flex items-center gap-1 text-brand-400 hover:underline">
            <Download size={12} /> Exportar todo
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────── */
const SIT_LABORAL_LABEL: Record<string, string> = {
  con_trabajo:  'Con trabajo',
  buscando:     'Buscando trabajo',
  sin_trabajo:  'Sin trabajo',
};
const SIT_LABORAL_COLOR: Record<string, 'emerald' | 'amber' | 'red'> = {
  con_trabajo: 'emerald', buscando: 'amber', sin_trabajo: 'red',
};

const INGRESO_LABEL: Record<string, string> = {
  '<700k':           '< $700K',
  '700k-1.3m':       '$700K – $1.3M',
  '1.3m-2m':         '$1.3M – $2M',
  '>2m':             '> $2M',
  'prefiere_no_decir': 'Prefiere no decir',
};
const INGRESO_COLOR: Record<string, 'red' | 'amber' | 'emerald' | 'gray'> = {
  '<700k': 'red', '700k-1.3m': 'amber', '1.3m-2m': 'emerald', '>2m': 'emerald', 'prefiere_no_decir': 'gray',
};

const VIVIENDA_LABEL: Record<string, string> = {
  propia:     'Propia',
  alquilada:  'Alquilada',
  prestada:   'Prestada',
  inestable:  'Inestable / Sin vivienda',
};
const VIVIENDA_COLOR: Record<string, 'emerald' | 'amber' | 'red' | 'gray'> = {
  propia: 'emerald', alquilada: 'amber', prestada: 'gray', inestable: 'red',
};

/* ── Panel carga manual de semáforo ────────────────────── */
const DIMS_LIST = ['empleo', 'educacion', 'ingresos', 'salud', 'vivienda', 'red'] as const;
const COLORES_OPT = [
  { value: '', label: '—' },
  { value: 'verde', label: '✅ Verde' },
  { value: 'amarillo', label: '⚠️ Amarillo' },
  { value: 'rojo', label: '🔴 Rojo' },
];

function SyncManualPanel({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [dims, setDims] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [userCheck, setUserCheck] = useState<{ nombre_completo: string; role: string } | null | 'loading' | 'not_found'>(null);

  const checkEmail = async (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || !trimmed.includes('@')) { setUserCheck(null); return; }
    setUserCheck('loading');
    try {
      const r = await fetch(`/api/admin/gobierno/debug-user?email=${encodeURIComponent(trimmed)}`);
      const d = await r.json();
      if (d.error) setUserCheck('not_found');
      else setUserCheck({ nombre_completo: d.nombre_completo, role: d.role });
    } catch { setUserCheck('not_found'); }
  };

  const handleSync = async () => {
    if (!email.trim()) return;
    const semaforo: Record<string, string> = {};
    for (const d of DIMS_LIST) { if (dims[d]) semaforo[d] = dims[d]; }
    if (Object.keys(semaforo).length === 0) {
      setMsg({ ok: false, text: 'Completá al menos una dimensión' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/gobierno/sync-korai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), semaforo }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg({ ok: true, text: `✓ ${data.usuario} sincronizado correctamente` });
        setEmail(''); setDims({}); setUserCheck(null);
        setTimeout(() => { onSuccess(); setMsg(null); }, 1500);
      } else {
        setMsg({ ok: false, text: data.error ?? 'Error' });
      }
    } finally {
      setSaving(false);
    }
  };

  const isAdminAccount = userCheck && typeof userCheck === 'object' && userCheck.role !== 'user';
  const isValidCandidate = userCheck && typeof userCheck === 'object' && userCheck.role === 'user';

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 text-xs hover:text-brand-400 px-3 py-1.5 rounded-lg transition-colors"
      style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
    >
      <RefreshCw size={12} /> Cargar diagnóstico manual
    </button>
  );

  return (
    <div className="card p-5" style={{ border: '1px solid rgba(45,212,191,0.25)', background: 'rgba(45,212,191,0.05)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Cargar diagnóstico Korai manualmente</h3>
        <button onClick={() => { setOpen(false); setMsg(null); setUserCheck(null); }} className="hover:opacity-70 transition-opacity" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <X size={16} />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="label">Email del candidato</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setUserCheck(null); }}
            onBlur={e => checkEmail(e.target.value)}
            placeholder="candidato@email.com"
            className="input-field text-sm"
          />
          {/* Feedback del check de usuario */}
          {userCheck === 'loading' && (
            <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}><Loader2 size={10} className="animate-spin" /> Buscando usuario…</p>
          )}
          {userCheck === 'not_found' && (
            <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>❌ No se encontró ningún usuario con ese email</p>
          )}
          {isAdminAccount && (
            <div className="mt-1.5 px-3 py-2 rounded-lg" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <p className="text-xs font-medium" style={{ color: '#fbbf24' }}>⚠️ Esta cuenta es <strong>{(userCheck as {role:string}).role}</strong>, no un candidato</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(251,191,36,0.8)' }}>El dashboard de gobierno solo muestra usuarios con rol <strong>user</strong>. Usá el email de un candidato real.</p>
            </div>
          )}
          {isValidCandidate && (
            <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#34d399' }}>
              <Check size={10} /> <strong>{(userCheck as {nombre_completo:string}).nombre_completo}</strong> — candidato válido
            </p>
          )}
        </div>
        <div>
          <label className="label">Semáforo por dimensión</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DIMS_LIST.map(d => (
              <div key={d} className="flex items-center gap-2">
                <span className="text-xs w-16 capitalize" style={{ color: 'rgba(255,255,255,0.6)' }}>{d}</span>
                <select
                  value={dims[d] ?? ''}
                  onChange={e => setDims(p => ({ ...p, [d]: e.target.value }))}
                  className="flex-1 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                >
                  {COLORES_OPT.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        {msg && (
          <p
            className="text-xs px-3 py-2 rounded-lg"
            style={msg.ok
              ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' }
              : { background: 'rgba(248,113,113,0.15)', color: '#f87171' }}
          >
            {msg.text}
          </p>
        )}
        <button
          onClick={handleSync}
          disabled={saving || !email.trim()}
          className="btn-primary py-2 px-4 text-sm w-full justify-center"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Guardar diagnóstico
        </button>
      </div>
    </div>
  );
}

/* ── Mini barra horizontal ─────────────────────────────── */
function MiniBar({ value, total, color = 'brand' }: { value: number; total: number; color?: string }) {
  const w = total > 0 ? Math.round((value / total) * 100) : 0;
  const bg = color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-400' : color === 'emerald' ? 'bg-emerald-500' : 'bg-brand-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className={`h-full ${bg} rounded-full`} style={{ width: `${w}%` }} />
      </div>
      <span className="text-[11px] w-8 text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>{w}%</span>
    </div>
  );
}

/* ── Componente principal ──────────────────────────────── */
export default function GobiernoClient() {
  const [data, setData] = useState<GobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [drillDown, setDrillDown] = useState<{ dim: string; color: Color } | null>(null);

  const cargarDatos = () => {
    setLoading(true);
    fetch('/api/admin/gobierno')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarDatos(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <div className="w-6 h-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin mr-2" />
        Cargando datos...
      </div>
    );
  }

  if (!data) return <p className="text-red-600 p-8">Error al cargar datos</p>;

  const {
    kpis, estadoGeneral, rankingCriticidad, estadisticasSociales,
    detallePorDimension,
    perfilFormativo, alfabetizacionDigital, actividadPlataforma,
    porBarrio, voces, capacitacionesData,
  } = data;
  const totalConDiag = kpis.con_diagnostico;
  const areasCriticas = rankingCriticidad.filter(d => d.pct_rojo >= 20);

  // Detectar si hay datos sociodemográficos
  const haySocial = Object.keys(estadisticasSociales.situacion_laboral).length > 0
    || Object.keys(estadisticasSociales.ingreso_hogar).length > 0
    || Object.keys(estadisticasSociales.tipo_vivienda).length > 0;

  const totalSL  = Object.values(estadisticasSociales.situacion_laboral).reduce((a, b) => a + b, 0);
  const totalIH  = Object.values(estadisticasSociales.ingreso_hogar).reduce((a, b) => a + b, 0);
  const totalTV  = Object.values(estadisticasSociales.tipo_vivienda).reduce((a, b) => a + b, 0);

  const hayFormativo   = perfilFormativo && (perfilFormativo.topRubros.length > 0 || perfilFormativo.topHabilidades.length > 0);
  const hayActividad   = actividadPlataforma && kpis.total_usuarios > 0;

  return (
    <>
      {drillDown && (
        <DrillDownPanel
          dim={drillDown.dim}
          color={drillDown.color}
          onClose={() => setDrillDown(null)}
        />
      )}

      <div className="space-y-8 animate-fade-in">

        {/* ── KPIs ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <Activity size={14} /> Resumen general
            </h2>
            <div className="flex items-center gap-2">
              <SyncManualPanel onSuccess={cargarDatos} />
              <a
                href="/api/admin/gobierno/export"
                download
                className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid rgba(45,212,191,0.25)', background: 'rgba(45,212,191,0.08)' }}
              >
                <Download size={13} /> Exportar CSV
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Candidatos registrados" value={kpis.total_usuarios}
              sub={`+${kpis.registrados_30d} últimos 30 días`} icon={Users} />
            <StatTile label="Con diagnóstico Korai" value={totalConDiag}
              sub={`${kpis.pct_diagnostico}% del total`} icon={BarChart2} color="brand" />
            <StatTile label="Con Video CV" value={kpis.con_video_cv}
              sub={`${kpis.total_usuarios > 0 ? Math.round(kpis.con_video_cv/kpis.total_usuarios*100) : 0}% del total`}
              icon={Activity} color="emerald" />
            <StatTile label="Con acompañamiento WA" value={kpis.whatsapp_activo}
              sub={`${kpis.pct_wa}% activaron WhatsApp`} icon={MessageCircle} color="amber" />
          </div>
        </div>

        {/* ── Estado general del territorio ──────────────── */}
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Estado general del territorio
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {totalConDiag > 0
                  ? `Basado en ${totalConDiag} diagnósticos${porBarrio.length > 0 ? ` — ${porBarrio.length} barrios` : ''}`
                  : 'Esperando diagnósticos Korai de candidatos'}
              </p>
            </div>
            {totalConDiag > 0 && (
              <div className="flex items-center gap-4 text-sm flex-shrink-0">
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-red-500">{estadoGeneral.pct_critico}%</p>
                  <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wide">Crítico</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-amber-500">{estadoGeneral.pct_alerta}%</p>
                  <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">Alerta</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-emerald-500">{estadoGeneral.pct_estable}%</p>
                  <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">Estable</p>
                </div>
              </div>
            )}
          </div>
          <div className="h-6 rounded-xl overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.07)' }}>
            {totalConDiag === 0 ? (
              <div className="h-full w-full animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }} />
            ) : (
              <>
                {estadoGeneral.pct_estable > 0 && <div className="h-full bg-emerald-500" style={{ width: `${estadoGeneral.pct_estable}%` }} />}
                {estadoGeneral.pct_alerta > 0  && <div className="h-full bg-amber-400"  style={{ width: `${estadoGeneral.pct_alerta}%` }} />}
                {estadoGeneral.pct_critico > 0 && <div className="h-full bg-red-500"    style={{ width: `${estadoGeneral.pct_critico}%` }} />}
              </>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Estable: {estadoGeneral.estable}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Alerta: {estadoGeneral.alerta}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Crítico: {estadoGeneral.critico}</span>
          </div>
        </div>

        {/* ── Semáforo por dimensión ──────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
                🚦 Diagnóstico por dimensión
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {totalConDiag > 0 ? 'Hacé clic en una barra para ver los candidatos' : 'Se completará con los diagnósticos Korai'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Bien</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Atención</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Prioritario</span>
            </div>
          </div>
          {totalConDiag === 0 ? (
            <div className="space-y-3">
              {Object.entries(DIMS_META).map(([dim, meta]) => (
                <div key={dim} className="flex items-center gap-3">
                  <span className="text-sm w-5">{meta.icon}</span>
                  <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>{meta.label}</span>
                  <div className="flex-1 h-5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <span className="text-xs w-8 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {rankingCriticidad.map(d => (
                <StackedBar key={d.dim} dim={d.dim} data={d} onDrillDown={(dim, color) => setDrillDown({ dim, color })} />
              ))}
            </div>
          )}
          <p className="text-[10px] mt-4 text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Ordenado por % de situación prioritaria</p>
        </div>

        {/* ── Detalle por dimensión (réplica panel Korai) ─── */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            🚦 Detalle por dimensión
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(DIMS_META).map(([dim, meta]) => {
              const d = detallePorDimension?.[dim];
              const total = d?.total ?? 0;
              return (
                <div key={dim} className="card p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meta.icon}</span>
                      <h3 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{meta.label}</h3>
                    </div>
                    {total > 0 && (
                      <button
                        onClick={() => setDrillDown({ dim, color: 'rojo' })}
                        className="text-[10px] text-brand-400 hover:text-brand-300 hover:underline"
                      >
                        Ver candidatos →
                      </button>
                    )}
                  </div>

                  {total === 0 ? (
                    /* Estado vacío */
                    <div className="space-y-2">
                      {['Bien', 'Mejorable', 'Prioritario'].map(l => (
                        <div key={l} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{l}</span>
                          <div className="flex-1 h-2 rounded-full ml-auto" style={{ background: 'rgba(255,255,255,0.07)' }} />
                          <span className="text-xs w-6 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Números grandes */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center rounded-xl py-2.5 cursor-pointer transition-colors hover:brightness-110" style={{ background: 'rgba(52,211,153,0.15)' }} onClick={() => setDrillDown({ dim, color: 'verde' })}>
                          <p className="text-xl font-extrabold" style={{ color: '#34d399' }}>{d!.verde}</p>
                          <p className="text-[10px] font-semibold uppercase" style={{ color: '#34d399' }}>Bien</p>
                          <p className="text-[10px]" style={{ color: 'rgba(52,211,153,0.7)' }}>{d!.pct_verde}%</p>
                        </div>
                        <div className="text-center rounded-xl py-2.5 cursor-pointer transition-colors hover:brightness-110" style={{ background: 'rgba(251,191,36,0.15)' }} onClick={() => setDrillDown({ dim, color: 'amarillo' })}>
                          <p className="text-xl font-extrabold" style={{ color: '#fbbf24' }}>{d!.amarillo}</p>
                          <p className="text-[10px] font-semibold uppercase" style={{ color: '#fbbf24' }}>Atención</p>
                          <p className="text-[10px]" style={{ color: 'rgba(251,191,36,0.7)' }}>{d!.pct_amarillo}%</p>
                        </div>
                        <div className="text-center rounded-xl py-2.5 cursor-pointer transition-colors hover:brightness-110" style={{ background: 'rgba(248,113,113,0.15)' }} onClick={() => setDrillDown({ dim, color: 'rojo' })}>
                          <p className="text-xl font-extrabold" style={{ color: '#f87171' }}>{d!.rojo}</p>
                          <p className="text-[10px] font-semibold uppercase" style={{ color: '#f87171' }}>Prioritario</p>
                          <p className="text-[10px]" style={{ color: 'rgba(248,113,113,0.7)' }}>{d!.pct_rojo}%</p>
                        </div>
                      </div>

                      {/* Barra apilada */}
                      <div className="h-2.5 rounded-full overflow-hidden flex mb-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        {d!.pct_verde > 0 && <div className="h-full bg-emerald-500" style={{ width: `${d!.pct_verde}%` }} />}
                        {d!.pct_amarillo > 0 && <div className="h-full bg-amber-400" style={{ width: `${d!.pct_amarillo}%` }} />}
                        {d!.pct_rojo > 0 && <div className="h-full bg-red-500" style={{ width: `${d!.pct_rojo}%` }} />}
                      </div>

                      {/* Sin dato */}
                      {d!.sin_dato > 0 && (
                        <p className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{d!.sin_dato} sin diagnóstico en esta dimensión</p>
                      )}

                      {/* Top barrios con rojo */}
                      {d!.barriosRojo.length > 0 && (
                        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Barrios prioritarios</p>
                          {d!.barriosRojo.slice(0, 3).map(b => (
                            <div key={b.barrio} className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] truncate flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{b.barrio}</span>
                              <span className="text-[10px] font-semibold text-red-400">{b.rojo} 🔴</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Situación laboral en rojo */}
                      {d!.situacionEnRojo.length > 0 && (
                        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Sit. laboral (críticos)</p>
                          {d!.situacionEnRojo.map(s => (
                            <div key={s.sit} className="flex items-center justify-between mb-1">
                              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{SIT_LABORAL_LABEL[s.sit] ?? s.sit}</span>
                              <span className="text-[10px] font-semibold text-red-400">{s.n}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Barreras prioritarias ───────────────────────── */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <AlertTriangle size={14} className="text-red-400" /> Barreras prioritarias
          </h2>
          {areasCriticas.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(DIMS_META).slice(0, 3).map(([dim, meta]) => (
                <div key={dim} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg opacity-40">{meta.icon}</span>
                    <span className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{meta.label}</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.07)' }}>—%</span>
                  </div>
                  <div className="h-3 rounded-full w-3/4" style={{ background: 'rgba(255,255,255,0.07)' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {areasCriticas.map(d => {
                const meta = DIMS_META[d.dim];
                return (
                  <button key={d.dim} onClick={() => setDrillDown({ dim: d.dim, color: 'rojo' })}
                    className="rounded-xl p-4 text-left transition-colors group hover:brightness-110"
                    style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{meta.label}</span>
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: '#f87171', background: 'rgba(248,113,113,0.2)' }}>{d.pct_rojo}%</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      <span className="font-semibold" style={{ color: '#f87171' }}>{d.rojo} personas</span> en situación crítica
                      {d.amarillo > 0 && <> · {d.amarillo} en atención</>}
                    </p>
                    <p className="text-[10px] mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#f87171' }}>
                      Ver candidatos <ChevronRight size={10} />
                    </p>
                  </button>
                );
              })}
            </div>
          )}
          {areasCriticas.length === 0 && (
            <p className="text-xs mt-3 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {totalConDiag > 0 ? '✅ Sin dimensiones críticas por ahora' : 'Aparecerán las áreas que requieren atención urgente'}
            </p>
          )}
        </div>

        {/* ── Actividad en plataforma ────────────────────── */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <TrendingUp size={14} className="text-brand-400" /> Actividad en plataforma
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(45,212,191,0.15)' }}>
              <p className="text-2xl font-extrabold" style={{ color: '#2dd4bf' }}>{actividadPlataforma?.conVideoCV ?? 0}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(45,212,191,0.8)' }}>Con Video CV</p>
              <MiniBar value={actividadPlataforma?.conVideoCV ?? 0} total={kpis.total_usuarios} />
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(52,211,153,0.15)' }}>
              <p className="text-2xl font-extrabold" style={{ color: '#34d399' }}>{actividadPlataforma?.conCapacitacion ?? 0}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(52,211,153,0.8)' }}>Con capacitación</p>
              <MiniBar value={actividadPlataforma?.conCapacitacion ?? 0} total={kpis.total_usuarios} color="emerald" />
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
              <p className="text-2xl font-extrabold" style={{ color: '#fbbf24' }}>{actividadPlataforma?.conModulo ?? 0}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(251,191,36,0.8)' }}>En módulos</p>
              <MiniBar value={actividadPlataforma?.conModulo ?? 0} total={kpis.total_usuarios} color="amber" />
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(167,139,250,0.15)' }}>
              <p className="text-2xl font-extrabold" style={{ color: '#a78bfa' }}>{actividadPlataforma?.conPostulacion ?? 0}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(167,139,250,0.8)' }}>Con postulaciones</p>
              <MiniBar value={actividadPlataforma?.conPostulacion ?? 0} total={kpis.total_usuarios} color="brand" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{actividadPlataforma?.totalCapacitaciones ?? 0}</span> capacitaciones completadas en total
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{actividadPlataforma?.totalPostulaciones ?? 0}</span> postulaciones enviadas en total
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{actividadPlataforma?.totalModulos ?? 0}</span> módulos de trabajo asignados
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{actividadPlataforma?.conReferencia ?? 0}</span> personas con referencias laborales
            </div>
          </div>
        </div>

        {/* ── Capacitaciones realizadas ───────────────────── */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            🎓 Capacitaciones realizadas
          </h2>

          {/* KPIs rápidos */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(45,212,191,0.15)', border: '1px solid rgba(45,212,191,0.2)' }}>
              <p className="text-2xl font-extrabold" style={{ color: '#2dd4bf' }}>{capacitacionesData?.totalAprobadas ?? 0}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(45,212,191,0.8)' }}>Aprobadas</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <p className="text-2xl font-extrabold" style={{ color: '#fbbf24' }}>{capacitacionesData?.enCurso ?? 0}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(251,191,36,0.8)' }}>En curso</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.15)' }}>
              <p className="text-2xl font-extrabold" style={{ color: '#2dd4bf' }}>{capacitacionesData?.totalCursos ?? 0}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(45,212,191,0.7)' }}>Cursos distintos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

            {/* Top cursos */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Cursos más completados</p>
              {(capacitacionesData?.topCursos.length ?? 0) === 0 ? (
                <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.35)' }}>Todavía no hay capacitaciones aprobadas</p>
              ) : (
                <div className="space-y-2.5">
                  {capacitacionesData!.topCursos.slice(0, 8).map((c, i) => {
                    const maxTotal = capacitacionesData!.topCursos[0]?.total ?? 1;
                    const w = Math.round((c.total / maxTotal) * 100);
                    return (
                      <div key={c.slug} className="flex items-center gap-2.5">
                        <span className="text-xs font-bold w-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>#{i + 1}</span>
                        {c.icono && <span className="text-sm flex-shrink-0">{c.icono}</span>}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium truncate flex-1" style={{ color: 'rgba(255,255,255,0.85)' }} title={c.titulo}>{c.titulo}</span>
                            <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#2dd4bf' }}>{c.total}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(45,212,191,0.15)' }}>
                            <div className="h-full bg-teal-400 rounded-full transition-all duration-500" style={{ width: `${w}%` }} />
                          </div>
                          {c.puntaje_promedio !== null && (
                            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Puntaje promedio: <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{c.puntaje_promedio}%</span></p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Competencias más desarrolladas */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Competencias más desarrolladas</p>
              {(capacitacionesData?.topCompetencias.length ?? 0) === 0 ? (
                <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.35)' }}>Disponible cuando los candidatos completen capacitaciones</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {capacitacionesData!.topCompetencias.map((comp) => {
                    const max = capacitacionesData!.topCompetencias[0]?.total ?? 1;
                    const opacity = 0.4 + (comp.total / max) * 0.6;
                    return (
                      <span
                        key={comp.nombre}
                        className="inline-flex items-center gap-1.5 text-[11px] rounded-full px-2.5 py-1 font-medium"
                        style={{ opacity, background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}
                        title={`${comp.total} personas`}
                      >
                        {comp.nombre}
                        <span className="text-[10px] font-bold" style={{ color: 'rgba(45,212,191,0.7)' }}>{comp.total}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Talento disponible ──────────────────────────── */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            🏭 Talento disponible en el territorio
          </h2>
          {!hayFormativo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Oficios y rubros de experiencia</p>
                {['—', '—', '—', '—'].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <div className="w-36 h-4 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <div className="flex-1 h-5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <div className="w-6 h-4 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  </div>
                ))}
                <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Se completará cuando los candidatos suban sus CVs</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Habilidades y competencias</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Habilidad 1', 'Habilidad 2', 'Habilidad 3', 'Habilidad 4', 'Habilidad 5'].map(h => (
                    <span key={h} className="text-[11px] rounded-full px-2.5 py-0.5" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>{h}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {perfilFormativo.topRubros.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Oficios y rubros de experiencia</p>
                  {perfilFormativo.topRubros.slice(0, 10).map(r => {
                    const maxR = perfilFormativo.topRubros[0]?.total ?? 1;
                    const w = Math.round((r.total / maxR) * 100);
                    return (
                      <div key={r.rubro} className="flex items-center gap-2 mb-2">
                        <span className="text-xs w-36 flex-shrink-0 truncate" style={{ color: 'rgba(255,255,255,0.8)' }} title={r.rubro}>{r.rubro}</span>
                        <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'rgba(45,212,191,0.1)' }}>
                          <div className="h-full bg-brand-400 rounded-full" style={{ width: `${w}%` }} />
                        </div>
                        <span className="text-xs font-semibold w-6 text-right" style={{ color: 'rgba(255,255,255,0.6)' }}>{r.total}</span>
                      </div>
                    );
                  })}
                  {perfilFormativo.experienciaPromedio > 0 && (
                    <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Promedio experiencia: <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{perfilFormativo.experienciaPromedio} años</span>
                    </p>
                  )}
                </div>
              )}
              {perfilFormativo.topHabilidades.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Habilidades y competencias</p>
                  <div className="flex flex-wrap gap-1.5">
                    {perfilFormativo.topHabilidades.slice(0, 20).map(h => (
                      <span key={h.nombre} className="inline-flex items-center gap-1 text-[11px] rounded-full px-2.5 py-0.5" style={{ background: 'rgba(45,212,191,0.12)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }} title={`${h.total} personas`}>
                        {h.nombre} <span className="font-semibold" style={{ color: 'rgba(45,212,191,0.7)' }}>{h.total}</span>
                      </span>
                    ))}
                  </div>
                  {perfilFormativo.topIdiomas.length > 1 && (
                    <div className="mt-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Idiomas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {perfilFormativo.topIdiomas.map(i => (
                          <span key={i.idioma} className="text-[11px] rounded-full px-2.5 py-0.5" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>{i.idioma} ({i.total})</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Perfil formativo y digital ──────────────────── */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            📚 Perfil formativo y digital
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Nivel de estudios */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Nivel de estudios</p>
              {Object.keys(perfilFormativo?.nivelesEstudios ?? {}).length === 0 ? (
                <div className="space-y-2">
                  {['Universitario', 'Secundario', 'Primario', 'Terciario / Técnico'].map(n => (
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-xs w-36 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>{n}</span>
                      <div className="flex-1 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
                      <span className="text-xs w-8 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                    </div>
                  ))}
                  <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Datos disponibles cuando los candidatos carguen sus CVs</p>
                </div>
              ) : (
                <>
                  {['Universitario', 'Terciario / Técnico', 'Maestría', 'Doctorado', 'Secundario', 'Primario', 'Cursos / Capacitaciones', 'Otro']
                    .filter(n => (perfilFormativo.nivelesEstudios[n] ?? 0) > 0)
                    .map(nivel => {
                      const val = perfilFormativo.nivelesEstudios[nivel] ?? 0;
                      const totalN = Object.values(perfilFormativo.nivelesEstudios).reduce((a, b) => a + b, 0);
                      return (
                        <div key={nivel} className="flex items-center gap-2 mb-2">
                          <span className="text-xs w-36 flex-shrink-0 truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>{nivel}</span>
                          <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.round(val/totalN*100)}%` }} />
                          </div>
                          <span className="text-xs w-8 text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>{val}</span>
                        </div>
                      );
                    })}
                  {perfilFormativo.conCvCargado > 0 && (
                    <p className="text-[11px] mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{perfilFormativo.conCvCargado} CVs procesados por IA</p>
                  )}
                </>
              )}
            </div>
            {/* Alfabetización digital */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Alfabetización digital</p>
              {alfabetizacionDigital?.conDato === 0 ? (
                <div className="space-y-2">
                  {['Básico', 'Intermedio', 'Avanzado'].map(n => (
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-xs w-24 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>{n}</span>
                      <div className="flex-1 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
                      <span className="text-xs w-8 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                    </div>
                  ))}
                  <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Disponible cuando los candidatos completan el test de alfa digital</p>
                </div>
              ) : (
                <>
                  {[['Básico','bg-red-400'], ['Intermedio','bg-amber-400'], ['Avanzado','bg-emerald-500']].map(([nivel, bg]) => {
                    const val = alfabetizacionDigital?.porNivel[nivel] ?? 0;
                    const totalA = Object.values(alfabetizacionDigital?.porNivel ?? {}).reduce((a, b) => a + b, 0);
                    if (val === 0) return null;
                    return (
                      <div key={nivel} className="flex items-center gap-2 mb-2">
                        <span className="text-xs w-24 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.8)' }}>{nivel}</span>
                        <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div className={`h-full ${bg} rounded-full`} style={{ width: `${Math.round(val/totalA*100)}%` }} />
                        </div>
                        <span className="text-xs w-8 text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>{val}</span>
                      </div>
                    );
                  })}
                  {alfabetizacionDigital?.scorePromedio !== null && (
                    <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Score promedio digital: <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{alfabetizacionDigital?.scorePromedio} / 100</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Estadísticas sociales ───────────────────────── */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <Users size={14} className="text-brand-400" /> Estadísticas sociales
          </h2>
          {!haySocial ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {['💼 Situación laboral', '💰 Ingreso del hogar', '🏠 Tipo de vivienda'].map(label => (
                <div key={label}>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
                  {[75, 55, 40].map(w => (
                    <div key={w} className="flex items-center gap-2 mb-2">
                      <div className="w-28 h-3 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }} />
                      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-full rounded-full" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.12)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <p className="col-span-full text-xs text-center mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Los datos sociales se completan con el diagnóstico Korai
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {totalSL > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>💼 Situación laboral</p>
                  <div className="space-y-3">
                    {Object.entries(estadisticasSociales.situacion_laboral).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
                      <SocialStatRow key={key} label={SIT_LABORAL_LABEL[key] ?? key} value={val} total={totalSL} color={SIT_LABORAL_COLOR[key] ?? 'gray'} />
                    ))}
                  </div>
                </div>
              )}
              {totalIH > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>💰 Ingreso del hogar</p>
                  <div className="space-y-3">
                    {['<700k', '700k-1.3m', '1.3m-2m', '>2m', 'prefiere_no_decir'].filter(k => estadisticasSociales.ingreso_hogar[k] > 0).map(key => (
                      <SocialStatRow key={key} label={INGRESO_LABEL[key] ?? key} value={estadisticasSociales.ingreso_hogar[key]} total={totalIH} color={INGRESO_COLOR[key] ?? 'gray'} />
                    ))}
                  </div>
                </div>
              )}
              {totalTV > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>🏠 Tipo de vivienda</p>
                  <div className="space-y-3">
                    {['propia', 'alquilada', 'prestada', 'inestable'].filter(k => estadisticasSociales.tipo_vivienda[k] > 0).map(key => (
                      <SocialStatRow key={key} label={VIVIENDA_LABEL[key] ?? key} value={estadisticasSociales.tipo_vivienda[key]} total={totalTV} color={VIVIENDA_COLOR[key] ?? 'gray'} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Empleabilidad por zona ──────────────────────── */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <MapPin size={14} className="text-brand-400" /> Empleabilidad por barrio
          </h2>
          {porBarrio.length === 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left pb-2 pr-4">Barrio</th>
                    <th className="text-right pb-2 pr-4 w-16">Personas</th>
                    <th className="text-right pb-2 pr-4 w-16">Crítico</th>
                    <th className="text-left pb-2">Oficios frecuentes</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map(i => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="py-2 pr-4"><div className="h-3 w-24 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} /></td>
                      <td className="py-2 pr-4 text-right"><div className="h-3 w-6 rounded ml-auto" style={{ background: 'rgba(255,255,255,0.07)' }} /></td>
                      <td className="py-2 pr-4 text-right"><div className="h-3 w-8 rounded ml-auto" style={{ background: 'rgba(255,255,255,0.07)' }} /></td>
                      <td className="py-2"><div className="h-3 w-40 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs mt-3 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Aparecerá cuando los candidatos tengan barrio en su diagnóstico
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left pb-2 pr-4">Barrio</th>
                    <th className="text-right pb-2 pr-4 w-16">Personas</th>
                    <th className="text-right pb-2 pr-4 w-16">Crítico</th>
                    <th className="text-left pb-2">Oficios frecuentes</th>
                  </tr>
                </thead>
                <tbody>
                  {porBarrio.slice(0, 15).map(b => (
                    <tr key={b.barrio} className="hover:bg-white/[0.03] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="py-2 pr-4 font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{b.barrio}</td>
                      <td className="py-2 pr-4 text-right" style={{ color: 'rgba(255,255,255,0.6)' }}>{b.total}</td>
                      <td className="py-2 pr-4 text-right">
                        {b.pct_rojo > 0 ? <span className="text-red-400 font-semibold">{b.pct_rojo}%</span> : <span className="text-emerald-400">—</span>}
                      </td>
                      <td className="py-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{(b.topRubros ?? []).join(' · ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {porBarrio.length > 15 && (
                <p className="text-[11px] mt-3 text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Mostrando 15 de {porBarrio.length} barrios</p>
              )}
            </div>
          )}
        </div>

        {/* ── Dimensiones con más personas en riesgo ─────── */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <TrendingUp size={14} className="text-brand-400" /> Dimensiones con más personas en riesgo
          </h2>
          {totalConDiag === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-2 py-1.5">
                  <span className="text-xs font-bold w-4" style={{ color: 'rgba(255,255,255,0.25)' }}>#{i}</span>
                  <div className="w-5 h-5 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <div className="w-20 h-4 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <div className="flex-1 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <div className="w-10 h-4 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
                </div>
              ))}
              <p className="text-xs text-center mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Aparecerá con los diagnósticos Korai</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...rankingCriticidad].sort((a, b) => b.rojo - a.rojo).slice(0, 3).map((d, i) => {
                const meta = DIMS_META[d.dim];
                const maxRojo = [...rankingCriticidad].sort((a, b) => b.rojo - a.rojo)[0]?.rojo ?? 1;
                const barW = maxRojo > 0 ? (d.rojo / maxRojo) * 100 : 0;
                return (
                  <button key={d.dim} onClick={() => setDrillDown({ dim: d.dim, color: 'rojo' })}
                    className="w-full flex items-center gap-3 hover:bg-white/[0.04] px-2 py-1.5 rounded-lg transition-colors group">
                    <span className="text-xs font-bold w-4" style={{ color: 'rgba(255,255,255,0.35)' }}>#{i + 1}</span>
                    <span className="text-sm w-5">{meta.icon}</span>
                    <span className="text-sm w-20 flex-shrink-0 text-left" style={{ color: 'rgba(255,255,255,0.8)' }}>{meta.label}</span>
                    <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(248,113,113,0.15)' }}>
                      <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${barW}%` }} />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right text-red-400">{d.rojo}</span>
                    <ChevronRight size={13} className="flex-shrink-0 transition-colors group-hover:opacity-70" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Voces del territorio ────────────────────────── */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <Quote size={14} className="text-brand-400" /> Voces del territorio
          </h2>
          {voces.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map(i => (
                <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="h-3 w-20 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <div className="h-3 w-16 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-full rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <div className="h-3 w-4/5 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  </div>
                </div>
              ))}
              <p className="col-span-full text-xs text-center mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Aparecerán los testimonios de los candidatos sobre sus situaciones
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {voces.map((v, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <MapPin size={10} /> {v.barrio}
                    </span>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {new Date(v.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.8)' }}>"{v.texto}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

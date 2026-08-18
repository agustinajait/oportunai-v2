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

interface GobData {
  kpis: {
    total_usuarios: number; con_diagnostico: number; whatsapp_activo: number;
    pct_diagnostico: number; pct_wa: number; registrados_30d: number;
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
  porBarrio: { barrio: string; total: number; rojo: number; amarillo: number; pct_rojo: number }[];
  voces: { barrio: string; texto: string; fecha: string }[];
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
  const bg = { brand: 'bg-brand-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50', red: 'bg-red-50' }[color];
  const ic = { brand: 'text-brand-600', emerald: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600' }[color];
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon size={18} className={ic} />
        </div>
        <p className="text-xs text-ink-400 font-medium leading-tight">{label}</p>
      </div>
      <p className="text-2xl font-bold text-ink-900">{value}</p>
      {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
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
        <span className="text-sm font-medium text-ink-700 w-20 flex-shrink-0">{meta.label}</span>
        <div className="flex-1 relative">
          <div className="h-7 rounded-lg overflow-hidden flex cursor-pointer" onMouseLeave={() => setTooltip(null)}>
            {pVerde > 0 && (
              <div
                className="h-full bg-emerald-500 hover:brightness-110 transition-all"
                style={{ width: `${pVerde}%`, borderRight: pAmarillo > 0 || pRojo > 0 ? '2px solid white' : undefined }}
                onMouseEnter={() => setTooltip(`✅ Bien: ${data.verde} personas (${data.pct_verde}%)`)}
                onClick={() => onDrillDown(dim, 'verde')}
              />
            )}
            {pAmarillo > 0 && (
              <div
                className="h-full bg-amber-400 hover:brightness-110 transition-all"
                style={{ width: `${pAmarillo}%`, borderRight: pRojo > 0 ? '2px solid white' : undefined }}
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
            <div className="absolute left-0 -top-8 bg-ink-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10 pointer-events-none shadow-lg">
              {tooltip}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-ink-500 w-28 justify-end">
          {data.rojo > 0 && <span className="text-red-600 font-semibold">{data.pct_rojo}% crit.</span>}
          <span className="text-ink-300">|</span>
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
        <span className="text-ink-600">{label}</span>
        <span className="font-semibold text-ink-800">{pct}% <span className="text-ink-400 font-normal">({value})</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Panel drill-down ──────────────────────────────────── */
const COLOR_LABEL: Record<Color, string> = {
  verde: '✅ Bien', amarillo: '⚠️ Atención', rojo: '🔴 Prioritario',
};
const COLOR_BG: Record<Color, string> = {
  verde: 'bg-emerald-50 border-emerald-200',
  amarillo: 'bg-amber-50 border-amber-200',
  rojo: 'bg-red-50 border-red-200',
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
    c === 'verde' ? 'bg-emerald-500' : c === 'amarillo' ? 'bg-amber-400' : c === 'rojo' ? 'bg-red-500' : 'bg-gray-200';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className={`flex items-center justify-between px-5 py-4 border-b ${COLOR_BG[color]}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta?.icon}</span>
            <div>
              <p className="font-semibold text-ink-800 text-sm">{meta?.label} — {COLOR_LABEL[color]}</p>
              {!loading && <p className="text-xs text-ink-500">{candidatos.length} persona{candidatos.length !== 1 ? 's' : ''}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <X size={18} className="text-ink-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-ink-400">
              <div className="w-5 h-5 rounded-full border-2 border-brand-400 border-t-transparent animate-spin mr-2" />
              Cargando...
            </div>
          ) : candidatos.length === 0 ? (
            <div className="text-center py-12 text-ink-400">
              <Users size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin candidatos en esta categoría</p>
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {candidatos.map(c => (
                <div key={c.id} className="px-5 py-3.5 hover:bg-ink-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-medium text-ink-800 text-sm">{c.nombre_completo}</p>
                        {c.whatsapp_activo && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">💬 WA</span>
                        )}
                      </div>
                      <p className="text-xs text-ink-400">{c.email}</p>
                      {c.telefono && (
                        <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
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
                        className="ml-2 text-ink-300 hover:text-brand-600 transition-colors"
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
        <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between bg-ink-50/50">
          <p className="text-[11px] text-ink-400">Hacé clic en una barra para filtrar otra dimensión</p>
          <a href="/api/admin/gobierno/export" download className="text-xs flex items-center gap-1 text-brand-600 hover:underline">
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
      className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-brand-600 border border-ink-200 hover:border-brand-300 px-3 py-1.5 rounded-lg transition-colors"
    >
      <RefreshCw size={12} /> Cargar diagnóstico manual
    </button>
  );

  return (
    <div className="card p-5 border border-brand-200 bg-brand-50/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink-800">Cargar diagnóstico Korai manualmente</h3>
        <button onClick={() => { setOpen(false); setMsg(null); setUserCheck(null); }} className="text-ink-400 hover:text-ink-600">
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
            <p className="text-xs text-ink-400 mt-1.5 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Buscando usuario…</p>
          )}
          {userCheck === 'not_found' && (
            <p className="text-xs text-red-600 mt-1.5">❌ No se encontró ningún usuario con ese email</p>
          )}
          {isAdminAccount && (
            <div className="mt-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 font-medium">⚠️ Esta cuenta es <strong>{(userCheck as {role:string}).role}</strong>, no un candidato</p>
              <p className="text-xs text-amber-600 mt-0.5">El dashboard de gobierno solo muestra usuarios con rol <strong>user</strong>. Usá el email de un candidato real.</p>
            </div>
          )}
          {isValidCandidate && (
            <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
              <Check size={10} /> <strong>{(userCheck as {nombre_completo:string}).nombre_completo}</strong> — candidato válido
            </p>
          )}
        </div>
        <div>
          <label className="label">Semáforo por dimensión</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DIMS_LIST.map(d => (
              <div key={d} className="flex items-center gap-2">
                <span className="text-xs text-ink-600 w-16 capitalize">{d}</span>
                <select
                  value={dims[d] ?? ''}
                  onChange={e => setDims(p => ({ ...p, [d]: e.target.value }))}
                  className="flex-1 text-xs border border-ink-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                >
                  {COLORES_OPT.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        {msg && (
          <p className={`text-xs px-3 py-2 rounded-lg ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
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
      <div className="flex items-center justify-center h-64 text-ink-400">
        <div className="w-6 h-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin mr-2" />
        Cargando datos...
      </div>
    );
  }

  if (!data) return <p className="text-red-600 p-8">Error al cargar datos</p>;

  const { kpis, estadoGeneral, rankingCriticidad, estadisticasSociales, porBarrio, voces } = data;
  const totalConDiag = kpis.con_diagnostico;
  const areasCriticas = rankingCriticidad.filter(d => d.pct_rojo >= 20);

  // Detectar si hay datos sociodemográficos
  const haySocial = Object.keys(estadisticasSociales.situacion_laboral).length > 0
    || Object.keys(estadisticasSociales.ingreso_hogar).length > 0
    || Object.keys(estadisticasSociales.tipo_vivienda).length > 0;

  const totalSL  = Object.values(estadisticasSociales.situacion_laboral).reduce((a, b) => a + b, 0);
  const totalIH  = Object.values(estadisticasSociales.ingreso_hogar).reduce((a, b) => a + b, 0);
  const totalTV  = Object.values(estadisticasSociales.tipo_vivienda).reduce((a, b) => a + b, 0);

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
            <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wide flex items-center gap-2">
              <Activity size={14} /> Resumen general
            </h2>
            <div className="flex items-center gap-2">
              <SyncManualPanel onSuccess={cargarDatos} />
              <a
                href="/api/admin/gobierno/export"
                download
                className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium border border-brand-200 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download size={13} /> Exportar CSV
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatTile label="Candidatos registrados" value={kpis.total_usuarios}
              sub={`+${kpis.registrados_30d} últimos 30 días`} icon={Users} />
            <StatTile label="Con diagnóstico Korai" value={totalConDiag}
              sub={`${kpis.pct_diagnostico}% del total`} icon={BarChart2} color="brand" />
            <StatTile label="Con acompañamiento WA" value={kpis.whatsapp_activo}
              sub={`${kpis.pct_wa}% activaron WhatsApp`} icon={MessageCircle} color="emerald" />
          </div>
        </div>

        {/* ── Estado general del territorio ──────────────── */}
        {totalConDiag > 0 && (
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-ink-900 uppercase tracking-wide">
                  Estado general del territorio
                </h2>
                <p className="text-xs text-ink-400 mt-0.5">
                  Basado en {totalConDiag} diagnósticos
                  {porBarrio.length > 0 && ` — ${porBarrio.length} barrios`}
                </p>
              </div>
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
            </div>
            {/* Barra general */}
            <div className="h-6 rounded-xl overflow-hidden flex bg-gray-100">
              {estadoGeneral.pct_estable > 0 && (
                <div className="h-full bg-emerald-500" style={{ width: `${estadoGeneral.pct_estable}%` }} />
              )}
              {estadoGeneral.pct_alerta > 0 && (
                <div className="h-full bg-amber-400" style={{ width: `${estadoGeneral.pct_alerta}%` }} />
              )}
              {estadoGeneral.pct_critico > 0 && (
                <div className="h-full bg-red-500" style={{ width: `${estadoGeneral.pct_critico}%` }} />
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-ink-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Estable: {estadoGeneral.estable}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Alerta: {estadoGeneral.alerta}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Crítico: {estadoGeneral.critico}</span>
            </div>
          </div>
        )}

        {/* ── Semáforo por dimensión ──────────────────────── */}
        {totalConDiag > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-ink-800 flex items-center gap-2">
                  🚦 Diagnóstico por dimensión
                </h2>
                <p className="text-[11px] text-ink-400 mt-0.5">Hacé clic en una barra para ver los candidatos</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-ink-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Bien</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Atención</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Prioritario</span>
              </div>
            </div>
            <div className="space-y-3">
              {rankingCriticidad.map(d => (
                <StackedBar
                  key={d.dim}
                  dim={d.dim}
                  data={d}
                  onDrillDown={(dim, color) => setDrillDown({ dim, color })}
                />
              ))}
            </div>
            <p className="text-[10px] text-ink-300 mt-4 text-right">Ordenado por % de situación prioritaria</p>
          </div>
        )}

        {/* ── Barreras prioritarias ───────────────────────── */}
        {areasCriticas.length > 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" /> Barreras prioritarias
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {areasCriticas.map(d => {
                const meta = DIMS_META[d.dim];
                return (
                  <button
                    key={d.dim}
                    onClick={() => setDrillDown({ dim: d.dim, color: 'rojo' })}
                    className="bg-red-50 border border-red-100 rounded-xl p-4 text-left hover:bg-red-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="font-semibold text-ink-800 text-sm">{meta.label}</span>
                      <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        {d.pct_rojo}%
                      </span>
                    </div>
                    <p className="text-xs text-ink-600 leading-relaxed">
                      <span className="font-semibold text-red-700">{d.rojo} personas</span> en situación crítica
                      {d.amarillo > 0 && <> · {d.amarillo} en atención</>}
                    </p>
                    <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver candidatos <ChevronRight size={10} />
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Estadísticas sociales ───────────────────────── */}
        {haySocial && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-800 mb-5 flex items-center gap-2">
              <Users size={14} className="text-brand-600" /> Estadísticas sociales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

              {/* Situación laboral */}
              {totalSL > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-ink-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                    💼 Situación laboral
                  </p>
                  <div className="space-y-3">
                    {Object.entries(estadisticasSociales.situacion_laboral)
                      .sort((a, b) => b[1] - a[1])
                      .map(([key, val]) => (
                        <SocialStatRow
                          key={key}
                          label={SIT_LABORAL_LABEL[key] ?? key}
                          value={val}
                          total={totalSL}
                          color={SIT_LABORAL_COLOR[key] ?? 'gray'}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Ingreso del hogar */}
              {totalIH > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-ink-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                    💰 Ingreso del hogar
                  </p>
                  <div className="space-y-3">
                    {['<700k', '700k-1.3m', '1.3m-2m', '>2m', 'prefiere_no_decir']
                      .filter(k => estadisticasSociales.ingreso_hogar[k] > 0)
                      .map(key => (
                        <SocialStatRow
                          key={key}
                          label={INGRESO_LABEL[key] ?? key}
                          value={estadisticasSociales.ingreso_hogar[key]}
                          total={totalIH}
                          color={INGRESO_COLOR[key] ?? 'gray'}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Tipo de vivienda */}
              {totalTV > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-ink-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                    🏠 Tipo de vivienda
                  </p>
                  <div className="space-y-3">
                    {['propia', 'alquilada', 'prestada', 'inestable']
                      .filter(k => estadisticasSociales.tipo_vivienda[k] > 0)
                      .map(key => (
                        <SocialStatRow
                          key={key}
                          label={VIVIENDA_LABEL[key] ?? key}
                          value={estadisticasSociales.tipo_vivienda[key]}
                          total={totalTV}
                          color={VIVIENDA_COLOR[key] ?? 'gray'}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>

            {!haySocial && (
              <p className="text-xs text-ink-400 text-center py-4">
                Los datos sociales aparecerán cuando Korai los envíe junto al diagnóstico
              </p>
            )}
          </div>
        )}

        {/* ── Por barrio ─────────────────────────────────── */}
        {porBarrio.length > 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <MapPin size={14} className="text-brand-600" /> Distribución por barrio
            </h2>
            <div className="space-y-2">
              {porBarrio.slice(0, 10).map(b => {
                const maxTotal = porBarrio[0]?.total ?? 1;
                const barW = (b.total / maxTotal) * 100;
                const pRojo = b.total > 0 ? Math.round((b.rojo / b.total) * 100) : 0;
                return (
                  <div key={b.barrio} className="flex items-center gap-3">
                    <span className="text-xs text-ink-600 w-28 flex-shrink-0 truncate" title={b.barrio}>{b.barrio}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                      <div className="h-full bg-brand-400 rounded-full" style={{ width: `${barW}%` }} />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                      <span className="text-ink-600 font-medium w-6 text-right">{b.total}</span>
                      {pRojo > 0 && (
                        <span className="text-red-500 font-semibold text-[10px] bg-red-50 px-1.5 py-0.5 rounded-full">
                          {pRojo}% crit.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {porBarrio.length > 10 && (
              <p className="text-[11px] text-ink-300 mt-3 text-right">
                Mostrando 10 de {porBarrio.length} barrios
              </p>
            )}
          </div>
        )}

        {/* ── Dimensiones con más personas en riesgo ─────── */}
        {totalConDiag > 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-brand-600" /> Dimensiones con más personas en riesgo
            </h2>
            <div className="space-y-3">
              {[...rankingCriticidad].sort((a, b) => b.rojo - a.rojo).slice(0, 3).map((d, i) => {
                const meta = DIMS_META[d.dim];
                const maxRojo = [...rankingCriticidad].sort((a, b) => b.rojo - a.rojo)[0]?.rojo ?? 1;
                const barW = maxRojo > 0 ? (d.rojo / maxRojo) * 100 : 0;
                return (
                  <button
                    key={d.dim}
                    onClick={() => setDrillDown({ dim: d.dim, color: 'rojo' })}
                    className="w-full flex items-center gap-3 hover:bg-ink-50 px-2 py-1.5 rounded-lg transition-colors group"
                  >
                    <span className="text-xs font-bold text-ink-300 w-4">#{i + 1}</span>
                    <span className="text-sm w-5">{meta.icon}</span>
                    <span className="text-sm text-ink-700 w-20 flex-shrink-0 text-left">{meta.label}</span>
                    <div className="flex-1 h-4 bg-red-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${barW}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-red-600 w-10 text-right">{d.rojo}</span>
                    <ChevronRight size={13} className="text-ink-200 group-hover:text-ink-400 flex-shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Voces del territorio ────────────────────────── */}
        {voces.length > 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <Quote size={14} className="text-brand-600" /> Voces del territorio
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {voces.map((v, i) => (
                <div key={i} className="bg-ink-50 border border-ink-100 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1 text-[11px] text-ink-500 font-medium">
                      <MapPin size={10} /> {v.barrio}
                    </span>
                    <span className="text-[10px] text-ink-300">
                      {new Date(v.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-ink-700 leading-relaxed italic">"{v.texto}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Sin datos ───────────────────────────────────── */}
        {totalConDiag === 0 && (
          <div className="card p-12 text-center text-ink-400">
            <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Todavía no hay diagnósticos de Korai registrados</p>
            <p className="text-sm mt-1">Los datos aparecerán aquí cuando los candidatos completen el test</p>
          </div>
        )}
      </div>
    </>
  );
}

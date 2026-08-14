'use client';

import { useEffect, useState } from 'react';
import {
  Users, Activity, MessageCircle, AlertTriangle, TrendingUp,
  BarChart2, Download, X, Phone, ExternalLink, ChevronRight,
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
  porDimension: Record<string, { verde: number; amarillo: number; rojo: number; sin_dato: number }>;
  rankingCriticidad: DimStat[];
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
  dim: string;
  data: DimStat;
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
          <div
            className="h-7 rounded-lg overflow-hidden flex cursor-pointer"
            onMouseLeave={() => setTooltip(null)}
          >
            {pVerde > 0 && (
              <div
                className="h-full bg-emerald-500 hover:brightness-110 transition-all"
                style={{ width: `${pVerde}%`, borderRight: pAmarillo > 0 || pRojo > 0 ? '2px solid white' : undefined }}
                onMouseEnter={() => setTooltip(`✅ Bien: ${data.verde} personas (${data.pct_verde}%)`)}
                onClick={() => onDrillDown(dim, 'verde')}
                title={`Ver ${data.verde} personas en Bien`}
              />
            )}
            {pAmarillo > 0 && (
              <div
                className="h-full bg-amber-400 hover:brightness-110 transition-all"
                style={{ width: `${pAmarillo}%`, borderRight: pRojo > 0 ? '2px solid white' : undefined }}
                onMouseEnter={() => setTooltip(`⚠️ Atención: ${data.amarillo} personas (${data.pct_amarillo}%)`)}
                onClick={() => onDrillDown(dim, 'amarillo')}
                title={`Ver ${data.amarillo} personas en Atención`}
              />
            )}
            {pRojo > 0 && (
              <div
                className="h-full bg-red-500 hover:brightness-110 transition-all"
                style={{ width: `${pRojo}%` }}
                onMouseEnter={() => setTooltip(`🔴 Prioritario: ${data.rojo} personas (${data.pct_rojo}%)`)}
                onClick={() => onDrillDown(dim, 'rojo')}
                title={`Ver ${data.rojo} personas en Prioritario`}
              />
            )}
          </div>
          {tooltip && (
            <div className="absolute left-0 -top-8 bg-ink-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10 pointer-events-none shadow-lg">
              {tooltip}
            </div>
          )}
        </div>

        {/* Números */}
        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-ink-500 w-28 justify-end">
          {data.rojo > 0 && <span className="text-red-600 font-semibold">{data.pct_rojo}% crit.</span>}
          <span className="text-ink-300">|</span>
          <span>{data.total} diag.</span>
        </div>
      </div>
    </div>
  );
}

/* ── Panel drill-down ──────────────────────────────────── */
const COLOR_LABEL: Record<Color, string> = {
  verde: '✅ Bien',
  amarillo: '⚠️ Atención',
  rojo: '🔴 Prioritario',
};
const COLOR_BG: Record<Color, string> = {
  verde: 'bg-emerald-50 border-emerald-200',
  amarillo: 'bg-amber-50 border-amber-200',
  rojo: 'bg-red-50 border-red-200',
};
const COLOR_TAG: Record<Color, string> = {
  verde: 'bg-emerald-100 text-emerald-700',
  amarillo: 'bg-amber-100 text-amber-700',
  rojo: 'bg-red-100 text-red-700',
};

const DIMS_ALL = ['empleo', 'educacion', 'ingresos', 'salud', 'vivienda', 'red'] as const;

function DrillDownPanel({
  dim, color, onClose,
}: {
  dim: string; color: Color; onClose: () => void;
}) {
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
        {/* Header */}
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

        {/* Lista */}
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
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                            💬 WA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-400">{c.email}</p>
                      {c.telefono && (
                        <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {c.telefono}
                        </p>
                      )}
                    </div>
                    {/* Semáforo compacto todas las dims */}
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

        {/* Footer */}
        <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between bg-ink-50/50">
          <p className="text-[11px] text-ink-400">
            Hacé clic en una barra del semáforo para filtrar otra dimensión
          </p>
          <a
            href={`/api/admin/gobierno/export`}
            download
            className="text-xs flex items-center gap-1 text-brand-600 hover:underline"
          >
            <Download size={12} /> Exportar todo
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Componente principal ──────────────────────────────── */
export default function GobiernoClient() {
  const [data, setData] = useState<GobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [drillDown, setDrillDown] = useState<{ dim: string; color: Color } | null>(null);

  useEffect(() => {
    fetch('/api/admin/gobierno')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-400">
        <div className="w-6 h-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin mr-2" />
        Cargando datos...
      </div>
    );
  }

  if (!data) return <p className="text-red-600 p-8">Error al cargar datos</p>;

  const { kpis, rankingCriticidad } = data;
  const totalConDiag = kpis.con_diagnostico;

  const areasCriticas = rankingCriticidad.filter(d => d.pct_rojo >= 20);
  const topRojo = [...rankingCriticidad].sort((a, b) => b.rojo - a.rojo).slice(0, 3);

  return (
    <>
      {/* Panel drill-down */}
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
            <a
              href="/api/admin/gobierno/export"
              download
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium border border-brand-200 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={13} /> Exportar CSV
            </a>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatTile label="Candidatos registrados" value={kpis.total_usuarios}
              sub={`+${kpis.registrados_30d} últimos 30 días`} icon={Users} />
            <StatTile label="Con diagnóstico Korai" value={kpis.con_diagnostico}
              sub={`${kpis.pct_diagnostico}% del total`} icon={BarChart2} color="brand" />
            <StatTile label="Acompañamiento activo" value={kpis.whatsapp_activo}
              sub={`${kpis.pct_wa}% activaron WhatsApp`} icon={MessageCircle} color="emerald" />
          </div>
        </div>

        {/* ── Semáforo por dimensión ──────────────────────── */}
        {totalConDiag > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-ink-800 flex items-center gap-2">
                  🚦 Semáforo de bienestar — {totalConDiag} diagnósticos
                </h2>
                <p className="text-[11px] text-ink-400 mt-0.5">Hacé clic en una barra para ver los candidatos</p>
              </div>
              {/* Leyenda */}
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
            <p className="text-[10px] text-ink-300 mt-4 text-right">Ordenado por % de situación prioritaria (rojo)</p>
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

        {/* ── Ranking absoluto ────────────────────────────── */}
        {totalConDiag > 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-brand-600" /> Dimensiones con más personas en riesgo
            </h2>
            <div className="space-y-3">
              {topRojo.map((d, i) => {
                const meta = DIMS_META[d.dim];
                const barW = topRojo[0].rojo > 0 ? (d.rojo / topRojo[0].rojo) * 100 : 0;
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
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-red-600 w-12 text-right">{d.rojo}</span>
                    <ChevronRight size={13} className="text-ink-200 group-hover:text-ink-400 flex-shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

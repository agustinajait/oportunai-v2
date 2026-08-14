'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, MessageCircle, AlertTriangle, TrendingUp, BarChart2 } from 'lucide-react';

const DIMS_META: Record<string, { label: string; icon: string }> = {
  empleo:    { label: 'Empleo',     icon: '💼' },
  educacion: { label: 'Educación',  icon: '📚' },
  ingresos:  { label: 'Ingresos',   icon: '💰' },
  salud:     { label: 'Salud',      icon: '❤️' },
  vivienda:  { label: 'Vivienda',   icon: '🏠' },
  red:       { label: 'Red',        icon: '🤝' },
};

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

function StackedBar({ dim, data, total }: { dim: string; data: DimStat; total: number }) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const meta = DIMS_META[dim];
  if (!meta || data.total === 0) return null;

  const pVerde   = (data.verde   / data.total) * 100;
  const pAmarillo = (data.amarillo / data.total) * 100;
  const pRojo    = (data.rojo    / data.total) * 100;

  return (
    <div className="group">
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-base w-6 text-center flex-shrink-0">{meta.icon}</span>
        <span className="text-sm font-medium text-ink-700 w-20 flex-shrink-0">{meta.label}</span>
        <div className="flex-1 relative">
          {/* Stacked bar */}
          <div
            className="h-6 rounded-lg overflow-hidden flex cursor-pointer"
            onMouseLeave={() => setTooltip(null)}
          >
            {pVerde > 0 && (
              <div
                className="h-full bg-emerald-500 transition-opacity hover:opacity-90"
                style={{ width: `${pVerde}%`, borderRight: pAmarillo > 0 || pRojo > 0 ? '2px solid white' : undefined }}
                onMouseEnter={() => setTooltip(`✅ Bien: ${data.verde} personas (${data.pct_verde}%)`)}
              />
            )}
            {pAmarillo > 0 && (
              <div
                className="h-full bg-amber-400 transition-opacity hover:opacity-90"
                style={{ width: `${pAmarillo}%`, borderRight: pRojo > 0 ? '2px solid white' : undefined }}
                onMouseEnter={() => setTooltip(`⚠️ Atención: ${data.amarillo} personas (${data.pct_amarillo}%)`)}
              />
            )}
            {pRojo > 0 && (
              <div
                className="h-full bg-red-500 transition-opacity hover:opacity-90"
                style={{ width: `${pRojo}%` }}
                onMouseEnter={() => setTooltip(`🔴 Prioritario: ${data.rojo} personas (${data.pct_rojo}%)`)}
              />
            )}
          </div>
          {/* Tooltip */}
          {tooltip && (
            <div className="absolute left-0 -top-8 bg-ink-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10 pointer-events-none shadow-lg">
              {tooltip}
            </div>
          )}
        </div>
        {/* Numbers */}
        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-ink-500 w-28 justify-end">
          {data.rojo > 0 && <span className="text-red-600 font-semibold">{data.pct_rojo}% crit.</span>}
          <span className="text-ink-300">|</span>
          <span>{data.total} diag.</span>
        </div>
      </div>
    </div>
  );
}

export default function GobiernoClient() {
  const [data, setData] = useState<GobData | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Áreas más críticas (rojo > 0)
  const areasCriticas = rankingCriticidad.filter(d => d.pct_rojo >= 20);
  // Áreas con más personas en rojo (cantidad absoluta)
  const topRojo = [...rankingCriticidad].sort((a, b) => b.rojo - a.rojo).slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── KPIs ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Activity size={14} /> Resumen general
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatTile label="Candidatos registrados" value={kpis.total_usuarios}
            sub={`+${kpis.registrados_30d} últimos 30 días`} icon={Users} />
          <StatTile label="Con diagnóstico Korai" value={kpis.con_diagnostico}
            sub={`${kpis.pct_diagnostico}% del total`} icon={BarChart2} color="brand" />
          <StatTile label="Acompañamiento activo" value={kpis.whatsapp_activo}
            sub={`${kpis.pct_wa}% activaron WhatsApp`} icon={MessageCircle} color="emerald" />
        </div>
      </div>

      {/* ── Semáforo por dimensión ────────────────────────── */}
      {totalConDiag > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-ink-800 flex items-center gap-2">
              🚦 Semáforo de bienestar — {totalConDiag} diagnósticos
            </h2>
            {/* Leyenda */}
            <div className="flex items-center gap-3 text-[11px] text-ink-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Bien</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Atención</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Prioritario</span>
            </div>
          </div>
          <div className="space-y-3">
            {rankingCriticidad.map(d => (
              <StackedBar key={d.dim} dim={d.dim} data={d} total={totalConDiag} />
            ))}
          </div>
          <p className="text-[10px] text-ink-300 mt-4 text-right">Ordenado por % de situación prioritaria (rojo)</p>
        </div>
      )}

      {/* ── Áreas críticas ────────────────────────────────── */}
      {areasCriticas.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" /> Barreras prioritarias
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {areasCriticas.map(d => {
              const meta = DIMS_META[d.dim];
              return (
                <div key={d.dim} className="bg-red-50 border border-red-100 rounded-xl p-4">
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Ranking cantidad absoluta ─────────────────────── */}
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
                <div key={d.dim} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-ink-300 w-4">#{i + 1}</span>
                  <span className="text-sm w-5">{meta.icon}</span>
                  <span className="text-sm text-ink-700 w-20 flex-shrink-0">{meta.label}</span>
                  <div className="flex-1 h-4 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${barW}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-red-600 w-12 text-right">{d.rojo}</span>
                </div>
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
  );
}

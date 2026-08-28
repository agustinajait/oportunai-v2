'use client';

import Link from 'next/link';
import { Star, Clock, ChevronRight, Briefcase, Monitor, Trophy } from 'lucide-react';

type EstadoCapacitate = 'no_iniciada' | 'en_progreso' | 'completada' | 'aprobada';

interface ProgresoResumen {
  contenido_id: string;
  estado:       EstadoCapacitate;
  modulo_actual: number;
  puntaje_final: number | null;
  aprobada_en:   string | null;
}

interface ContenidoResumen {
  id:            string;
  slug:          string;
  titulo:        string;
  categoria:     string;
  descripcion:   string;
  nivel:         string;
  duracion_min:  number;
  competencias:  string[];
  icono:         string;
  total_modulos: number;
  progreso:      ProgresoResumen | null;
}

interface Props {
  contenidos:     ContenidoResumen[];
  estrellasTotal: number;
}

const CATEGORIAS: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  fisicos_oficios: { label: 'Trabajos físicos y oficios', Icon: Briefcase, color: 'teal'  },
  digitales:       { label: 'Trabajos digitales',         Icon: Monitor,   color: 'brand' },
};

function EstadoBadge({ estado }: { estado: EstadoCapacitate }) {
  const map: Record<EstadoCapacitate, { label: string; className: string }> = {
    no_iniciada: { label: 'No iniciada',  className: 'bg-gray-100 text-gray-500' },
    en_progreso: { label: 'En progreso',  className: 'bg-amber-100 text-amber-700' },
    completada:  { label: 'Completada',   className: 'bg-blue-100 text-blue-700' },
    aprobada:    { label: '★ Aprobada',   className: 'bg-teal-100 text-teal-700 font-semibold' },
  };
  const { label, className } = map[estado];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${className}`}>
      {label}
    </span>
  );
}

function CapacitateCard({ item }: { item: ContenidoResumen }) {
  const progreso   = item.progreso;
  const estado     = progreso?.estado ?? 'no_iniciada';
  const aprobada   = estado === 'aprobada';
  const enProgreso = estado === 'en_progreso';
  const pct        = enProgreso && item.total_modulos > 0
    ? Math.round((progreso!.modulo_actual / item.total_modulos) * 100)
    : 0;

  return (
    <Link
      href={`/dashboard/capacitate/${item.slug}`}
      className={`group block bg-white rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden ${
        aprobada ? 'border-teal-200' : 'border-gray-100'
      }`}
    >
      {/* Header con icono */}
      <div className={`px-5 pt-5 pb-3 flex items-start gap-3 ${aprobada ? 'bg-teal-50/50' : ''}`}>
        <span className="text-3xl flex-shrink-0">{item.icono}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-ink-900 text-sm leading-tight">{item.titulo}</h3>
            {aprobada && <Star size={16} className="flex-shrink-0 text-teal-500 fill-teal-500 mt-0.5" />}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-400 capitalize">{item.nivel}</span>
            <span className="text-gray-200">·</span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {item.duracion_min} min
            </span>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <p className="px-5 text-xs text-gray-500 leading-relaxed line-clamp-2">
        {item.descripcion}
      </p>

      {/* Progreso */}
      {enProgreso && (
        <div className="px-5 mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{progreso!.modulo_actual} / {item.total_modulos} módulos</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 mt-3 flex items-center justify-between border-t border-gray-50">
        <EstadoBadge estado={estado} />
        <ChevronRight
          size={16}
          className="text-gray-300 group-hover:text-brand-500 transition-colors"
        />
      </div>
    </Link>
  );
}

export default function CapitateDashboard({ contenidos, estrellasTotal }: Props) {
  const categorias = Object.keys(CATEGORIAS);

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-ink-900">Capacitate</h1>
          <p className="text-gray-500 text-sm">
            Aprendé, practicá y sumá competencias a tu perfil laboral.
          </p>
        </div>

        {/* Resumen de estrellas */}
        {estrellasTotal > 0 && (
          <div className="bg-gradient-to-r from-brand-600 to-teal-500 rounded-2xl p-5 text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Trophy size={24} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-lg">
                {estrellasTotal} {estrellasTotal === 1 ? 'capacitación aprobada' : 'capacitaciones aprobadas'}
              </p>
              <p className="text-white/80 text-sm">
                {'★'.repeat(Math.min(estrellasTotal, 10))} {estrellasTotal > 10 ? `+${estrellasTotal - 10}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Grid por categoría */}
        {categorias.map(cat => {
          const items = contenidos.filter(c => c.categoria === cat);
          if (items.length === 0) return null;
          const { label, Icon } = CATEGORIAS[cat];

          return (
            <section key={cat} className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-brand-600" />
                <h2 className="font-semibold text-ink-900">{label}</h2>
                <span className="text-xs text-gray-400">({items.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(item => (
                  <CapacitateCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}

        {contenidos.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-medium">Próximamente</p>
            <p className="text-sm mt-1">Las capacitaciones se están cargando.</p>
          </div>
        )}

      </div>
    </div>
  );
}

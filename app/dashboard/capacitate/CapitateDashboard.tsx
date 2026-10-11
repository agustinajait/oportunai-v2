'use client';

import Link from 'next/link';
import { Clock, ChevronRight, Briefcase, Monitor, Award, PlayCircle, BookOpen, CheckCircle } from 'lucide-react';

type EstadoCapacitate = 'no_iniciada' | 'en_progreso' | 'completada' | 'aprobada';

interface ProgresoResumen {
  contenido_id:  string;
  estado:        EstadoCapacitate;
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
  areaLaboral?:   string | null;
}

const AREAS_DIGITALES = ['Tecnología', 'Administración'];
function categoriaRecomendada(area: string | null | undefined): string | null {
  if (!area) return null;
  return AREAS_DIGITALES.includes(area) ? 'digitales' : 'fisicos_oficios';
}

const CATEGORIAS: Record<string, { label: string; Icon: React.ElementType; gradient: string; textColor: string }> = {
  fisicos_oficios: {
    label: 'Trabajos físicos y oficios',
    Icon: Briefcase,
    gradient: 'from-teal-500 to-emerald-600',
    textColor: 'text-teal-700',
  },
  digitales: {
    label: 'Trabajos digitales',
    Icon: Monitor,
    gradient: 'from-brand-500 to-violet-600',
    textColor: 'text-brand-700',
  },
};

const NIVEL_LABEL: Record<string, string> = {
  inicial: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

function CourseCard({ item, featured = false }: { item: ContenidoResumen; featured?: boolean }) {
  const progreso   = item.progreso;
  const estado     = progreso?.estado ?? 'no_iniciada';
  const aprobada   = estado === 'aprobada';
  const enProgreso = estado === 'en_progreso';
  const cat        = CATEGORIAS[item.categoria];
  const pct = enProgreso && item.total_modulos > 0
    ? Math.round((progreso!.modulo_actual / item.total_modulos) * 100)
    : 0;

  return (
    <Link
      href={`/dashboard/capacitate/${item.slug}`}
      className={`group flex flex-col bg-white rounded-2xl overflow-hidden border transition-all active:scale-[0.98] ${
        aprobada
          ? 'border-emerald-200 shadow-sm'
          : featured
          ? 'border-brand-200 shadow-md'
          : 'border-gray-100 shadow-sm hover:shadow-md'
      } ${featured ? 'w-full' : 'w-64 flex-shrink-0 sm:w-auto sm:flex-shrink'}`}
    >
      {/* Thumbnail */}
      <div className={`relative h-28 bg-gradient-to-br ${cat?.gradient ?? 'from-gray-400 to-gray-600'} flex items-center justify-center`}>
        <span className="text-5xl drop-shadow-sm">{item.icono}</span>
        {aprobada && (
          <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-0.5 flex items-center gap-1">
            <Award size={11} className="text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700">Certificado</span>
          </div>
        )}
        {enProgreso && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="font-bold text-ink-900 text-sm leading-snug line-clamp-2">{item.titulo}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.descripcion}</p>
        </div>

        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-xs text-gray-400">{NIVEL_LABEL[item.nivel] ?? item.nivel}</span>
          <span className="text-gray-200">·</span>
          <Clock size={11} className="text-gray-300" />
          <span className="text-xs text-gray-400">{item.duracion_min} min</span>
        </div>

        {enProgreso && (
          <div>
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>Módulo {progreso!.modulo_actual} de {item.total_modulos}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          {aprobada
            ? <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle size={12} /> Aprobado</span>
            : enProgreso
            ? <span className="text-xs font-semibold text-brand-600 flex items-center gap-1"><PlayCircle size={12} /> Continuar</span>
            : <span className="text-xs text-gray-400 flex items-center gap-1"><BookOpen size={12} /> Empezar</span>
          }
          <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

export default function CapitateDashboard({ contenidos, estrellasTotal, areaLaboral }: Props) {
  const categorias = Object.keys(CATEGORIAS);
  const catRec     = categoriaRecomendada(areaLaboral);

  const enProgreso = contenidos.filter(c => c.progreso?.estado === 'en_progreso');
  const aprobadas  = contenidos.filter(c => c.progreso?.estado === 'aprobada');
  const total      = contenidos.length;

  const recomendada = catRec
    ? contenidos.find(c => c.categoria === catRec && c.progreso?.estado !== 'aprobada' && c.progreso?.estado !== 'en_progreso')
    : null;

  return (
    <div className="min-h-screen bg-ink-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-ink-900">Capacitate</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Aprendé habilidades que te abren puertas al trabajo
          </p>

          {/* Progress summary */}
          {total > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>{aprobadas.length} de {total} completados</span>
                  <span>{Math.round((aprobadas.length / total) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all"
                    style={{ width: `${Math.round((aprobadas.length / total) * 100)}%` }}
                  />
                </div>
              </div>
              {estrellasTotal > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 shrink-0">
                  <Award size={14} className="text-amber-500" />
                  <span className="text-xs font-bold text-amber-700">{estrellasTotal} cert.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* Continuar donde lo dejaste */}
        {enProgreso.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <PlayCircle size={16} className="text-brand-600" />
              <h2 className="font-semibold text-ink-900 text-sm">Continuar donde lo dejaste</h2>
            </div>
            <CourseCard item={enProgreso[0]} featured />
          </section>
        )}

        {/* Recomendado para vos */}
        {recomendada && areaLaboral && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">⭐</span>
              <h2 className="font-semibold text-ink-900 text-sm">Recomendado para vos</h2>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{areaLaboral}</span>
            </div>
            <CourseCard item={recomendada} featured />
          </section>
        )}

        {/* Certificados */}
        {aprobadas.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-emerald-600" />
              <h2 className="font-semibold text-ink-900 text-sm">Tus certificados</h2>
              <span className="text-xs text-gray-400">({aprobadas.length})</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2">
              {aprobadas.map(item => (
                <CourseCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Grid por categoría */}
        {categorias.map(cat => {
          const items = contenidos.filter(c => c.categoria === cat && c.progreso?.estado !== 'aprobada');
          if (items.length === 0) return null;
          const { label, Icon, textColor } = CATEGORIAS[cat];

          return (
            <section key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon size={16} className={textColor} />
                <h2 className="font-semibold text-ink-900 text-sm">{label}</h2>
                <span className="text-xs text-gray-400">({items.length})</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2">
                {items.map(item => (
                  <CourseCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}

        {contenidos.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📚</p>
            <p className="font-semibold text-ink-600">Próximamente</p>
            <p className="text-sm mt-1">Las capacitaciones se están cargando.</p>
          </div>
        )}

      </div>
    </div>
  );
}

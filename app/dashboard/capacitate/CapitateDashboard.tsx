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
      className={`group flex flex-col rounded-2xl overflow-hidden transition-all active:scale-[0.98] ${
        featured ? 'w-full' : 'w-64 flex-shrink-0 sm:w-auto sm:flex-shrink'
      }`}
      style={{
        background: aprobada
          ? 'rgba(16,185,129,0.08)'
          : 'rgba(255,255,255,0.05)',
        border: aprobada
          ? '1px solid rgba(16,185,129,0.25)'
          : featured
          ? '1px solid rgba(112,72,240,0.35)'
          : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Thumbnail */}
      <div className={`relative h-28 bg-gradient-to-br ${cat?.gradient ?? 'from-gray-400 to-gray-600'} flex items-center justify-center`}>
        <span className="text-5xl drop-shadow-sm">{item.icono}</span>
        {aprobada && (
          <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 flex items-center gap-1" style={{ background: 'rgba(16,185,129,0.9)' }}>
            <Award size={11} className="text-white" />
            <span className="text-[10px] font-bold text-white">Certificado</span>
          </div>
        )}
        {enProgreso && (
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#4B33CC,#7048F0)' }} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="font-bold text-sm leading-snug line-clamp-2" style={{ color: 'rgba(255,255,255,0.9)' }}>{item.titulo}</h3>
          <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.descripcion}</p>
        </div>

        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{NIVEL_LABEL[item.nivel] ?? item.nivel}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <Clock size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.duracion_min} min</span>
        </div>

        {enProgreso && (
          <div>
            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span>Módulo {progreso!.modulo_actual} de {item.total_modulos}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#4B33CC,#7048F0)' }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          {aprobada
            ? <span className="text-xs font-semibold flex items-center gap-1" style={{ color: '#34d399' }}><CheckCircle size={12} /> Aprobado</span>
            : enProgreso
            ? <span className="text-xs font-semibold flex items-center gap-1" style={{ color: '#a78bfa' }}><PlayCircle size={12} /> Continuar</span>
            : <span className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}><BookOpen size={12} /> Empezar</span>
          }
          <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.2)' }} className="group-hover:text-violet-400 transition-colors" />
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
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d14' }}>

      {/* Header oscuro */}
      <div className="relative px-4 pt-12 pb-7" style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #4B33CC 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Tu formación</p>
          <h1 className="text-white font-bold text-2xl leading-tight">Capacitate</h1>
          <p className="text-white/55 text-sm mt-1">Aprendé habilidades que te abren puertas al trabajo</p>

          {total > 0 && (
            <div className="mt-5 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span>{aprobadas.length} de {total} completados</span>
                  <span>{Math.round((aprobadas.length / total) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.round((aprobadas.length / total) * 100)}%`, background: 'linear-gradient(90deg,#4B33CC,#7048F0)' }}
                  />
                </div>
              </div>
              {estrellasTotal > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 shrink-0" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
                  <Award size={14} style={{ color: '#fbbf24' }} />
                  <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>{estrellasTotal} cert.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 w-full">

        {/* Continuar donde lo dejaste */}
        {enProgreso.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <PlayCircle size={16} style={{ color: '#a78bfa' }} />
              <h2 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Continuar donde lo dejaste</h2>
            </div>
            <CourseCard item={enProgreso[0]} featured />
          </section>
        )}

        {/* Recomendado para vos */}
        {recomendada && areaLaboral && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">⭐</span>
              <h2 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Recomendado para vos</h2>
              <span className="text-xs rounded-full px-2 py-0.5" style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)' }}>{areaLaboral}</span>
            </div>
            <CourseCard item={recomendada} featured />
          </section>
        )}

        {/* Certificados */}
        {aprobadas.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Award size={16} style={{ color: '#34d399' }} />
              <h2 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Tus certificados</h2>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>({aprobadas.length})</span>
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
          const { label, Icon } = CATEGORIAS[cat];
          const iconColor = cat === 'fisicos_oficios' ? '#34d399' : '#a78bfa';

          return (
            <section key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon size={16} style={{ color: iconColor }} />
                <h2 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</h2>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>({items.length})</span>
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
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📚</p>
            <p className="font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Próximamente</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Las capacitaciones se están cargando.</p>
          </div>
        )}

      </div>
    </div>
  );
}

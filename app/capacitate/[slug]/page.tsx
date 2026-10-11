export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  ArrowLeft, Clock, Award, BookOpen,
  CheckCircle, ChevronRight, Star,
  Users
} from 'lucide-react';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const curso = await prisma.capacitateContenido.findUnique({
    where: { slug: params.slug },
    select: { titulo: true, descripcion: true, icono: true },
  });
  if (!curso) return { title: 'Curso no encontrado' };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return {
    title: `${curso.titulo} | Capacitate en Oportunai`,
    description: curso.descripcion,
    openGraph: {
      title: `${curso.icono ?? '🎓'} ${curso.titulo} — Oportunai`,
      description: curso.descripcion,
      url: `${appUrl}/capacitate/${params.slug}`,
      siteName: 'Oportunai',
    },
  };
}

export default async function CapacitatePublicPage({ params }: Props) {
  const curso = await prisma.capacitateContenido.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      titulo: true,
      descripcion: true,
      objetivo: true,
      categoria: true,
      nivel: true,
      icono: true,
      duracion_min: true,
      competencias: true,
      activa: true,
      modulos: {
        orderBy: { orden: 'asc' },
        select: { orden: true, titulo: true, tipo: true, es_desafio_final: true },
      },
    },
  });

  if (!curso || !curso.activa) notFound();

  const totalModulos    = curso.modulos.length;
  const modulosNormales = curso.modulos.filter(m => !m.es_desafio_final);
  const tieneDesafio    = curso.modulos.some(m => m.es_desafio_final);
  const competencias    = Array.isArray(curso.competencias) ? (curso.competencias as string[]) : [];

  const totalAprobados = await prisma.capacitateProgreso.count({
    where: { contenido_id: curso.id, estado: 'aprobada' },
  });

  const TIPO_LABEL: Record<string, string> = {
    lectura:       '📖 Lectura',
    pregunta:      '❓ Pregunta',
    situacion:     '🎭 Situación',
    actividad:     '✏️ Actividad',
    desafio_final: '🏆 Desafío final',
  };

  const NIVEL_LABEL: Record<string, string> = {
    inicial:    'Inicial',
    intermedio: 'Intermedio',
    avanzado:   'Avanzado',
  };

  const card = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 22px', marginBottom: 16 };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d14', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* NAV */}
      <nav style={{ background: 'rgba(26,15,60,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#4B33CC,#7048F0)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 13 }}>O</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.9)' }}>Oportunai</span>
          </Link>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, textDecoration: 'none', color: 'rgba(255,255,255,0.45)' }}>
            <ArrowLeft size={13} /> Volver al inicio
          </Link>
        </div>
      </nav>

      {/* HERO HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#1a0f3c,#2d1b69)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'radial-gradient(circle at 70% 30%, #4B33CC 0%, transparent 60%)' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 20px 32px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ fontSize: 52, lineHeight: 1, flexShrink: 0 }}>{curso.icono ?? '🎓'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '3px 10px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                  {curso.categoria}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', borderRadius: 20, padding: '3px 10px' }}>
                  {NIVEL_LABEL[curso.nivel] ?? curso.nivel}
                </span>
                {totalAprobados > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 20, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Star size={9} fill="currentColor" /> {totalAprobados} aprobaron
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0, lineHeight: 1.25 }}>
                {curso.titulo}
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '10px 0 0', lineHeight: 1.65 }}>
                {curso.descripcion}
              </p>

              {/* Métricas */}
              <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} color="#a78bfa" />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{curso.duracion_min} min</strong> estimados
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={13} color="#a78bfa" />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{modulosNormales.length}</strong> módulos{tieneDesafio ? ' + desafío' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={13} color="#fbbf24" />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Certificado al aprobar</span>
                </div>
                {totalAprobados > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={13} color="#a78bfa" />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                      <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{totalAprobados}</strong> ya aprobaron
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>

            {/* OBJETIVO */}
            {curso.objetivo && (
              <div style={card}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🎯 Objetivo del curso
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.65 }}>{curso.objetivo}</p>
              </div>
            )}

            {/* COMPETENCIAS */}
            {competencias.length > 0 && (
              <div style={card}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✨ Competencias que vas a desarrollar
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {competencias.map((comp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle size={14} color="#34d399" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{comp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MÓDULOS */}
            {totalModulos > 0 && (
              <div style={card}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📋 Contenido del curso
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {modulosNormales.map((m) => (
                    <div key={m.orden} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', width: 20, textAlign: 'right' as const, flexShrink: 0 }}>
                        {m.orden}
                      </span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', flex: 1 }}>{m.titulo}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{TIPO_LABEL[m.tipo] ?? m.tipo}</span>
                    </div>
                  ))}
                  {tieneDesafio && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', marginTop: 6 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>🏆</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', flex: 1 }}>Desafío final integrador</span>
                      <span style={{ fontSize: 10, color: 'rgba(251,191,36,0.7)', fontWeight: 600 }}>Evaluación</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* CTA lateral — sticky */}
          <div style={{ width: 200, position: 'sticky', top: 72, flexShrink: 0 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, border: '1px solid rgba(112,72,240,0.3)', padding: '20px 16px', boxShadow: '0 4px 20px rgba(75,51,204,0.15)' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 22, margin: 0, fontWeight: 800, color: 'rgba(255,255,255,0.95)' }}>Gratis</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>Sin costo, sin tarjeta</p>
              </div>
              <Link
                href="/register"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg,#4B33CC,#7048F0)', color: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 8, boxShadow: '0 4px 14px rgba(109,40,217,0.35)' }}
              >
                Empezar gratis <ChevronRight size={13} />
              </Link>
              <Link
                href="/login"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', borderRadius: 12, padding: '10px 14px', fontSize: 12, fontWeight: 500, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                Ya tengo cuenta
              </Link>

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    `${totalModulos} módulo${totalModulos !== 1 ? 's' : ''}`,
                    `${curso.duracion_min} min estimados`,
                    'Certificado al aprobar',
                    'En tu perfil público',
                  ].map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      <CheckCircle size={12} color="#34d399" style={{ flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA mobile */}
        <div style={{ marginTop: 20, background: 'linear-gradient(135deg,#4B33CC,#7048F0)', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 4px 20px rgba(75,51,204,0.35)' }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>¿Listo para empezar?</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Es gratis, sin tarjeta de crédito</p>
          </div>
          <Link
            href="/register"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0, border: '1px solid rgba(255,255,255,0.25)' }}
          >
            Empezar <ChevronRight size={13} />
          </Link>
        </div>

      </main>

      <footer style={{ textAlign: 'center', padding: '16px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
        <Link href="/" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Oportunai</Link>
        {' '}· Capacitaciones gratuitas para el mercado laboral
      </footer>
    </div>
  );
}

export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  ArrowLeft, Clock, Award, BookOpen,
  CheckCircle, Sparkles, ChevronRight, Star,
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

  const totalModulos   = curso.modulos.length;
  const modulosNormales = curso.modulos.filter(m => !m.es_desafio_final);
  const tieneDesafio   = curso.modulos.some(m => m.es_desafio_final);
  const competencias   = Array.isArray(curso.competencias)
    ? (curso.competencias as string[])
    : [];

  // Conteo de aprobados (dato social proof)
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
    inicial:     'Inicial',
    intermedio:  'Intermedio',
    avanzado:    'Avanzado',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: '#5B3FE0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={13} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Oportunai</span>
          </Link>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
            <ArrowLeft size={13} /> Volver al inicio
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* HERO */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #ccfbf1', overflow: 'hidden', marginBottom: 24, boxShadow: '0 2px 16px rgba(10,148,133,0.07)' }}>
          <div style={{ height: 6, background: 'linear-gradient(90deg, #14b8a6, #0d9488)' }} />
          <div style={{ padding: '28px 28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ fontSize: 56, lineHeight: 1, flexShrink: 0 }}>{curso.icono ?? '🎓'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, background: '#f0fdf9', color: '#0A9485', border: '1px solid #ccfbf1', borderRadius: 20, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {curso.categoria}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#64748b', borderRadius: 20, padding: '3px 10px' }}>
                    {NIVEL_LABEL[curso.nivel] ?? curso.nivel}
                  </span>
                  {totalAprobados > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: '#fefce8', color: '#854d0e', border: '1px solid #fef08a', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={9} fill="currentColor" /> {totalAprobados} aprobaron
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.25 }}>
                  {curso.titulo}
                </h1>
                <p style={{ fontSize: 14, color: '#475569', margin: '10px 0 0', lineHeight: 1.65 }}>
                  {curso.descripcion}
                </p>
              </div>
            </div>

            {/* Métricas */}
            <div style={{ display: 'flex', gap: 20, marginTop: 22, paddingTop: 18, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Clock size={14} color="#0A9485" />
                <span style={{ fontSize: 13, color: '#475569' }}>
                  <strong style={{ color: '#0f172a' }}>{curso.duracion_min} min</strong> estimados
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <BookOpen size={14} color="#0A9485" />
                <span style={{ fontSize: 13, color: '#475569' }}>
                  <strong style={{ color: '#0f172a' }}>{modulosNormales.length}</strong> módulos{tieneDesafio ? ' + desafío final' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Award size={14} color="#0A9485" />
                <span style={{ fontSize: 13, color: '#475569' }}>
                  Certificado al aprobar
                </span>
              </div>
              {totalAprobados > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Users size={14} color="#0A9485" />
                  <span style={{ fontSize: 13, color: '#475569' }}>
                    <strong style={{ color: '#0f172a' }}>{totalAprobados}</strong> personas ya aprobaron
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>

            {/* OBJETIVO */}
            {curso.objetivo && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 22px', marginBottom: 18 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🎯 Objetivo del curso
                </h2>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.65 }}>{curso.objetivo}</p>
              </div>
            )}

            {/* COMPETENCIAS */}
            {competencias.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 22px', marginBottom: 18 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✨ Competencias que vas a desarrollar
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {competencias.map((comp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle size={15} color="#0A9485" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#334155' }}>{comp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MÓDULOS */}
            {totalModulos > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 22px', marginBottom: 18 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📋 Contenido del curso
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {modulosNormales.map((m) => (
                    <div key={m.orden} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 10, background: '#f8fafc' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', width: 20, textAlign: 'right', flexShrink: 0 }}>
                        {m.orden}
                      </span>
                      <span style={{ fontSize: 13, color: '#334155', flex: 1 }}>{m.titulo}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{TIPO_LABEL[m.tipo] ?? m.tipo}</span>
                    </div>
                  ))}
                  {tieneDesafio && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', marginTop: 6 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>🏆</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e', flex: 1 }}>Desafío final integrador</span>
                      <span style={{ fontSize: 10, color: '#b45309', fontWeight: 600 }}>Evaluación</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* CTA lateral — sticky */}
          <div style={{ width: 220, position: 'sticky', top: 72, flexShrink: 0 }}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #ccfbf1', padding: '22px 18px', boxShadow: '0 4px 20px rgba(10,148,133,0.10)' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 22, margin: 0, fontWeight: 800, color: '#0f172a' }}>Gratis</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Sin costo, sin tarjeta</p>
              </div>
              <Link
                href="/register"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: '#0d9488', color: '#fff', borderRadius: 12,
                  padding: '13px 16px', fontSize: 14, fontWeight: 700,
                  textDecoration: 'none', marginBottom: 10,
                }}
              >
                Empezar gratis <ChevronRight size={15} />
              </Link>
              <Link
                href="/login"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#f8fafc', color: '#475569', borderRadius: 12,
                  padding: '11px 16px', fontSize: 13, fontWeight: 500,
                  textDecoration: 'none', border: '1px solid #e2e8f0',
                }}
              >
                Ya tengo cuenta
              </Link>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    `${totalModulos} módulo${totalModulos !== 1 ? 's' : ''}`,
                    `${curso.duracion_min} min estimados`,
                    'Certificado al aprobar',
                    'En tu perfil público',
                  ].map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#475569' }}>
                      <CheckCircle size={12} color="#0A9485" style={{ flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA mobile (solo visible en mobile) */}
        <div style={{ marginTop: 24, background: '#0d9488', borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>¿Listo para empezar?</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Es gratis, sin tarjeta de crédito</p>
          </div>
          <Link
            href="/register"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#0d9488', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}
          >
            Empezar <ChevronRight size={13} />
          </Link>
        </div>

      </main>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '16px', fontSize: 12, color: '#94a3b8' }}>
        <Link href="/" style={{ color: '#5B3FE0', textDecoration: 'none', fontWeight: 600 }}>Oportunai</Link>
        {' '}· Capacitaciones gratuitas para el mercado laboral
      </footer>
    </div>
  );
}

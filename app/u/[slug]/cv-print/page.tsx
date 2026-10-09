export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { CvDatosInput } from '@/lib/cv-generator';
import PrintTrigger from './PrintTrigger';

interface Props { params: { slug: string } }

export default async function CvPrintPage({ params }: Props) {
  const usuario = await prisma.usuario.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      nombre_completo: true,
      email: true,
      telefono: true,
      cv_datos: true,
      pagado: true,
    },
  });
  if (!usuario) notFound();

  // Check if the current session owns this CV and has paid
  const session = await getSession();
  const isOwner = session?.userId === usuario.id;
  if (isOwner && !usuario.pagado) {
    return (
      <div style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', padding: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1B3A6B' }}>Necesitás el plan premium</h1>
        <p style={{ color: '#475569', maxWidth: '400px' }}>
          La vista previa e impresión de tu CV en PDF es una función del plan premium. Desbloqueá todas las funciones con un único pago.
        </p>
        <a href="/dashboard" style={{ background: '#1B3A6B', color: '#fff', padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          Ir al dashboard para desbloquear
        </a>
      </div>
    );
  }

  const cv = (usuario.cv_datos as CvDatosInput) ?? {};
  const primerCargo = cv.experiencia?.[0]?.cargo ?? cv.area_laboral ?? null;

  const contactParts: string[] = [];
  if (usuario.email)    contactParts.push(usuario.email);
  if (usuario.telefono) contactParts.push(usuario.telefono);
  if (cv.localidad)     contactParts.push(cv.localidad);

  const infoParts: string[] = [];
  if (cv.nivel_estudios) infoParts.push(cv.nivel_estudios);
  if (cv.disponibilidad) infoParts.push(`Disponibilidad: ${cv.disponibilidad}`);

  return (
    <>
      <PrintTrigger />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; color: #1E293B; background: #fff; }
        .page { max-width: 780px; margin: 0 auto; padding: 28mm 22mm; }

        /* Print preview toolbar */
        .toolbar { display: flex; align-items: center; justify-content: space-between; background: #1B3A6B; color: #fff; padding: 12px 24px; gap: 12px; }
        .toolbar h1 { font-size: 14px; font-weight: 600; }
        .toolbar button { background: #fff; color: #1B3A6B; border: none; border-radius: 8px; padding: 8px 20px; font-size: 13px; font-weight: 700; cursor: pointer; }

        /* CV styles */
        .cv-name { font-size: 26pt; font-weight: 700; color: #0F172A; text-align: center; margin-bottom: 4px; }
        .cv-title { font-size: 13pt; color: #334155; text-align: center; margin-bottom: 10px; }
        .cv-divider { border: none; border-top: 2px solid #1B3A6B; margin: 8px 0; }
        .cv-contact { font-size: 9.5pt; color: #475569; text-align: center; margin-bottom: 4px; }
        .cv-info { font-size: 9pt; color: #94A3B8; font-style: italic; text-align: center; margin-bottom: 20px; }

        .section-heading { font-size: 10.5pt; font-weight: 700; color: #1B3A6B; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px; border-bottom: 1.5px solid #CBD5E1; margin-top: 18px; margin-bottom: 8px; }

        .exp-cargo { font-size: 10.5pt; font-weight: 700; color: #1E293B; }
        .exp-empresa { font-size: 10pt; color: #334155; }
        .exp-periodo { font-size: 9.5pt; color: #94A3B8; font-style: italic; margin: 2px 0 5px; }
        .exp-bullet { font-size: 10pt; color: #1E293B; padding-left: 14px; position: relative; margin-bottom: 3px; }
        .exp-bullet::before { content: '•'; position: absolute; left: 2px; color: #334155; }

        .edu-titulo { font-size: 10.5pt; font-weight: 700; color: #1E293B; }
        .edu-inst { font-size: 10pt; color: #334155; }
        .edu-periodo { font-size: 9.5pt; color: #94A3B8; font-style: italic; }

        .skill-item { font-size: 10pt; color: #1E293B; padding-left: 14px; position: relative; margin-bottom: 3px; }
        .skill-item::before { content: '•'; position: absolute; left: 2px; }

        .block { margin-bottom: 4px; }

        @media print {
          .toolbar { display: none !important; }
          .page { padding: 15mm 15mm; max-width: 100%; }
          @page { margin: 10mm 10mm; size: A4; }
        }
      `}</style>

      {/* Print toolbar — hidden in print */}
      <div className="toolbar">
        <h1>CV de {usuario.nombre_completo}</h1>
        <button onClick={undefined} id="print-btn" type="button">
          🖨️ Guardar como PDF
        </button>
      </div>

      <div className="page">
        {/* Name */}
        <div className="cv-name">{usuario.nombre_completo}</div>

        {/* Title */}
        {primerCargo && <div className="cv-title">{primerCargo}</div>}

        {/* Divider */}
        <hr className="cv-divider" />

        {/* Contact */}
        {contactParts.length > 0 && (
          <div className="cv-contact">{contactParts.join('   ·   ')}</div>
        )}

        {/* Info */}
        {infoParts.length > 0 && (
          <div className="cv-info">{infoParts.join('   ·   ')}</div>
        )}

        {/* Perfil profesional */}
        {cv.resumen && (
          <>
            <div className="section-heading">Perfil profesional</div>
            <p className="block" style={{ fontSize: '10pt', lineHeight: 1.5 }}>{cv.resumen}</p>
          </>
        )}

        {/* Experiencia */}
        {(cv.experiencia?.length ?? 0) > 0 && (
          <>
            <div className="section-heading">Experiencia laboral</div>
            {cv.experiencia!.map((exp, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div>
                  <span className="exp-cargo">{exp.cargo}</span>
                  <span className="exp-empresa">  ·  {exp.empresa}</span>
                </div>
                {exp.periodo && <div className="exp-periodo">{exp.periodo}</div>}
                {exp.descripcion && (() => {
                  const lines = exp.descripcion.split(/\n|•|-/).map((l: string) => l.trim()).filter(Boolean);
                  return lines.length > 1
                    ? lines.map((l: string, j: number) => <div key={j} className="exp-bullet">{l}</div>)
                    : <div className="exp-bullet">{exp.descripcion.trim()}</div>;
                })()}
              </div>
            ))}
          </>
        )}

        {/* Educación */}
        {((cv.educacion?.length ?? 0) > 0 || cv.nivel_estudios) && (
          <>
            <div className="section-heading">Educación</div>
            {cv.educacion?.map((edu, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div className="edu-titulo">{edu.titulo}</div>
                <div>
                  <span className="edu-inst">{edu.institucion}</span>
                  {edu.periodo && <span className="edu-periodo">   ·   {edu.periodo}</span>}
                </div>
              </div>
            ))}
            {!cv.educacion?.length && cv.nivel_estudios && (
              <div className="edu-titulo">{cv.nivel_estudios}</div>
            )}
          </>
        )}

        {/* Habilidades */}
        {(cv.habilidades?.length ?? 0) > 0 && (
          <>
            <div className="section-heading">Habilidades</div>
            {cv.habilidades!.map((h, i) => <div key={i} className="skill-item">{h}</div>)}
          </>
        )}

        {/* Herramientas digitales */}
        {(cv.herramientas_digitales?.length ?? 0) > 0 && (
          <>
            <div className="section-heading">Herramientas digitales</div>
            {cv.herramientas_digitales!.map((h, i) => <div key={i} className="skill-item">{h}</div>)}
          </>
        )}

        {/* Idiomas */}
        {(cv.idiomas?.length ?? 0) > 0 && (
          <>
            <div className="section-heading">Idiomas</div>
            {cv.idiomas!.map((id, i) => <div key={i} className="skill-item">{id}</div>)}
          </>
        )}

        <div style={{ marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
          <p style={{ fontSize: '8pt', color: '#CBD5E1', textAlign: 'center' }}>
            CV generado por Oportunai · oportunai.korai.lat
          </p>
        </div>
      </div>
    </>
  );
}

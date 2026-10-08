/**
 * Generador de CV en formato DOCX optimizado para ATS.
 * Usado por /api/cv/download (candidato autenticado) y
 * /api/cv/public/[slug] (empleador desde perfil público).
 */
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, LevelFormat, convertInchesToTwip,
} from 'docx';

// ── Paleta profesional ──────────────────────────────────────────────
const C = {
  name:    '0F172A',  // slate-950: nombre principal
  title:   '334155',  // slate-700: cargo/área
  contact: '475569',  // slate-600: datos de contacto
  date:    '94A3B8',  // slate-400: fechas y secundario
  heading: '1B3A6B',  // navy oscuro: encabezados de sección
  border:  'CBD5E1',  // slate-300: línea divisora
  body:    '1E293B',  // slate-800: texto del cuerpo
};

// ── Helpers ─────────────────────────────────────────────────────────
function sectionHeading(text: string) {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 21, font: 'Calibri', color: C.heading })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 4 } },
  });
}

function bodyPara(runs: TextRun[], spacingAfter = 60) {
  return new Paragraph({ children: runs, spacing: { after: spacingAfter } });
}

function bullet(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: C.body })],
    bullet: { level: 0 },
    spacing: { after: 40 },
  });
}

function spacer(pt = 60) {
  return new Paragraph({ text: '', spacing: { after: pt } });
}

// ── Interfaces ───────────────────────────────────────────────────────
export interface Experiencia {
  cargo:       string;
  empresa:     string;
  periodo:     string;
  descripcion?: string;
}
export interface Educacion {
  titulo:       string;
  institucion:  string;
  periodo?:     string;
}
export interface CvDatosInput {
  resumen?:              string;
  nivel_estudios?:       string;
  disponibilidad?:       string;
  localidad?:            string;
  area_laboral?:         string;
  experiencia?:          Experiencia[];
  educacion?:            Educacion[];
  habilidades?:          string[];
  herramientas_digitales?: string[];
  idiomas?:              string[];
}
export interface UsuarioInput {
  nombre_completo: string;
  email:           string;
  telefono?:       string | null;
  cv_datos?:       CvDatosInput | null;
}

// ── Generador principal ──────────────────────────────────────────────
export async function buildCvBuffer(usuario: UsuarioInput): Promise<Buffer> {
  const cv = usuario.cv_datos ?? {};
  const primerCargo = cv.experiencia?.[0]?.cargo ?? cv.area_laboral ?? null;
  const children: Paragraph[] = [];

  // ── Nombre ──────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [new TextRun({ text: usuario.nombre_completo, bold: true, size: 52, font: 'Calibri', color: C.name })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    })
  );

  // ── Cargo / área profesional ─────────────────────────────────────
  if (primerCargo) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: primerCargo, size: 26, font: 'Calibri', color: C.title })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      })
    );
  }

  // ── Línea divisora bajo el nombre ────────────────────────────────
  children.push(
    new Paragraph({
      text: '',
      spacing: { after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.heading, space: 0 } },
    })
  );

  // ── Contacto ─────────────────────────────────────────────────────
  const contactParts: string[] = [];
  if (usuario.email)    contactParts.push(usuario.email);
  if (usuario.telefono) contactParts.push(usuario.telefono);
  if (cv.localidad)     contactParts.push(cv.localidad);

  if (contactParts.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join('   ·   '), size: 20, font: 'Calibri', color: C.contact })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      })
    );
  }

  // ── Info adicional: estudios y disponibilidad ─────────────────────
  const infoParts: string[] = [];
  if (cv.nivel_estudios) infoParts.push(cv.nivel_estudios);
  if (cv.disponibilidad) infoParts.push(`Disponibilidad: ${cv.disponibilidad}`);

  if (infoParts.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: infoParts.join('   ·   '), size: 19, font: 'Calibri', color: C.date, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      })
    );
  }

  // ── Perfil profesional ────────────────────────────────────────────
  if (cv.resumen) {
    children.push(sectionHeading('Perfil profesional'));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: cv.resumen, size: 22, font: 'Calibri', color: C.body })],
        spacing: { after: 60 },
      })
    );
  }

  // ── Experiencia laboral ───────────────────────────────────────────
  if (cv.experiencia?.length) {
    children.push(sectionHeading('Experiencia laboral'));
    for (const exp of cv.experiencia) {
      // Cargo (bold) — Empresa
      children.push(
        bodyPara([
          new TextRun({ text: exp.cargo, bold: true, size: 23, font: 'Calibri', color: C.body }),
          new TextRun({ text: `  ·  ${exp.empresa}`, size: 22, font: 'Calibri', color: C.title }),
        ], 20)
      );
      // Período
      if (exp.periodo) {
        children.push(
          bodyPara([new TextRun({ text: exp.periodo, italics: true, size: 20, font: 'Calibri', color: C.date })], 50)
        );
      }
      // Descripción como bullets
      if (exp.descripcion) {
        const lines = exp.descripcion.split(/\n|•|-/).map(l => l.trim()).filter(Boolean);
        if (lines.length > 1) {
          lines.forEach(line => children.push(bullet(line)));
        } else {
          children.push(bullet(exp.descripcion.trim()));
        }
      }
      children.push(spacer(80));
    }
  }

  // ── Educación ─────────────────────────────────────────────────────
  if (cv.educacion?.length || cv.nivel_estudios) {
    children.push(sectionHeading('Educación'));
    if (cv.educacion?.length) {
      for (const edu of cv.educacion) {
        children.push(
          bodyPara([new TextRun({ text: edu.titulo, bold: true, size: 22, font: 'Calibri', color: C.body })], 20)
        );
        children.push(
          bodyPara([
            new TextRun({ text: edu.institucion, size: 22, font: 'Calibri', color: C.title }),
            ...(edu.periodo ? [new TextRun({ text: `   ·   ${edu.periodo}`, size: 20, font: 'Calibri', color: C.date, italics: true })] : []),
          ], 60)
        );
      }
    } else if (cv.nivel_estudios) {
      children.push(bodyPara([new TextRun({ text: cv.nivel_estudios, bold: true, size: 22, font: 'Calibri', color: C.body })], 60));
    }
  }

  // ── Habilidades ───────────────────────────────────────────────────
  if (cv.habilidades?.length) {
    children.push(sectionHeading('Habilidades'));
    cv.habilidades.forEach(h => children.push(bullet(h)));
  }

  // ── Herramientas digitales ────────────────────────────────────────
  if (cv.herramientas_digitales?.length) {
    children.push(sectionHeading('Herramientas digitales'));
    cv.herramientas_digitales.forEach(h => children.push(bullet(h)));
  }

  // ── Idiomas ───────────────────────────────────────────────────────
  if (cv.idiomas?.length) {
    children.push(sectionHeading('Idiomas'));
    cv.idiomas.forEach(i => children.push(bullet(i)));
  }

  // ── Documento ─────────────────────────────────────────────────────
  const doc = new Document({
    creator:     'Oportunai',
    title:       `CV — ${usuario.nombre_completo}`,
    description: 'CV generado por Oportunai · oportunai.korai.lat',
    numbering: {
      config: [{
        reference: 'bullet-list',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.2) } },
            run: { font: 'Symbol', size: 22 },
          },
        }],
      }],
    },
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: C.body },
        },
      },
      paragraphStyles: [{
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        run: { font: 'Calibri', size: 21, bold: true, color: C.heading },
        paragraph: { spacing: { before: 300, after: 100 } },
      }],
    },
    sections: [{
      properties: {
        page: { margin: { top: convertInchesToTwip(0.75), bottom: convertInchesToTwip(0.75), left: convertInchesToTwip(0.8), right: convertInchesToTwip(0.8) } },
      },
      children,
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export function cvFilename(nombre: string, prefix = 'cv') {
  const slug = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${prefix}-${slug}.docx`;
}

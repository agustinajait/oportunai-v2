import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, LevelFormat, convertInchesToTwip,
} from 'docx';

interface Experiencia { cargo: string; empresa: string; periodo: string; descripcion?: string }
interface Educacion  { titulo: string; institucion: string; periodo?: string }
interface CvDatos {
  resumen?: string;
  nivel_estudios?: string;
  disponibilidad?: string;
  localidad?: string;
  experiencia?: Experiencia[];
  educacion?: Educacion[];
  habilidades?: string[];
  idiomas?: string[];
}

function sectionHeading(text: string) {
  return new Paragraph({
    text: text.toUpperCase(),
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '5B3FE0', space: 4 } },
  });
}

function bullet(text: string) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 40 },
  });
}

function para(runs: TextRun[], spacingAfter = 60) {
  return new Paragraph({ children: runs, spacing: { after: spacingAfter } });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: {
      nombre_completo: true,
      email: true,
      telefono: true,
      fecha_nacimiento: true,
      cv_datos: true,
    },
  });

  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const cv = usuario.cv_datos as CvDatos | null;
  const primerCargo = cv?.experiencia?.[0]?.cargo ?? null;

  const children: Paragraph[] = [];

  // ── Nombre ──
  children.push(
    new Paragraph({
      children: [new TextRun({ text: usuario.nombre_completo, bold: true, size: 56, font: 'Calibri', color: '111118' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    })
  );

  // ── Título/ocupación ──
  if (primerCargo) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: primerCargo, size: 28, font: 'Calibri', color: '555566' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      })
    );
  }

  // ── Contacto ──
  const contactParts: string[] = [];
  if (usuario.email) contactParts.push(`Email: ${usuario.email}`);
  if (usuario.telefono) contactParts.push(`Teléfono: ${usuario.telefono}`);
  if (cv?.localidad) contactParts.push(`Localidad: ${cv.localidad}`);
  if (contactParts.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join('  |  '), size: 20, font: 'Calibri', color: '444455' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      })
    );
  }

  const infoParts: string[] = [];
  if (cv?.nivel_estudios) infoParts.push(cv.nivel_estudios);
  if (cv?.disponibilidad) infoParts.push(cv.disponibilidad);
  if (infoParts.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: infoParts.join('  |  '), size: 20, font: 'Calibri', color: '777788' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  // ── Perfil profesional ──
  if (cv?.resumen) {
    children.push(sectionHeading('Perfil profesional'));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: cv.resumen, size: 22, font: 'Calibri' })],
        spacing: { after: 60 },
      })
    );
  }

  // ── Experiencia laboral ──
  if (cv?.experiencia?.length) {
    children.push(sectionHeading('Experiencia laboral'));
    for (const exp of cv.experiencia) {
      children.push(
        para([
          new TextRun({ text: exp.cargo, bold: true, size: 24, font: 'Calibri' }),
          new TextRun({ text: ` — ${exp.empresa}`, size: 24, font: 'Calibri' }),
        ], 20)
      );
      if (exp.periodo) {
        children.push(
          para([new TextRun({ text: exp.periodo, italics: true, size: 20, font: 'Calibri', color: '888899' })], 40)
        );
      }
      if (exp.descripcion) {
        const lines = exp.descripcion.split(/\n|•|-/).map(l => l.trim()).filter(Boolean);
        if (lines.length > 1) {
          lines.forEach(line => children.push(bullet(line)));
        } else {
          children.push(bullet(exp.descripcion.trim()));
        }
      }
      children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
    }
  }

  // ── Educación ──
  if (cv?.educacion?.length || cv?.nivel_estudios) {
    children.push(sectionHeading('Educación'));
    if (cv?.educacion?.length) {
      for (const edu of cv.educacion) {
        children.push(
          para([
            new TextRun({ text: edu.titulo, bold: true, size: 22, font: 'Calibri' }),
          ], 20)
        );
        children.push(
          para([
            new TextRun({ text: edu.institucion, size: 22, font: 'Calibri' }),
            ...(edu.periodo ? [new TextRun({ text: `  ·  ${edu.periodo}`, size: 20, font: 'Calibri', color: '888899' })] : []),
          ], 60)
        );
      }
    } else if (cv?.nivel_estudios) {
      children.push(
        para([new TextRun({ text: cv.nivel_estudios, bold: true, size: 22, font: 'Calibri' })], 60)
      );
    }
  }

  // ── Habilidades ──
  if (cv?.habilidades?.length) {
    children.push(sectionHeading('Habilidades'));
    cv.habilidades.forEach(h => children.push(bullet(h)));
  }

  // ── Idiomas ──
  if (cv?.idiomas?.length) {
    children.push(sectionHeading('Idiomas'));
    cv.idiomas.forEach(i => children.push(bullet(i)));
  }

  const doc = new Document({
    creator: 'Oportunai',
    title: `CV de ${usuario.nombre_completo}`,
    numbering: {
      config: [{
        reference: 'bullet-list',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.25) } },
            run: { font: 'Calibri', size: 22 },
          },
        }],
      }],
    },
    styles: {
      paragraphStyles: [{
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        run: { size: 24, bold: true, color: '5B3FE0', font: 'Calibri' },
      }],
    },
    sections: [{
      properties: {
        page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } },
      },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const slug = usuario.nombre_completo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="cv-${slug}.docx"`,
    },
  });
}

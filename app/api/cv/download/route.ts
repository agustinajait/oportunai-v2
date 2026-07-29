import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
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

function heading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '5B3FE0', space: 4 } },
  });
}

function body(text: string, bold = false) {
  return new Paragraph({
    children: [new TextRun({ text, bold, size: 22, font: 'Calibri' })],
    spacing: { after: 60 },
  });
}

function label(text: string) {
  return new TextRun({ text, bold: true, size: 22, font: 'Calibri' });
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

  const children: Paragraph[] = [];

  // ── Nombre ──
  children.push(
    new Paragraph({
      children: [new TextRun({ text: usuario.nombre_completo, bold: true, size: 52, font: 'Calibri', color: '111118' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    })
  );

  // ── Datos de contacto ──
  const contactParts: string[] = [];
  if (usuario.telefono) contactParts.push(usuario.telefono);
  if (usuario.email) contactParts.push(usuario.email);
  if (cv?.localidad) contactParts.push(cv.localidad);
  if (contactParts.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join('  ·  '), size: 20, font: 'Calibri', color: '555566' })],
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
        children: [new TextRun({ text: infoParts.join('  ·  '), size: 20, font: 'Calibri', color: '555566' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  // ── Resumen ──
  if (cv?.resumen) {
    children.push(heading('Resumen profesional'));
    children.push(body(cv.resumen));
  }

  // ── Experiencia ──
  if (cv?.experiencia?.length) {
    children.push(heading('Experiencia laboral'));
    for (const exp of cv.experiencia) {
      children.push(
        new Paragraph({
          children: [
            label(`${exp.cargo}`),
            new TextRun({ text: ` en ${exp.empresa}`, size: 22, font: 'Calibri' }),
            ...(exp.periodo ? [new TextRun({ text: `  ·  ${exp.periodo}`, size: 20, font: 'Calibri', color: '888899' })] : []),
          ],
          spacing: { after: 40 },
        })
      );
      if (exp.descripcion) children.push(body(exp.descripcion));
      children.push(new Paragraph({ text: '', spacing: { after: 80 } }));
    }
  }

  // ── Educación ──
  if (cv?.educacion?.length) {
    children.push(heading('Educación'));
    for (const edu of cv.educacion) {
      children.push(
        new Paragraph({
          children: [
            label(edu.titulo),
            new TextRun({ text: ` — ${edu.institucion}`, size: 22, font: 'Calibri' }),
            ...(edu.periodo ? [new TextRun({ text: `  ·  ${edu.periodo}`, size: 20, font: 'Calibri', color: '888899' })] : []),
          ],
          spacing: { after: 80 },
        })
      );
    }
  }

  // ── Habilidades ──
  if (cv?.habilidades?.length) {
    children.push(heading('Habilidades'));
    children.push(body(cv.habilidades.join('  ·  ')));
  }

  // ── Idiomas ──
  if (cv?.idiomas?.length) {
    children.push(heading('Idiomas'));
    children.push(body(cv.idiomas.join('  ·  ')));
  }

  const doc = new Document({
    creator: 'Oportunai',
    title: `CV de ${usuario.nombre_completo}`,
    description: 'CV generado por Oportunai',
    styles: {
      paragraphStyles: [
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          run: { size: 24, bold: true, color: '5B3FE0', font: 'Calibri' },
        },
      ],
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

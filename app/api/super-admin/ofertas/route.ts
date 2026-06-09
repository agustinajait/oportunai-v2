export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const ofertas = await prisma.oferta.findMany({
    orderBy: { created_at: 'desc' },
    take: 50,
    include: {
      empresa: { select: { id: true, nombre: true } },
      _count: { select: { postulaciones: true } },
    },
  });

  return NextResponse.json({ ofertas });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      empresa_id,
      empresa_nombre,
      titulo,
      descripcion,
      requisitos,
      area,
      modalidad = 'presencial',
      ciudad,
    } = body;

    if (!titulo?.trim() || !descripcion?.trim()) {
      return NextResponse.json({ error: 'Título y descripción requeridos' }, { status: 400 });
    }

    let empresaId = empresa_id;

    if (!empresaId) {
      if (!empresa_nombre?.trim()) {
        return NextResponse.json({ error: 'empresa_id o empresa_nombre requerido' }, { status: 400 });
      }

      // Buscar empresa por nombre (case-insensitive) o crear nueva
      const existing = await prisma.empresa.findFirst({
        where: { nombre: { equals: empresa_nombre.trim(), mode: 'insensitive' } },
      });

      if (existing) {
        empresaId = existing.id;
      } else {
        let slug = slugify(empresa_nombre.trim());
        // Asegurar slug único
        const count = await prisma.empresa.count({ where: { slug: { startsWith: slug } } });
        if (count > 0) slug = `${slug}-${count}`;

        const nueva = await prisma.empresa.create({
          data: { nombre: empresa_nombre.trim(), slug },
        });
        empresaId = nueva.id;
      }
    }

    const oferta = await prisma.oferta.create({
      data: {
        empresa_id: empresaId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        requisitos: requisitos?.trim() || null,
        area: area?.trim() || null,
        modalidad,
        ciudad: ciudad?.trim() || null,
        estado: 'activa',
      },
      include: {
        empresa: { select: { id: true, nombre: true } },
        _count: { select: { postulaciones: true } },
      },
    });

    return NextResponse.json({ oferta });
  } catch (err: any) {
    console.error('[super-admin/ofertas POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id, estado } = await req.json();
  const oferta = await prisma.oferta.update({
    where: { id },
    data: { estado },
    include: { empresa: { select: { id: true, nombre: true } }, _count: { select: { postulaciones: true } } },
  });
  return NextResponse.json({ oferta });
}

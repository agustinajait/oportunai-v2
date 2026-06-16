export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

function formatFecha(fecha: Date) {
  return fecha.toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const miembro = await prisma.empresaMiembro.findFirst({ where: { usuario_id: session.userId } });
    if (!miembro) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const citas = await prisma.cita.findMany({
      where: { empresa_id: miembro.empresa_id },
      include: {
        oferta: { select: { titulo: true } },
        invitados: {
          include: {
            postulacion: { include: { usuario: { select: { nombre_completo: true, telefono: true } } } },
          },
        },
      },
      orderBy: { fecha: 'asc' },
    });

    return NextResponse.json({ citas });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { postulacion_ids, fecha, modalidad, lugar, mensaje, oferta_id } = body;

    if (!Array.isArray(postulacion_ids) || postulacion_ids.length === 0) {
      return NextResponse.json({ error: 'Seleccioná al menos un candidato' }, { status: 400 });
    }
    if (!fecha || !lugar || !['presencial', 'virtual'].includes(modalidad)) {
      return NextResponse.json({ error: 'Faltan datos de la cita' }, { status: 400 });
    }

    const miembro = await prisma.empresaMiembro.findFirst({ where: { usuario_id: session.userId } });
    if (!miembro) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const empresa = await prisma.empresa.findUnique({ where: { id: miembro.empresa_id } });
    if (!empresa) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

    const postulaciones = await prisma.postulacion.findMany({
      where: { id: { in: postulacion_ids }, oferta: { empresa_id: miembro.empresa_id } },
      include: { usuario: { select: { id: true, nombre_completo: true, email: true, telefono: true } } },
    });

    if (postulaciones.length === 0) {
      return NextResponse.json({ error: 'Candidatos no encontrados' }, { status: 404 });
    }

    const fechaDate = new Date(fecha);

    const cita = await prisma.cita.create({
      data: {
        empresa_id: miembro.empresa_id,
        oferta_id: oferta_id ?? null,
        fecha: fechaDate,
        modalidad,
        lugar,
        mensaje: mensaje || null,
        grupal: postulaciones.length > 1,
        invitados: {
          create: postulaciones.map(p => ({ postulacion_id: p.id })),
        },
      },
    });

    const whatsappLinks: { candidato: string; telefono: string; url: string }[] = [];

    await Promise.all(postulaciones.map(async (p) => {
      const texto = `Hola ${p.usuario.nombre_completo.split(' ')[0]}! ${empresa.nombre} te invita a una entrevista${postulaciones.length > 1 ? ' grupal' : ''} el ${formatFecha(fechaDate)} (${modalidad === 'presencial' ? 'presencial' : 'virtual'}). ${modalidad === 'presencial' ? 'Lugar' : 'Link'}: ${lugar}.${mensaje ? ` ${mensaje}` : ''} Podés confirmar tu asistencia desde tu panel en Oportunai.`;

      const numero = p.usuario.telefono.replace(/\D/g, '');
      whatsappLinks.push({
        candidato: p.usuario.nombre_completo,
        telefono: p.usuario.telefono,
        url: `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`,
      });

      await sendEmail({
        to: p.usuario.email,
        subject: `Invitación a entrevista — ${empresa.nombre}`,
        html: `
          <p>Hola ${p.usuario.nombre_completo.split(' ')[0]},</p>
          <p><strong>${empresa.nombre}</strong> te invita a una entrevista${postulaciones.length > 1 ? ' grupal' : ''}.</p>
          <p><strong>Fecha:</strong> ${formatFecha(fechaDate)}<br/>
          <strong>Modalidad:</strong> ${modalidad === 'presencial' ? 'Presencial' : 'Virtual'}<br/>
          <strong>${modalidad === 'presencial' ? 'Lugar' : 'Link de la reunión'}:</strong> ${lugar}</p>
          ${mensaje ? `<p>${mensaje}</p>` : ''}
          <p>Ingresá a tu panel en Oportunai para confirmar tu asistencia.</p>
        `,
      }).catch(err => console.error('Error enviando email de cita:', err));
    }));

    return NextResponse.json({ ok: true, cita, whatsappLinks });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

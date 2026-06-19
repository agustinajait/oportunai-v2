export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const miembro = await prisma.empresaMiembro.findFirst({
      where: { usuario_id: session.userId },
    });
    if (!miembro) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 400 });
    }

    // Verify the offer belongs to this company
    const oferta = await prisma.oferta.findFirst({
      where: { id: params.id, empresa_id: miembro.empresa_id },
    });
    if (!oferta) {
      return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 });
    }

    const body = await req.json();
    const { titulo, descripcion, requisitos, area, modalidad, ciudad, mensaje_whatsapp, nombre_marca, logo_url, docs_requeridos, preguntas_videocv, estado } = body;

    const updated = await prisma.oferta.update({
      where: { id: params.id },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(descripcion !== undefined && { descripcion }),
        ...(requisitos !== undefined && { requisitos: requisitos || null }),
        ...(area !== undefined && { area: area || null }),
        ...(modalidad !== undefined && { modalidad }),
        ...(ciudad !== undefined && { ciudad: ciudad || null }),
        ...(mensaje_whatsapp !== undefined && { mensaje_whatsapp: mensaje_whatsapp || null }),
        ...(nombre_marca !== undefined && { nombre_marca: nombre_marca || null }),
        ...(logo_url !== undefined && { logo_url: logo_url || null }),
        ...(docs_requeridos !== undefined && { docs_requeridos }),
        ...(preguntas_videocv !== undefined && { preguntas_videocv }),
        ...(estado !== undefined && { estado }),
      },
    });

    return NextResponse.json({ ok: true, oferta: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

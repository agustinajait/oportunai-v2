export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getEmpresaId(userId: string) {
  const miembro = await prisma.empresaMiembro.findFirst({
    where: { usuario_id: userId, activo: true },
    select: { empresa_id: true },
  });
  return miembro?.empresa_id ?? null;
}

// POST /api/modulos/[id]/remito — empresa genera el remito del módulo completado
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'empleador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const empresa_id = await getEmpresaId(session.userId);
    if (!empresa_id) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

    const modulo = await prisma.moduloAsignado.findUnique({
      where: { id: params.id },
      include: {
        servicio: { select: { titulo: true } },
        usuario: { select: { nombre_completo: true, email: true, dni: true } },
        empresa: { select: { nombre: true } },
        evidencias: { orderBy: { item_index: 'asc' } },
        remito: true,
      },
    });

    if (!modulo || modulo.empresa_id !== empresa_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    if (modulo.estado !== 'completado' && modulo.estado !== 'aprobado') {
      return NextResponse.json({ error: 'El módulo debe estar completado o aprobado para generar remito' }, { status: 400 });
    }
    if (modulo.remito) {
      return NextResponse.json({ ok: true, remito: modulo.remito, yaExistia: true });
    }

    // Número de remito correlativo: REM-YYYYMMDD-XXXX
    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    const count = await prisma.remito.count();
    const numero_remito = `REM-${yyyy}${mm}${dd}-${String(count + 1).padStart(4, '0')}`;

    const remito = await prisma.remito.create({
      data: {
        modulo_id: params.id,
        numero_remito,
      },
    });

    // Actualizar el módulo a aprobado
    await prisma.moduloAsignado.update({
      where: { id: params.id },
      data: { estado: 'aprobado' },
    });

    return NextResponse.json({ ok: true, remito, modulo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// GET /api/modulos/[id]/remito — obtener datos del remito (candidato o empresa)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const modulo = await prisma.moduloAsignado.findUnique({
      where: { id: params.id },
      include: {
        servicio: { select: { titulo: true, frecuencia: true, protocolo: true } },
        usuario: { select: { id: true, nombre_completo: true, email: true, dni: true, direccion: true } },
        empresa: { select: { nombre: true, logo_url: true } },
        evidencias: { orderBy: { item_index: 'asc' } },
        remito: true,
      },
    });

    if (!modulo) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    // Solo puede ver el candidato asignado o un miembro de la empresa
    const esElCandidato = modulo.usuario_id === session.userId;
    let esEmpresa = false;
    if (session.role === 'empleador') {
      const empresa_id = await getEmpresaId(session.userId);
      esEmpresa = empresa_id === modulo.empresa_id;
    }

    if (!esElCandidato && !esEmpresa) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ modulo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

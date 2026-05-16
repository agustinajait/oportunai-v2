export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
// taller_id leÃ­do desde FormData â€” correcciÃ³n de bug del mÃ³dulo original

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB por fragmento

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const formData = await req.formData();
    const fragment    = formData.get('fragment')     as File | null;
    const moduloId    = formData.get('moduloId')     as string | null;
    const moduloNombre = formData.get('moduloNombre') as string | null;
    const orden       = formData.get('orden')        as string | null;
    const tipo        = formData.get('tipo')         as string | null;
    const duracion    = formData.get('duracion')     as string | null;
    // taller_id es opcional: presente solo en grabaciones de taller
    const taller_id   = formData.get('taller_id')   as string | null;

    if (!fragment || !moduloId || !orden || !tipo) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    if (!['video_cv', 'video_pitch'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo de video invÃ¡lido' }, { status: 400 });
    }
    if (fragment.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El fragmento supera el lÃ­mite de 100 MB' }, { status: 400 });
    }

    // Si viene taller_id, verificar que el usuario estÃ© asignado a ese taller
    if (taller_id) {
      const relacion = await prisma.tallerUsuario.findUnique({
        where: { usuario_id_taller_id: { usuario_id: session.userId, taller_id } },
      });
      if (!relacion) {
        return NextResponse.json({ error: 'No tenÃ©s acceso a ese taller' }, { status: 403 });
      }
    }

    const uploadDir = path.join(process.cwd(), 'public', 'fragments', session.userId);
    await mkdir(uploadDir, { recursive: true });

    const ext = fragment.name.split('.').pop() ?? 'webm';
    const filename = `${tipo}-orden${orden}-${moduloId}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await fragment.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const fileUrl = `/fragments/${session.userId}/${filename}`;

    const video = await prisma.video.create({
      data: {
        user_id:         session.userId,
        tipo:            tipo as 'video_cv' | 'video_pitch',
        video_url:       fileUrl,
        es_fragmento:    true,
        orden_fragmento: parseInt(orden),
        modulo_id:       moduloId,
        modulo_nombre:   moduloNombre ?? undefined,
        duracion_seg:    duracion ? parseInt(duracion) : undefined,
        taller_id:       taller_id ?? undefined,
      },
    });

    return NextResponse.json(
      { ok: true, videoId: video.id, fileUrl, orden: parseInt(orden) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[videos/upload]', err);
    return NextResponse.json({ error: 'Error al guardar el fragmento' }, { status: 500 });
  }
}


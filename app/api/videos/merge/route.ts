import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const body = await req.json();
    const { tipo, video_url, taller_id } = body;

    if (!tipo || !['video_cv', 'video_pitch'].includes(tipo)) {
      return NextResponse.json({ error: 'tipo inválido' }, { status: 400 });
    }

    if (!video_url) {
      return NextResponse.json({ error: 'video_url requerida' }, { status: 400 });
    }

    // Borrar video final anterior del mismo tipo
    await prisma.video.deleteMany({
      where: {
        user_id: session.userId,
        tipo: tipo as 'video_cv' | 'video_pitch',
        es_fragmento: false,
        taller_id: taller_id ?? null,
      },
    });

    // Guardar nuevo video final
    const videoFinal = await prisma.video.create({
      data: {
        user_id: session.userId,
        tipo: tipo as 'video_cv' | 'video_pitch',
        video_url,
        es_fragmento: false,
        taller_id: taller_id ?? undefined,
        modulo_nombre: `${tipo === 'video_cv' ? 'Video CV' : 'Video Pitch'} — Final`,
      },
    });

    return NextResponse.json({ ok: true, videoId: videoFinal.id, videoUrl: video_url });
  } catch (err: any) {
    console.error('[videos/merge]', err);
    return NextResponse.json({ error: err.message ?? 'Error al guardar el video' }, { status: 500 });
  }
}

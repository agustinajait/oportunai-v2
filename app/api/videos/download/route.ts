export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint — redirects to the Supabase public URL for the video.
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 });
    }

    const video = await prisma.video.findUnique({
      where: { id },
      select: { id: true, video_url: true, tipo: true, es_fragmento: true },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 });
    }
    if (video.es_fragmento) {
      return NextResponse.json({ error: 'Solo se pueden descargar videos finales' }, { status: 403 });
    }

    // Video is stored in Supabase — redirect to the public URL
    return NextResponse.redirect(video.video_url);
  } catch (err) {
    console.error('[videos/download]', err);
    return NextResponse.json({ error: 'Error al descargar el video' }, { status: 500 });
  }
}

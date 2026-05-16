export const dynamic = 'force-dynamic';
﻿export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import path from 'path';

// Public endpoint â€” no auth required so users can share direct download links.
// Only serves final (non-fragment) videos stored on disk.

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Falta el parÃ¡metro id' }, { status: 400 });
    }

    // Fetch video record â€” only final videos are downloadable
    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        video_url: true,
        tipo: true,
        es_fragmento: true,
        usuario: { select: { nombre_completo: true, slug: true } },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 });
    }
    if (video.es_fragmento) {
      return NextResponse.json({ error: 'Solo se pueden descargar videos finales' }, { status: 403 });
    }

    // Resolve absolute path on disk
    const absPath = path.join(process.cwd(), 'public', video.video_url.replace(/^\//, ''));
    if (!existsSync(absPath)) {
      return NextResponse.json({ error: 'Archivo no encontrado en el servidor' }, { status: 404 });
    }

    // Build a friendly filename: "video-cv-maria-garcia.mp4"
    const tipoLabel = video.tipo === 'video_cv' ? 'video-cv' : 'video-pitch';
    const nombreSlug = video.usuario.slug;
    const filename   = `${tipoLabel}-${nombreSlug}.mp4`;

    const fileBuffer = await readFile(absPath);
    const fileSize   = statSync(absPath).size;

    // Support Range requests so mobile browsers can seek before full download
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-');
      const start = parseInt(startStr, 10);
      const end   = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunk = fileBuffer.subarray(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Type':        'video/mp4',
          'Content-Range':       `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges':       'bytes',
          'Content-Length':      String(chunk.length),
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control':       'public, max-age=3600',
        },
      });
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(fileSize),
        'Accept-Ranges':       'bytes',
        'Cache-Control':       'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[videos/download]', err);
    return NextResponse.json({ error: 'Error al descargar el video' }, { status: 500 });
  }
}


export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ALLOWED_DIRS = ['uploads']; // only serve files from /public/uploads/
const ALLOWED_EXT  = ['.pdf', '.doc', '.docx'];

export async function GET(req: NextRequest) {
  try {
    const fileUrl = req.nextUrl.searchParams.get('url');
    if (!fileUrl) {
      return NextResponse.json({ error: 'Falta parámetro url' }, { status: 400 });
    }

    // Security: only serve files from allowed directories
    const normalized = decodeURIComponent(fileUrl).replace(/^\//, '');
    const firstSegment = normalized.split('/')[0];
    if (!ALLOWED_DIRS.includes(firstSegment)) {
      return NextResponse.json({ error: 'Ruta no permitida' }, { status: 403 });
    }

    // Security: path traversal prevention
    const absPath = path.join(process.cwd(), 'public', normalized);
    const publicDir = path.join(process.cwd(), 'public');
    if (!absPath.startsWith(publicDir)) {
      return NextResponse.json({ error: 'Ruta no permitida' }, { status: 403 });
    }

    // Only allow CV file extensions
    const ext = path.extname(absPath).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 403 });
    }

    if (!existsSync(absPath)) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    const contentTypeMap: Record<string, string> = {
      '.pdf':  'application/pdf',
      '.doc':  'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const fileBuffer = await readFile(absPath);
    const filename   = path.basename(absPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type':        contentTypeMap[ext] ?? 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(fileBuffer.length),
        'Cache-Control':       'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[files/download]', err);
    return NextResponse.json({ error: 'Error al descargar el archivo' }, { status: 500 });
  }
}


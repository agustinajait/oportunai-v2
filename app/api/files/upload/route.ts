export const dynamic = 'force-dynamic';
﻿export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No se recibiÃ³ archivo' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Formato no permitido. Solo PDF o Word.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo supera los 5 MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'pdf';
    const filename = `${session.userId}-${Date.now()}.${ext}`;

    // En producciÃ³n esto se reemplaza por S3
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const fileUrl = `/uploads/${filename}`;
    const fileType = ext;

    // Guardar en DB
    const archivo = await prisma.archivo.create({
      data: {
        user_id: session.userId,
        file_url: fileUrl,
        file_type: fileType,
      },
    });

    return NextResponse.json(archivo, { status: 201 });
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
  }
}


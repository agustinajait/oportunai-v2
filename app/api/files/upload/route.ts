export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No se recibio archivo' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Formato no permitido. Solo PDF o Word.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo supera los 5 MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'pdf';
    const filename = `archivos/${session.userId}-${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from('videos')
      .upload(filename, buffer, { contentType: file.type, upsert: true });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filename);

    const archivo = await prisma.archivo.create({
      data: {
        user_id: session.userId,
        file_url: urlData.publicUrl,
        file_type: ext,
      },
    });

    return NextResponse.json(archivo, { status: 201 });
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
  }
}


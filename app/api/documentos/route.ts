export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TIPOS_VALIDOS = ['dni', 'antecedentes_penales', 'manipulacion_alimentos', 'libreta_sanitaria', 'otro'];

// GET - obtener documentos del usuario
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const documentos = await prisma.documento.findMany({
    where: { user_id: session.userId },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ documentos });
}

// POST - subir un documento
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const tipo = formData.get('tipo') as string;

  if (!file || !tipo) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  if (!TIPOS_VALIDOS.includes(tipo)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const ext = file.name.split('.').pop() || 'pdf';
  const filename = `documentos/${session.userId}/${tipo}.${ext}`;

  const { error } = await supabase.storage
    .from('videos')
    .upload(filename, buffer, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filename);

  const documento = await prisma.documento.upsert({
    where: { user_id_tipo: { user_id: session.userId, tipo: tipo as any } },
    create: { user_id: session.userId, tipo: tipo as any, file_url: urlData.publicUrl },
    update: { file_url: urlData.publicUrl },
  });

  return NextResponse.json({ ok: true, documento });
}

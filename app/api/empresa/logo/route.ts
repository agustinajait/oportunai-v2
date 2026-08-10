export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'empleador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const miembro = await prisma.empresaMiembro.findFirst({
    where: { usuario_id: session.userId },
  });
  if (!miembro) return NextResponse.json({ error: 'Sin empresa' }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `logos/${miembro.empresa_id}.${ext}`;

  const { error } = await getSupabase().storage
    .from('videos')
    .upload(filename, buffer, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = getSupabase().storage.from('videos').getPublicUrl(filename);

  await prisma.empresa.update({
    where: { id: miembro.empresa_id },
    data: { logo_url: urlData.publicUrl },
  });

  return NextResponse.json({ ok: true, logo_url: urlData.publicUrl });
}

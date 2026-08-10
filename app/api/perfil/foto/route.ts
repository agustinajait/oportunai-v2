export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `fotos-perfil/${session.userId}.${ext}`;

    const { error: uploadError } = await getSupabase().storage
      .from('videos')
      .upload(filename, buffer, { contentType: file.type, upsert: true });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: urlData } = getSupabase().storage.from('videos').getPublicUrl(filename);
    const foto_url = `${urlData.publicUrl}?v=${Date.now()}`;

    await prisma.usuario.update({
      where: { id: session.userId },
      data: { foto_url },
    });

    return NextResponse.json({ ok: true, foto_url });
  } catch (err: any) {
    console.error('[foto/route] error:', err);
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}

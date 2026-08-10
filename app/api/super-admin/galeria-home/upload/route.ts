export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, isSuperAdmin } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `galeria-home/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const { error } = await getSupabase().storage
    .from('videos')
    .upload(filename, buffer, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = getSupabase().storage.from('videos').getPublicUrl(filename);
  return NextResponse.json({ ok: true, src: urlData.publicUrl });
}

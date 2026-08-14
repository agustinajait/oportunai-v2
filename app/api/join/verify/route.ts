/**
 * POST /api/join/verify
 *
 * Korai llama este endpoint para verificar el JWT generado por OportunAI.
 * Recibe { token } y devuelve el payload si es válido.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JOIN_SECRET = new TextEncoder().encode(
  process.env.KORAI_JOIN_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret'
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'token requerido' },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      const { payload } = await jwtVerify(token, JOIN_SECRET);
      return NextResponse.json(
        { ok: true, data: payload },
        { status: 200, headers: corsHeaders }
      );
    } catch (err: unknown) {
      const expired = err instanceof Error && err.message.includes('exp');
      return NextResponse.json(
        { ok: false, error: expired ? 'token expirado' : 'token inválido' },
        { status: expired ? 410 : 401, headers: corsHeaders }
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: 'error interno' },
      { status: 500, headers: corsHeaders }
    );
  }
}

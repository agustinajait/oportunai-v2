/**
 * send_whatsapp — Oportunai Edge Function
 * Envía un mensaje de texto vía Meta WhatsApp Business API.
 * POST body: { telefono: string, mensaje: string, usuario_id?: string }
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const WHATSAPP_TOKEN    = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const PHONE_NUMBER_ID   = Deno.env.get("WA_PHONE_NUMBER_ID") ?? "";  // ID del número de Oportunai en Meta
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function jsonHeaders(): HeadersInit {
  return { ...corsHeaders, "Content-Type": "application/json" };
}

/** Normaliza número argentino al formato Meta: 549XXXXXXXXXX */
function normalizarNumero(telefono: string): string {
  const digits = telefono.replace(/\D/g, "");
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54"))  return "549" + digits.slice(2);
  if (digits.startsWith("9"))   return "54" + digits;
  return "549" + digits;
}

/** Guarda el mensaje del bot en BotMensaje (via REST de Supabase) */
async function guardarMensajeBot(usuario_id: string, texto: string) {
  if (!usuario_id) return;
  await fetch(`${SUPABASE_URL}/rest/v1/BotMensaje`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ usuario_id, tipo: "bot", texto }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const headers = jsonHeaders();

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
    }

    const body = await req.json() as Record<string, unknown>;
    const telefono   = body?.telefono   as string | undefined;
    const mensaje    = body?.mensaje    as string | undefined;
    const usuario_id = body?.usuario_id as string | undefined;

    if (!telefono || !mensaje) {
      return new Response(JSON.stringify({ error: "telefono y mensaje son requeridos" }), { status: 400, headers });
    }

    const numero = normalizarNumero(telefono);

    const waRes = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numero,
        type: "text",
        text: { body: mensaje },
      }),
    });

    const waData = await waRes.json();

    if (!waRes.ok) {
      console.error("Meta WA error:", waData);
      return new Response(JSON.stringify({ error: "Error al enviar por WhatsApp", detail: waData }), { status: 502, headers });
    }

    // Guardar en historial
    if (usuario_id) await guardarMensajeBot(usuario_id, mensaje);

    return new Response(JSON.stringify({ ok: true, waid: waData?.messages?.[0]?.id }), { headers });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers });
  }
});

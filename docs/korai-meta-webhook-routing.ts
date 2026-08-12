/**
 * Snippet para agregar en el meta_webhook de Korai (proyecto Supabase: jgqqkgfppovkbwklctol)
 *
 * Este código va ANTES del procesamiento normal de Korai.
 * Si el sender es un usuario de Oportunai con el bot activo,
 * reenvía el payload completo a Oportunai y termina (Korai no procesa el mensaje).
 *
 * Secrets que hay que agregar en el proyecto Supabase de Korai:
 *   OPORTUNAI_CHECK_URL       → "https://oportunai.com.ar/api/whatsapp/check"
 *   OPORTUNAI_INTERNAL_KEY    → clave compartida (cualquier string largo y aleatorio)
 *   OPORTUNAI_WEBHOOK_URL     → "https://pqmqxsioxvgrturpgyhi.supabase.co/functions/v1/whatsapp_webhook"
 *   OPORTUNAI_SUPABASE_ANON_KEY → anon key del proyecto Supabase de Oportunai
 *   OPORTUNAI_FORWARD_KEY     → clave que Korai incluye en el header x-forward-key
 *                               (debe coincidir con el secret KORAI_FORWARD_KEY de Oportunai)
 */

// ─── Env vars (agregar junto a las existentes de Korai) ──────────────────────
const OPORTUNAI_CHECK_URL       = Deno.env.get("OPORTUNAI_CHECK_URL")       ?? "";
const OPORTUNAI_INTERNAL_KEY    = Deno.env.get("OPORTUNAI_INTERNAL_KEY")    ?? "";
const OPORTUNAI_WEBHOOK_URL     = Deno.env.get("OPORTUNAI_WEBHOOK_URL")     ?? "";
const OPORTUNAI_SUPABASE_ANON_KEY = Deno.env.get("OPORTUNAI_SUPABASE_ANON_KEY") ?? "";
const OPORTUNAI_FORWARD_KEY     = Deno.env.get("OPORTUNAI_FORWARD_KEY")     ?? "";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Consulta si un número pertenece a un usuario de Oportunai con el bot activo */
async function isOportunaiUser(telefono: string): Promise<boolean> {
  if (!OPORTUNAI_CHECK_URL || !OPORTUNAI_INTERNAL_KEY) return false;
  try {
    const res = await fetch(
      `${OPORTUNAI_CHECK_URL}?telefono=${encodeURIComponent(telefono)}`,
      { headers: { "x-internal-key": OPORTUNAI_INTERNAL_KEY } }
    );
    if (!res.ok) return false;
    const data = await res.json() as { activo: boolean };
    return data.activo === true;
  } catch (e) {
    console.error("[korai→oportunai] check error:", e);
    return false;
  }
}

/** Reenvía el payload de Meta a la webhook de Oportunai */
async function forwardToOportunai(rawBody: unknown): Promise<void> {
  if (!OPORTUNAI_WEBHOOK_URL) return;
  try {
    await fetch(OPORTUNAI_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPORTUNAI_SUPABASE_ANON_KEY}`,
        "x-forward-key": OPORTUNAI_FORWARD_KEY,
      },
      body: JSON.stringify(rawBody),
    });
  } catch (e) {
    console.error("[korai→oportunai] forward error:", e);
  }
}

// ─── Lógica de routing (agregar al inicio del handler POST de Korai) ─────────
//
// REEMPLAZA tu handler existente por algo como esto:
//
// serve(async (req) => {
//   if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
//
//   // Verificación GET (sin cambios)
//   if (req.method === "GET") { /* tu código existente */ }
//
//   if (req.method === "POST") {
//     // Leer el body UNA VEZ y guardar el texto crudo
//     const rawText = await req.text();
//     let body: Record<string, unknown>;
//     try { body = JSON.parse(rawText); } catch { return new Response("ok", { status: 200 }); }
//
//     // ── ROUTING OPORTUNAI (agregar esto) ──────────────────────────────────
//     const from = (body?.entry as Array<Record<string, unknown>>)?.[0]
//       ?.changes?.[0]?.value?.messages?.[0]?.from as string | undefined;
//
//     if (from && OPORTUNAI_CHECK_URL) {
//       const esOportunai = await isOportunaiUser(from);
//       if (esOportunai) {
//         // No procesamos el mensaje en Korai — lo maneja Oportunai
//         await forwardToOportunai(body);
//         return new Response("ok", { status: 200 });
//       }
//     }
//     // ── FIN ROUTING OPORTUNAI ─────────────────────────────────────────────
//
//     // Tu código existente de Korai sigue igual a partir de acá...
//   }
// });

export { isOportunaiUser, forwardToOportunai };

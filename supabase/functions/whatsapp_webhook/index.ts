/**
 * whatsapp_webhook — Oportunai Edge Function
 *
 * Recibe mensajes entrantes de WhatsApp (Meta Business API),
 * busca al usuario en la DB de Oportunai, genera una respuesta
 * con Claude y la envía de vuelta.
 *
 * Flujo:
 *   1. Meta llama al webhook con el mensaje del candidato
 *   2. Buscamos al usuario por teléfono en la tabla Usuario
 *   3. Cargamos el historial de BotMensaje del usuario
 *   4. Llamamos a Claude con contexto laboral de Oportunai
 *   5. Enviamos la respuesta vía WhatsApp
 *   6. Guardamos ambos mensajes en BotMensaje
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const VERIFY_TOKEN        = Deno.env.get("WA_VERIFY_TOKEN") ?? "oportunai-webhook-2024";
const WHATSAPP_TOKEN      = Deno.env.get("WHATSAPP_TOKEN") ?? "";       // token de Korai (número compartido)
const PHONE_NUMBER_ID     = Deno.env.get("WA_PHONE_NUMBER_ID") ?? "";   // phone number ID de Korai
const ANTHROPIC_API_KEY   = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").trim();
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// Key compartida: Korai la incluye en el header cuando reenvía mensajes
const KORAI_FORWARD_KEY   = Deno.env.get("KORAI_FORWARD_KEY") ?? "";

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001"; // modelo rápido y barato

// ─── Prompt del asistente Oportunai ──────────────────────────────────────────

const SYSTEM_PROMPT = `Sos el asistente de acompañamiento de OportunAI.
Representás al equipo de OportunAI. Siempre hablás en plural ("Te ayudamos", "Queremos saber", "Estamos para acompañarte").
Nunca decís que sos una inteligencia artificial. La persona debe sentir que conversa con un equipo humano.

MISIÓN
Ayudar a la persona a encontrar trabajo, prepararse para entrevistas, mejorar su perfil y conectar con oportunidades reales en estaciones de servicio, atención al cliente y gastronomía.

CONTEXTO QUE RECIBÍS
Antes de responder siempre recibís: nombre del usuario, perfil en Oportunai (bio, experiencia, habilidades), historial de conversación, servicios disponibles actualmente.
Nunca ignorés ese contexto. Nunca volvás a preguntar algo que ya sabemos.

CÓMO CONVERSAR
- Español rioplatense simple, sin tecnicismos.
- Una sola pregunta por vez. No hacer múltiples preguntas juntas.
- Escuchar antes de recomendar.
- Emojis con moderación: máximo 2 por mensaje.
- Sin frases vacías como "Gracias por contarnos" si no tienen sentido.

QUÉ PODÉS HACER POR EL USUARIO
- Orientarlo sobre cómo completar mejor su perfil y Video CV en OportunAI
- Explicar cómo funcionan los servicios publicados (módulos de trabajo)
- Ayudarlo a prepararse para entrevistas según el sector que le interesa
- Recordarle capacitaciones disponibles en la plataforma
- Si el usuario aplica a un servicio, hacer seguimiento del proceso
- Detectar si necesita apoyo adicional (derivación a otros recursos)

SECTORES PRINCIPALES DE OPORTUNAI
Estaciones de servicio (playeros, cajeros), atención al cliente (call center, recepción, vendedores) y gastronomía (cocina, caja, atención). Si el usuario busca otro rubro, igual lo acompañamos con consejos generales.

CÓMO RECOMENDAR
No recomendar de forma automática. Primero entender qué busca la persona, qué experiencia tiene, cuál es su disponibilidad. Después orientar con precisión.

CASOS SENSIBLES
Si detectás una situación de violencia, desempleo crítico, salud mental o emergencia social: respondé con contención, recomendá recursos (Línea 144, 147, ANSES) y marcá el mensaje con [ALERTA_HUMANA] al inicio.

REGLA PRINCIPAL
Devolvé únicamente el texto del mensaje de WhatsApp, sin explicaciones ni comillas.
Máximo 2 emojis en todo el mensaje.`;

// ─── Helpers Supabase ─────────────────────────────────────────────────────────

async function sbGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  return res.json();
}

async function sbPost(path: string, data: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(data),
  });
  return res;
}

/** Busca usuario por teléfono. Normaliza número argentino. */
async function buscarUsuario(telefono: string) {
  // Intentar múltiples formatos del número
  const digits = telefono.replace(/\D/g, "");
  const variantes = new Set<string>();
  variantes.add(digits);
  // 549XXXXXXXXXX → 9XXXXXXXXXX (sin código país)
  if (digits.startsWith("549")) variantes.add(digits.slice(3));
  // 549XXXXXXXXXX → 0XXXXXXXXXX
  if (digits.startsWith("549")) variantes.add("0" + digits.slice(3));
  // 549XXXXXXXXXX → 15XXXXXXXX (viejo formato)
  if (digits.startsWith("549")) variantes.add("15" + digits.slice(5));

  for (const v of variantes) {
    const rows = await sbGet(`Usuario?telefono=ilike.%25${v}%25&limit=1`);
    if (Array.isArray(rows) && rows.length > 0) return rows[0];
  }
  return null;
}

/** Carga últimos 20 mensajes del historial del usuario */
async function cargarHistorial(usuario_id: string) {
  const rows = await sbGet(
    `BotMensaje?usuario_id=eq.${usuario_id}&order=created_at.asc&limit=20`
  );
  return Array.isArray(rows) ? rows : [];
}

/** Guarda un mensaje en BotMensaje */
async function guardarMensaje(usuario_id: string, tipo: "usuario" | "bot", texto: string) {
  await sbPost("BotMensaje", { usuario_id, tipo, texto });
}

/** Genera respuesta con Claude */
async function generarRespuesta(
  usuario: Record<string, unknown>,
  historial: Array<{ tipo: string; texto: string }>,
  mensajeUsuario: string,
): Promise<string> {
  const nombre = usuario.nombre_completo as string ?? "candidato";
  const cvDatos = usuario.cv_datos as Record<string, unknown> ?? {};
  const bio = usuario.bio as string ?? "";

  // Construir contexto del usuario
  const perfilTexto = [
    `Nombre: ${nombre}`,
    bio ? `Bio: ${bio}` : "",
    cvDatos.resumen ? `Resumen: ${cvDatos.resumen}` : "",
    cvDatos.nivel_estudios ? `Estudios: ${cvDatos.nivel_estudios}` : "",
    cvDatos.disponibilidad ? `Disponibilidad: ${cvDatos.disponibilidad}` : "",
    cvDatos.localidad ? `Localidad: ${cvDatos.localidad}` : "",
    Array.isArray(cvDatos.habilidades) && cvDatos.habilidades.length > 0
      ? `Habilidades: ${(cvDatos.habilidades as string[]).join(", ")}`
      : "",
  ].filter(Boolean).join("\n");

  // Armar mensajes para Claude
  const messages: Array<{ role: string; content: string }> = [];

  // Historial previo
  for (const msg of historial.slice(-18)) {
    messages.push({
      role: msg.tipo === "usuario" ? "user" : "assistant",
      content: msg.texto,
    });
  }

  // Mensaje actual del usuario
  messages.push({ role: "user", content: mensajeUsuario });

  const userContext = `
[PERFIL DEL USUARIO EN OPORTUNAI]
${perfilTexto || "Sin perfil completo todavía."}

[MENSAJE DEL USUARIO]
${mensajeUsuario}
`.trim();

  // Si no hay historial, el primer mensaje incluye el contexto completo
  if (messages.length === 1) {
    messages[0].content = userContext;
  }

  console.log("ANTHROPIC_API_KEY ok, length:", ANTHROPIC_API_KEY.length);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  const data = await res.json() as Record<string, unknown>;
  const content = data.content as Array<{ type: string; text: string }>;
  return content?.[0]?.text ?? "Gracias por escribirnos. En un momento te atendemos 🙌";
}

/** Envía mensaje por WhatsApp */
async function enviarWhatsApp(numero: string, mensaje: string) {
  await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
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
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Verificación del webhook Meta (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode      = url.searchParams.get("hub.mode");
    const token     = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // Mensaje entrante (POST de Meta — reenviado por Korai)
  if (req.method === "POST") {
    try {
      // Validar que el POST viene de Korai con la clave compartida
      if (KORAI_FORWARD_KEY) {
        const fwdKey = req.headers.get("x-forward-key") ?? "";
        if (fwdKey !== KORAI_FORWARD_KEY) {
          console.error("whatsapp_webhook: invalid x-forward-key");
          return new Response("Unauthorized", { status: 401 });
        }
      }

      const body = await req.json() as Record<string, unknown>;
      console.log("WA webhook POST recibido");

      // Extraer mensaje
      const entry   = (body?.entry as Array<Record<string, unknown>>)?.[0];
      const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0];
      const value   = changes?.value as Record<string, unknown>;
      const messages = value?.messages as Array<Record<string, unknown>>;

      if (!messages || messages.length === 0) {
        console.log("Sin mensajes en payload");
        return new Response("ok", { status: 200 });
      }

      const msg = messages[0];
      if (msg.type !== "text") return new Response("ok", { status: 200 }); // ignorar multimedia

      const from   = msg.from as string;
      const texto  = (msg.text as Record<string, unknown>)?.body as string;

      console.log("Mensaje de:", from, "texto:", texto);

      if (!from || !texto) return new Response("ok", { status: 200 });

      // Buscar usuario en Oportunai
      const usuario = await buscarUsuario(from);
      console.log("Usuario encontrado:", usuario ? usuario.id : "null");

      if (!usuario) {
        await enviarWhatsApp(from,
          "¡Hola! 👋 Soy el asistente de OportunAI.\n\n" +
          "No encontramos tu cuenta. Registrate gratis en oportunai.korai.lat para que podamos acompañarte en tu búsqueda de trabajo."
        );
        return new Response("ok", { status: 200 });
      }

      console.log("whatsapp_activo:", usuario.whatsapp_activo);

      // Verificar que el usuario tiene bot activo
      if (!usuario.whatsapp_activo) {
        return new Response("ok", { status: 200 }); // opt-out, ignorar
      }

      // Guardar mensaje del usuario
      await guardarMensaje(usuario.id, "usuario", texto);

      // Cargar historial
      const historial = await cargarHistorial(usuario.id);
      console.log("Historial cargado:", historial.length, "mensajes");

      // Generar respuesta con Claude
      console.log("Generando respuesta con Claude...");
      const respuesta = await generarRespuesta(usuario, historial, texto);
      console.log("Respuesta generada, enviando WA...");

      // Enviar respuesta
      await enviarWhatsApp(from, respuesta);
      console.log("WA enviado OK");

      // Guardar respuesta del bot
      await guardarMensaje(usuario.id, "bot", respuesta);

      return new Response("ok", { status: 200 });
    } catch (err) {
      console.error("whatsapp_webhook error:", err);
      return new Response("ok", { status: 200 }); // siempre 200 a Meta
    }
  }

  return new Response("Method not allowed", { status: 405 });
});

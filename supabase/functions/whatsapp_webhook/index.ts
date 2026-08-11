/**
 * whatsapp_webhook — Oportunai Edge Function
 *
 * Recibe mensajes de WhatsApp (reenviados por Korai), genera respuesta
 * con Claude usando perfil del usuario + oportunidades activas.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const VERIFY_TOKEN         = Deno.env.get("WA_VERIFY_TOKEN") ?? "oportunai-webhook-2024";
const WHATSAPP_TOKEN       = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const PHONE_NUMBER_ID      = Deno.env.get("WA_PHONE_NUMBER_ID") ?? "";
const ANTHROPIC_API_KEY    = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").replace(/[^\x21-\x7E]/g, "").trim();
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const KORAI_FORWARD_KEY    = Deno.env.get("KORAI_FORWARD_KEY") ?? "";

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `Sos el asistente de acompañamiento de OportunAI.
Representás al equipo de OportunAI. Siempre hablás en plural ("Te ayudamos", "Queremos saber", "Estamos para acompañarte").
Nunca decís que sos una inteligencia artificial. La persona debe sentir que conversa con un equipo humano.

MISIÓN
Ayudar a la persona a encontrar trabajo, prepararse para entrevistas, mejorar su perfil y conectar con oportunidades reales.

PLATAFORMA OPORTUNAI
En la plataforma el usuario puede:
- Ver y completar su perfil laboral / Video CV: https://oportunai.korai.lat/dashboard/flyer
- Postularse a ofertas de empleo y módulos de trabajo: https://oportunai.korai.lat/dashboard
  (desde el dashboard: tab "Módulos" para módulos de trabajo, tab "Ofertas" para empleos)
- Completar capacitaciones disponibles
- Subir documentos requeridos

SECTORES PRINCIPALES
Estaciones de servicio (playeros, cajeros), atención al cliente (call center, recepción, vendedores) y gastronomía (cocina, caja, atención al público).

CONTEXTO QUE RECIBÍS ANTES DE CADA RESPUESTA
- Nombre y perfil del usuario (bio, experiencia, habilidades, estudios)
- Historial de conversación
- Lista de MÓDULOS DE TRABAJO ACTIVOS (servicios publicados por empresas)
- Lista de OFERTAS DE EMPLEO ACTIVAS

CÓMO USAR LAS OPORTUNIDADES DISPONIBLES
- Si hay módulos o ofertas que se adaptan al perfil del usuario, mencionalos por nombre.
- Siempre mandá el link al dashboard para que se postule: https://oportunai.korai.lat/dashboard
- No inventés oportunidades que no están en la lista que recibís.
- Si no hay oportunidades, igual acompañá con consejos de búsqueda y preparación.

CÓMO CONVERSAR
- Español rioplatense simple, sin tecnicismos.
- Una sola pregunta por vez. No hacer múltiples preguntas juntas.
- Escuchar antes de recomendar.
- Emojis con moderación: máximo 2 por mensaje.
- Sin frases vacías como "Gracias por contarnos" si no tienen sentido.
- Nunca ignorés el contexto. Nunca volvás a preguntar algo que ya sabemos.

QUÉ PODÉS HACER POR EL USUARIO
- Orientarlo sobre cómo completar mejor su perfil y Video CV
- Explicar cómo postularse a módulos y ofertas
- Ayudarlo a prepararse para entrevistas
- Recordarle capacitaciones disponibles
- Hacer seguimiento si ya aplicó a algo
- Detectar si necesita apoyo adicional

CASOS SENSIBLES
Si detectás violencia, desempleo crítico, salud mental o emergencia social: respondé con contención, recomendá recursos (Línea 144, 147, ANSES) y marcá con [ALERTA_HUMANA] al inicio.

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

/** Busca usuario por teléfono. Prioriza whatsapp_activo=true */
async function buscarUsuario(telefono: string) {
  const digits = telefono.replace(/\D/g, "");
  const variantes = new Set<string>();
  variantes.add(digits);
  if (digits.startsWith("549")) variantes.add(digits.slice(3));
  if (digits.startsWith("549")) variantes.add("0" + digits.slice(3));
  if (digits.startsWith("549")) variantes.add("15" + digits.slice(5));

  for (const v of variantes) {
    const rows = await sbGet(`Usuario?telefono=ilike.%25${v}%25&order=whatsapp_activo.desc&limit=1`);
    if (Array.isArray(rows) && rows.length > 0) return rows[0];
  }
  return null;
}

/** Carga últimos 20 mensajes del historial */
async function cargarHistorial(usuario_id: string) {
  const rows = await sbGet(
    `BotMensaje?usuario_id=eq.${usuario_id}&order=created_at.asc&limit=20`
  );
  return Array.isArray(rows) ? rows : [];
}

/** Carga módulos de trabajo activos */
async function cargarModulos() {
  try {
    const rows = await sbGet(`Servicio?estado=eq.activo&select=titulo,descripcion,duracion_jornada,frecuencia&order=created_at.desc&limit=10`);
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

/** Carga ofertas de empleo activas */
async function cargarOfertas() {
  try {
    const rows = await sbGet(`Oferta?estado=eq.activa&select=titulo,descripcion,area,ciudad,modalidad&order=created_at.desc&limit=10`);
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
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
  modulos: Array<Record<string, unknown>>,
  ofertas: Array<Record<string, unknown>>,
): Promise<string> {
  const nombre = usuario.nombre_completo as string ?? "candidato";
  const cvDatos = usuario.cv_datos as Record<string, unknown> ?? {};
  const bio = usuario.bio as string ?? "";

  // Perfil del usuario
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
    Array.isArray(cvDatos.experiencia) && cvDatos.experiencia.length > 0
      ? `Experiencia: ${(cvDatos.experiencia as Array<{cargo: string; empresa: string}>)
          .map(e => `${e.cargo} en ${e.empresa}`).join(", ")}`
      : "",
  ].filter(Boolean).join("\n");

  // Oportunidades activas
  const modulosTexto = modulos.length > 0
    ? `MÓDULOS DE TRABAJO ACTIVOS:\n` + modulos.map(m =>
        `- ${m.titulo}${m.duracion_jornada ? ` (${m.duracion_jornada})` : ""}${m.descripcion ? `: ${String(m.descripcion).slice(0, 100)}` : ""}`
      ).join("\n")
    : "No hay módulos de trabajo activos en este momento.";

  const ofertasTexto = ofertas.length > 0
    ? `OFERTAS DE EMPLEO ACTIVAS:\n` + ofertas.map(o =>
        `- ${o.titulo}${o.area ? ` [${o.area}]` : ""}${o.ciudad ? ` en ${o.ciudad}` : ""}${o.descripcion ? `: ${String(o.descripcion).slice(0, 100)}` : ""}`
      ).join("\n")
    : "No hay ofertas de empleo activas en este momento.";

  // Construir mensajes para Claude
  const messages: Array<{ role: string; content: string }> = [];

  for (const msg of historial.slice(-18)) {
    messages.push({
      role: msg.tipo === "usuario" ? "user" : "assistant",
      content: msg.texto,
    });
  }

  messages.push({ role: "user", content: mensajeUsuario });

  const userContext = `
[PERFIL DEL USUARIO]
${perfilTexto || "Sin perfil completo todavía."}

[OPORTUNIDADES DISPONIBLES EN OPORTUNAI]
${modulosTexto}

${ofertasTexto}

[MENSAJE DEL USUARIO]
${mensajeUsuario}
`.trim();

  if (messages.length === 1) {
    messages[0].content = userContext;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 400,
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
  const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
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
  const data = await res.json();
  console.log("WA API status:", res.status, JSON.stringify(data));
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

  if (req.method === "POST") {
    try {
      if (KORAI_FORWARD_KEY) {
        const fwdKey = req.headers.get("x-forward-key") ?? "";
        if (fwdKey !== KORAI_FORWARD_KEY) {
          console.error("whatsapp_webhook: invalid x-forward-key");
          return new Response("Unauthorized", { status: 401 });
        }
      }

      const body = await req.json() as Record<string, unknown>;
      console.log("WA webhook POST recibido");

      const entry   = (body?.entry as Array<Record<string, unknown>>)?.[0];
      const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0];
      const value   = changes?.value as Record<string, unknown>;
      const messages = value?.messages as Array<Record<string, unknown>>;

      if (!messages || messages.length === 0) {
        return new Response("ok", { status: 200 });
      }

      const msg = messages[0];
      if (msg.type !== "text") return new Response("ok", { status: 200 });

      const from  = msg.from as string;
      const texto = (msg.text as Record<string, unknown>)?.body as string;

      console.log("Mensaje de:", from, "texto:", texto);

      if (!from || !texto) return new Response("ok", { status: 200 });

      const usuario = await buscarUsuario(from);
      console.log("Usuario:", usuario ? `${usuario.id} activo:${usuario.whatsapp_activo}` : "null");

      if (!usuario) {
        await enviarWhatsApp(from,
          "¡Hola! 👋 No encontramos tu cuenta en OportunAI.\n\n" +
          "Registrate gratis en oportunai.korai.lat para que podamos acompañarte en tu búsqueda de trabajo."
        );
        return new Response("ok", { status: 200 });
      }

      if (!usuario.whatsapp_activo) {
        return new Response("ok", { status: 200 });
      }

      // Guardar mensaje del usuario
      await guardarMensaje(usuario.id, "usuario", texto);

      // Cargar historial y oportunidades en paralelo
      const [historial, modulos, ofertas] = await Promise.all([
        cargarHistorial(usuario.id),
        cargarModulos(),
        cargarOfertas(),
      ]);

      console.log(`Historial: ${historial.length} msgs | Módulos: ${modulos.length} | Ofertas: ${ofertas.length}`);

      const respuesta = await generarRespuesta(usuario, historial, texto, modulos, ofertas);

      await enviarWhatsApp(from, respuesta);
      await guardarMensaje(usuario.id, "bot", respuesta);

      return new Response("ok", { status: 200 });
    } catch (err) {
      console.error("whatsapp_webhook error:", err);
      return new Response("ok", { status: 200 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});

/**
 * whatsapp_webhook — Oportunai Edge Function
 *
 * Recibe mensajes de WhatsApp (reenviados por Korai), genera respuesta
 * con Claude. El semáforo de 6 dimensiones lo completa Korai (app.korai.lat);
 * este bot lo usa para personalizar el acompañamiento en empleabilidad.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forward-key",
};

const VERIFY_TOKEN         = Deno.env.get("WA_VERIFY_TOKEN") ?? "oportunai-webhook-2024";
const WHATSAPP_TOKEN       = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const PHONE_NUMBER_ID      = Deno.env.get("WA_PHONE_NUMBER_ID") ?? "";
const ANTHROPIC_API_KEY    = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").replace(/[^\x21-\x7E]/g, "").trim();
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const KORAI_FORWARD_KEY    = Deno.env.get("KORAI_FORWARD_KEY") ?? "";

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

// ─── Semáforo ────────────────────────────────────────────────────────────────

type SemaforoColor = "verde" | "amarillo" | "rojo";
interface Semaforo {
  empleo?:    SemaforoColor;
  educacion?: SemaforoColor;
  ingresos?:  SemaforoColor;
  salud?:     SemaforoColor;
  vivienda?:  SemaforoColor;
  red?:       SemaforoColor;
  motivo?:    string;
}

const DIMS_SEMAFORO = ["empleo", "educacion", "ingresos", "salud", "vivienda", "red"] as const;

/** ¿El usuario tiene el diagnóstico de Korai completo? */
function tieneDiagnostico(semaforo: Semaforo | null): boolean {
  if (!semaforo) return false;
  return DIMS_SEMAFORO.some(d => semaforo[d]);
}

/** Texto legible del semáforo para el contexto del bot */
function semaforoResumen(semaforo: Semaforo): string {
  const LABEL: Record<string, string> = {
    empleo: "Empleo", educacion: "Educación", ingresos: "Ingresos",
    salud: "Salud", vivienda: "Vivienda", red: "Red social",
  };
  return DIMS_SEMAFORO
    .filter(d => semaforo[d])
    .map(d => {
      const emoji = semaforo[d] === "verde" ? "🟢" : semaforo[d] === "amarillo" ? "🟡" : "🔴";
      return `${emoji} ${LABEL[d]}: ${semaforo[d]}`;
    })
    .join(" | ");
}

/** Dimensiones prioritarias (rojo o amarillo) para enfocar el acompañamiento */
function dimensionesPrioritarias(semaforo: Semaforo): string[] {
  return DIMS_SEMAFORO.filter(d => semaforo[d] === "rojo" || semaforo[d] === "amarillo");
}

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
    const rows = await sbGet(
      `Servicio?estado=eq.activo&select=titulo,descripcion,duracion_jornada,frecuencia,precio_hora,horas_modulo&order=created_at.desc&limit=10`
    );
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

/** Carga ofertas de empleo activas */
async function cargarOfertas() {
  try {
    const rows = await sbGet(
      `Oferta?estado=eq.activa&select=titulo,descripcion,area,ciudad,modalidad&order=created_at.desc&limit=10`
    );
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

/** Guarda un mensaje en BotMensaje */
async function guardarMensaje(usuario_id: string, tipo: "usuario" | "bot", texto: string) {
  await sbPost("BotMensaje", { usuario_id, tipo, texto });
}

// ─── Prompt del sistema ───────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Sos el asistente de acompañamiento de OportunAI.

OportunAI es una plataforma que combina diagnóstico social y acompañamiento para la empleabilidad.
Tenemos un sistema de diagnóstico semaforizado (inspirado en el Semáforo de la Pobreza) que permite conocer
la situación de cada persona en 6 dimensiones: empleo, educación, ingresos, salud, vivienda y red social.
A partir de ese diagnóstico, acompañamos a cada persona en el armado de su perfil, CV y VideoCV,
y luego en su recorrido hacia distintas oportunidades laborales.

Representás al equipo de OportunAI. Siempre hablás en plural ("Te ayudamos", "Estamos para acompañarte").
Nunca decís que sos una inteligencia artificial. La persona siente que conversa con un equipo humano.

────────────────────────────────────────────
PLATAFORMA OPORTUNAI
────────────────────────────────────────────
- Perfil laboral y Video CV:  https://oportunai.korai.lat/dashboard/flyer
- Dashboard (módulos y ofertas): https://oportunai.korai.lat/dashboard
- Diagnóstico de situación (Korai): https://app.korai.lat

────────────────────────────────────────────
CONTEXTO QUE RECIBÍS ANTES DE CADA RESPUESTA
────────────────────────────────────────────
- Nombre y perfil del usuario
- Estado del diagnóstico Korai (semáforo de 6 dimensiones) — puede estar completo, parcial o ausente
- Historial de conversación
- Módulos de trabajo activos y ofertas de empleo activas

────────────────────────────────────────────
CUANDO EL DIAGNÓSTICO KORAI ESTÁ AUSENTE O INCOMPLETO
────────────────────────────────────────────
El diagnóstico de Korai es el punto de partida de todo el acompañamiento.
Si el usuario NO tiene diagnóstico todavía:
→ Explicale brevemente qué es (conocer su situación para acompañarlo mejor)
→ Invitalo a hacerlo gratis en: https://app.korai.lat
→ Aclará que es un paso rápido y que después volvemos con recomendaciones personalizadas
→ No hagas muchas preguntas antes de eso; el diagnóstico nos da toda la info que necesitamos

Si ya tiene diagnóstico parcial: usá lo que hay y acompañá según esas dimensiones.

────────────────────────────────────────────
CUANDO EL DIAGNÓSTICO KORAI ESTÁ COMPLETO
────────────────────────────────────────────
Usá el semáforo para personalizar el acompañamiento:
- 🔴 Rojo en empleo → prioridad máxima, mencioná módulos y ofertas disponibles
- 🟡 Amarillo en empleo → ya tiene algo pero puede mejorar, orientá hacia módulos y capacitaciones
- 🟢 Verde en empleo → celebrá y ayudalo a mantener/crecer
- 🔴/🟡 en educación → recomendá las capacitaciones disponibles en la plataforma
- 🔴/🟡 en ingresos → módulos de trabajo son una opción de ingresos rápida
- 🔴/🟡 en red → sugerí agregar referencias laborales al perfil

────────────────────────────────────────────
OPORTUNIDADES DISPONIBLES
────────────────────────────────────────────
- Mencioná módulos y ofertas por nombre si aplican al perfil del usuario
- Siempre mandá el link al dashboard: https://oportunai.korai.lat/dashboard
- No inventés oportunidades que no están en la lista que recibís
- Si no hay oportunidades activas, acompañá con consejos de perfil y preparación

────────────────────────────────────────────
CÓMO CONVERSAR
────────────────────────────────────────────
- Español rioplatense simple, sin tecnicismos
- Una sola pregunta por vez
- Escuchar antes de recomendar
- Emojis con moderación: máximo 2 por mensaje
- Sin frases vacías tipo "Gracias por contarnos" si no tienen sentido
- Nunca ignorés el contexto ni volvás a preguntar algo que ya sabemos

CASOS SENSIBLES
Si detectás violencia, desempleo crítico, salud mental o emergencia social:
respondé con contención, recomendá recursos (Línea 144, 147, ANSES) y marcá [ALERTA_HUMANA] al inicio.

PRIMERA RESPUESTA
Si es el primer mensaje del usuario, presentate brevemente y preguntá en qué podés ayudarlo.
Si no tiene diagnóstico, rápidamente guialo a app.korai.lat.

REGLA PRINCIPAL
Devolvé únicamente el texto del mensaje de WhatsApp, sin explicaciones ni comillas.
Máximo 2 emojis en todo el mensaje.`;

// ─── Generación de respuesta ──────────────────────────────────────────────────

async function generarRespuesta(
  usuario: Record<string, unknown>,
  historial: Array<{ tipo: string; texto: string }>,
  mensajeUsuario: string,
  modulos: Array<Record<string, unknown>>,
  ofertas: Array<Record<string, unknown>>,
  semaforo: Semaforo | null,
): Promise<string> {
  const nombre = (usuario.nombre_completo as string) ?? "candidato";
  const cvDatos = (usuario.cv_datos as Record<string, unknown>) ?? {};
  const bio = (usuario.bio as string) ?? "";

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
      ? `Experiencia: ${(cvDatos.experiencia as Array<{ cargo: string; empresa: string }>)
          .map(e => `${e.cargo} en ${e.empresa}`).join(", ")}`
      : "",
  ].filter(Boolean).join("\n");

  // Estado del diagnóstico Korai
  const tieneDiag = tieneDiagnostico(semaforo);
  const diagnosticoTexto = tieneDiag && semaforo
    ? `DIAGNÓSTICO KORAI COMPLETO:\n${semaforoResumen(semaforo)}` +
      (dimensionesPrioritarias(semaforo).length > 0
        ? `\nDIMENSIONES PRIORITARIAS (rojo/amarillo): ${dimensionesPrioritarias(semaforo).join(", ")}`
        : "\nTodas las dimensiones en verde ✓")
    : "DIAGNÓSTICO KORAI: NO REALIZADO — invitarlo a hacerlo en https://app.korai.lat";

  // Oportunidades
  const modulosTexto = modulos.length > 0
    ? `MÓDULOS DE TRABAJO ACTIVOS:\n` + modulos.map(m =>
        `- ${m.titulo}${m.duracion_jornada ? ` (${m.duracion_jornada})` : ""}${m.precio_hora ? ` · $${m.precio_hora}/hs` : ""}${m.horas_modulo ? ` · ${m.horas_modulo} hs` : ""}${m.descripcion ? `: ${String(m.descripcion).slice(0, 100)}` : ""}`
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

  // Contexto completo en el primer mensaje o inyectado en el último
  const userContext = `
[PERFIL DEL USUARIO]
${perfilTexto || "Sin perfil completo todavía."}

[ESTADO DEL DIAGNÓSTICO]
${diagnosticoTexto}

[OPORTUNIDADES DISPONIBLES]
${modulosTexto}

${ofertasTexto}

[MENSAJE DEL USUARIO]
${mensajeUsuario}
`.trim();

  messages[messages.length - 1].content = messages.length === 1
    ? userContext
    : `${mensajeUsuario}\n\n[CONTEXTO]\n${diagnosticoTexto}\n${modulosTexto}\n${ofertasTexto}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 450,
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

      const entry    = (body?.entry as Array<Record<string, unknown>>)?.[0];
      const changes  = (entry?.changes as Array<Record<string, unknown>>)?.[0];
      const value    = changes?.value as Record<string, unknown>;
      const messages = value?.messages as Array<Record<string, unknown>>;

      if (!messages || messages.length === 0) {
        return new Response("ok", { status: 200 });
      }

      const msg = messages[0];
      if (msg.type !== "text") return new Response("ok", { status: 200 });

      const from  = msg.from as string;
      const texto = (msg.text as Record<string, unknown>)?.body as string;

      console.log("Mensaje de:", from, "| texto:", texto);
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

      await guardarMensaje(usuario.id, "usuario", texto);

      const [historial, modulos, ofertas] = await Promise.all([
        cargarHistorial(usuario.id),
        cargarModulos(),
        cargarOfertas(),
      ]);

      const semaforo = (usuario.korai_semaforo ?? null) as Semaforo | null;

      console.log(
        `Historial: ${historial.length} | Módulos: ${modulos.length} | Ofertas: ${ofertas.length}`,
        `| Semáforo: ${tieneDiagnostico(semaforo) ? semaforoResumen(semaforo!) : "sin diagnóstico"}`
      );

      const respuesta = await generarRespuesta(usuario, historial, texto, modulos, ofertas, semaforo);

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

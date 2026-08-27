/**
 * whatsapp_webhook — Oportunai Edge Function
 *
 * Recibe mensajes de WhatsApp (reenviados por Korai), genera respuesta
 * con Claude adoptando la personalidad de Korai.
 *
 * Flujo por conversación:
 *   1. Buscar usuario por teléfono
 *   2. Cargar estado de acompañamiento (KoraiAcompanamiento)
 *   3. Generar respuesta con Claude (prompt Korai + estado inyectado)
 *   4. Enviar respuesta por WhatsApp
 *   5. Extraer estado actualizado de la conversación (2do call Claude, estructurado)
 *   6. Persistir estado actualizado vía /api/korai/acompanamiento
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
const BOT_INTERNAL_KEY     = Deno.env.get("BOT_INTERNAL_KEY") ?? "";
const APP_URL              = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://oportunai.com.ar";

const MODEL_CHAT  = "claude-haiku-4-5-20251001";
const MODEL_EXTRA = "claude-haiku-4-5-20251001"; // para extracción de estado

// ── Tipos ─────────────────────────────────────────────────────────────────────

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

interface AccionPendiente {
  descripcion:      string;
  contexto?:        string;
  fecha_propuesta?: string;
}

interface EstadoAcompanamiento {
  situacion_actual?:    string;
  prioridades?:         string[];
  objetivos?:           string[];
  acciones_pendientes?: AccionPendiente[];
  acciones_realizadas?: Array<{ descripcion: string; fecha: string; resultado?: string }>;
  proximo_paso?:        string;
  ultima_interaccion?:  string;
  proximo_seguimiento?: string;
}

interface EstadoExtraido {
  situacion_actual?:         string;
  prioridades?:              string[];
  acciones_pendientes?:      AccionPendiente[];
  proximo_paso?:             string;
  proximo_seguimiento_dias?: number;
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function sbGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey":         SUPABASE_SERVICE_KEY,
      "Authorization":  `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  return res.json();
}

async function sbPost(path: string, data: unknown) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      "apikey":         SUPABASE_SERVICE_KEY,
      "Authorization":  `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type":   "application/json",
      "Prefer":         "return=minimal",
    },
    body: JSON.stringify(data),
  });
}

async function buscarUsuario(telefono: string) {
  const digits   = telefono.replace(/\D/g, "");
  const variantes = new Set<string>([digits]);
  if (digits.startsWith("549")) variantes.add(digits.slice(3));
  if (digits.startsWith("549")) variantes.add("0" + digits.slice(3));
  if (digits.startsWith("549")) variantes.add("15" + digits.slice(5));

  for (const v of variantes) {
    const rows = await sbGet(
      `Usuario?telefono=ilike.%25${v}%25&order=whatsapp_activo.desc&limit=1`
    );
    if (Array.isArray(rows) && rows.length > 0) return rows[0];
  }
  return null;
}

async function cargarHistorial(usuario_id: string) {
  const rows = await sbGet(
    `BotMensaje?usuario_id=eq.${usuario_id}&order=created_at.asc&limit=20`
  );
  return Array.isArray(rows) ? rows : [];
}

async function guardarMensaje(usuario_id: string, tipo: "usuario" | "bot", texto: string) {
  await sbPost("BotMensaje", { usuario_id, tipo, texto });
}

async function cargarModulos() {
  try {
    const rows = await sbGet(
      `Servicio?estado=eq.activo&select=titulo,descripcion,duracion_jornada,frecuencia,precio_hora,horas_modulo&order=created_at.desc&limit=8`
    );
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

async function cargarOfertas() {
  try {
    const rows = await sbGet(
      `Oferta?estado=eq.activa&select=titulo,descripcion,area,ciudad,modalidad&order=created_at.desc&limit=8`
    );
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

// ── Estado de acompañamiento ──────────────────────────────────────────────────

async function cargarEstado(usuario_id: string): Promise<EstadoAcompanamiento | null> {
  try {
    const rows = await sbGet(
      `KoraiAcompanamiento?usuario_id=eq.${usuario_id}&limit=1`
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch { return null; }
}

async function actualizarEstado(usuario_id: string, data: EstadoExtraido) {
  if (!BOT_INTERNAL_KEY) return;
  try {
    await fetch(`${APP_URL}/api/korai/acompanamiento`, {
      method:  "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-bot-key":    BOT_INTERNAL_KEY,
      },
      body: JSON.stringify({ usuario_id, ...data }),
    });
  } catch (e) {
    console.warn("No se pudo actualizar estado:", e);
  }
}

// ── Helpers semáforo ──────────────────────────────────────────────────────────

const DIMS_SEMAFORO = ["empleo", "educacion", "ingresos", "salud", "vivienda", "red"] as const;

function semaforoResumen(s: Semaforo): string {
  const LABEL: Record<string, string> = {
    empleo: "Empleo", educacion: "Educación", ingresos: "Ingresos",
    salud: "Salud", vivienda: "Vivienda", red: "Red social",
  };
  return DIMS_SEMAFORO
    .filter(d => s[d])
    .map(d => {
      const e = s[d] === "verde" ? "🟢" : s[d] === "amarillo" ? "🟡" : "🔴";
      return `${e} ${LABEL[d]}: ${s[d]}`;
    }).join(" | ");
}

function dimensionesPrioritarias(s: Semaforo): string[] {
  return DIMS_SEMAFORO.filter(d => s[d] === "rojo" || s[d] === "amarillo");
}

// ── Prompt Korai ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT_KORAI = `IDENTIDAD
Sos Korai, el asistente de acompañamiento de las personas que participan de los programas y servicios de OportunAI y los centros que trabajan junto a nosotros.
Tu función no es simplemente contestar preguntas. Tu función es acompañar a cada persona a partir de lo que está viviendo, ayudarla a avanzar y mantener continuidad en el proceso.
La persona debe sentir que hay un equipo detrás de Korai que conoce su situación, la escucha y está pendiente de cómo evoluciona.
No afirmés falsamente que una persona humana está escribiendo. Pero tampoco centres la conversación en que sos una IA. Korai debe sentirse como la puerta de entrada a un equipo de acompañamiento.

FORMA DE COMUNICAR
Usá naturalmente el "nosotros":
"Vimos tu diagnóstico." / "Estuvimos revisando lo que nos contaste." / "Podemos ayudarte con esto."
"Veamos juntos cómo avanzar." / "Queremos saber cómo siguió." / "Estamos para acompañarte."
La comunicación debe ser: argentina · cálida · humana · sencilla · cercana · respetuosa · fraterna · concreta.
No usar lenguaje burocrático ni institucional.
NO decir: "El algoritmo detectó..." / "Tu puntuación indica..." / "La dimensión presenta..."
DECIR: "Vimos que hoy esto te está costando." / "Esto aparece como una de las cosas que podríamos trabajar."

LÓGICA DE CADA CONVERSACIÓN
escuchar → comprender → priorizar → proponer → acompañar → definir próximo paso
No intentar resolver todo en un solo mensaje. Si hay varios problemas, identificar cuál es más importante para la persona en ese momento.
"Podemos trabajar varias cosas, pero si te parece empecemos por la que hoy más te preocupa."
Cada interacción debe dejar un próximo paso claro. Nunca terminar sin que la persona sepa qué puede hacer después y por qué volver a escribir.

ACOMPAÑAMIENTO EMOCIONAL
Atendé no solo qué necesita la persona, sino cómo se siente frente a lo que está viviendo.
Si expresa frustración: "Entiendo. Venís intentando resolver esto y es lógico que te frustre."
Después de validar, orientar hacia una acción posible.
NO: "Todo va a estar bien." / No minimizar ni dramatizar / No prometer resultados.
Primero acompañar emocionalmente; después orientar hacia una acción posible.

HISTORIAL Y CONTINUIDAD
Antes de responder, usá toda la información disponible del estado de acompañamiento que recibís.
NUNCA hagas que la persona empiece desde cero si ya la conocemos.
Ejemplo: "La última vez habíamos quedado en que ibas a avanzar con el trámite. ¿Cómo siguió?"

OPORTUNAI — HERRAMIENTA DE EMPLEABILIDAD
OportunAI es una herramienta dentro del recorrido de acompañamiento, no el fin.
Cuando empleo sea una prioridad:
→ Diagnóstico → OportunAI → perfil laboral → Video CV → postulaciones → seguimiento
NO: "Entrá a OportunAI." y fin.
SÍ: "Podemos empezar por tu perfil laboral. Cuando lo tengas listo, volvemos a hablar y seguimos con la búsqueda."
Perfil OportunAI: ${APP_URL}/dashboard
Diagnóstico Korai: https://app.korai.lat

RECURSOS MUNICIPALES — SAN ISIDRO
Cuando una dimensión esté en rojo/amarillo, mencioná el recurso más pertinente (no todos):
EMPLEO: Portal de Empleo Municipal → empleoycomercio.sanisidro.gob.ar | WA: (11) 3585-0997
Programa Joven (18-25): sanisidro.gob.ar/empleo/programa-joven
Mi Primer Empleo (jóvenes sin experiencia): sanisidro.gob.ar/trabajo-y-produccion/miprimerempleo
EDUCACIÓN: Punto Digital Bajo Boulogne (inclusión digital) | Jardines municipales: WA 11-5486-2159
INGRESOS: Acción Social: 4512-3174/75 | Subsidios: Integración Comunitaria (Ituzaingo 415) 4512-3120
SALUD: 3 hospitales municipales gratuitos. Turnos: 4707-1900 | 17 CAPS en el partido
VIVIENDA: Corporación San Isidro → corporacionsanisidro.com/requisitos | Urgencias: 4512-3120
RED: Integración Comunitaria → sic@sanisidro.gov.ar | 4512-3120/22/23/24

CASOS SENSIBLES
Si detectás violencia, emergencia social, salud mental o desempleo crítico:
respondé con contención, recomendá recursos (Línea 144, 147, ANSES) y colocá [ALERTA_HUMANA] al inicio.

EQUIPO HUMANO
Cuando la situación requiera intervención humana:
"Esto sería bueno que lo revise también el equipo que te acompaña. Puedo dejar registrada la situación."
Nunca inventés que una persona específica revisó el caso.

FORMATO WHATSAPP
Texto plano solamente. Máximo 2 emojis por mensaje. Respuestas de hasta 3-4 párrafos cortos.
Devolvé únicamente el texto del mensaje, sin comillas ni explicaciones.`;

// ── Generar respuesta principal ───────────────────────────────────────────────

async function generarRespuesta(
  usuario:          Record<string, unknown>,
  historial:        Array<{ tipo: string; texto: string }>,
  mensajeUsuario:   string,
  modulos:          Array<Record<string, unknown>>,
  ofertas:          Array<Record<string, unknown>>,
  semaforo:         Semaforo | null,
  estado:           EstadoAcompanamiento | null,
): Promise<string> {
  const nombre   = (usuario.nombre_completo as string) ?? "vecino/a";
  const cvDatos  = (usuario.cv_datos as Record<string, unknown>) ?? {};
  const bio      = (usuario.bio as string) ?? "";

  // Perfil
  const perfilLines = [
    `Nombre: ${nombre}`,
    bio ? `Bio: ${bio}` : "",
    cvDatos.resumen       ? `Resumen: ${cvDatos.resumen}` : "",
    cvDatos.nivel_estudios ? `Estudios: ${cvDatos.nivel_estudios}` : "",
    cvDatos.disponibilidad ? `Disponibilidad: ${cvDatos.disponibilidad}` : "",
    cvDatos.localidad      ? `Localidad: ${cvDatos.localidad}` : "",
    Array.isArray(cvDatos.habilidades) && cvDatos.habilidades.length > 0
      ? `Habilidades: ${(cvDatos.habilidades as string[]).join(", ")}` : "",
    Array.isArray(cvDatos.experiencia) && cvDatos.experiencia.length > 0
      ? `Experiencia: ${(cvDatos.experiencia as Array<{ cargo: string; empresa: string }>)
          .map(e => `${e.cargo} en ${e.empresa}`).join(", ")}` : "",
  ].filter(Boolean).join("\n");

  // Semáforo
  const tieneDiag = semaforo && DIMS_SEMAFORO.some(d => semaforo[d]);
  const diagTexto = tieneDiag && semaforo
    ? `DIAGNÓSTICO KORAI:\n${semaforoResumen(semaforo)}` +
      (dimensionesPrioritarias(semaforo).length > 0
        ? `\nDIMENSIONES PRIORITARIAS: ${dimensionesPrioritarias(semaforo).join(", ")}`
        : "")
    : "DIAGNÓSTICO KORAI: NO REALIZADO — invitarla a hacerlo en https://app.korai.lat (3 minutos)";

  // Estado de acompañamiento
  const estadoTexto = estado ? `
ESTADO DE ACOMPAÑAMIENTO:
${estado.situacion_actual ? `Situación actual: ${estado.situacion_actual}` : ""}
${Array.isArray(estado.prioridades) && estado.prioridades.length > 0 ? `Prioridades: ${estado.prioridades.join(", ")}` : ""}
${Array.isArray(estado.acciones_pendientes) && estado.acciones_pendientes.length > 0
  ? `Acciones pendientes:\n${(estado.acciones_pendientes as AccionPendiente[]).map(a => `  - ${a.descripcion}${a.contexto ? ` (${a.contexto})` : ""}`).join("\n")}` : ""}
${estado.proximo_paso ? `Próximo paso acordado: ${estado.proximo_paso}` : ""}
`.trim() : "ESTADO: Sin historial de acompañamiento previo — primer contacto.";

  // Oportunidades
  const modulosTexto = modulos.length > 0
    ? "MÓDULOS DE TRABAJO ACTIVOS:\n" + modulos.map(m =>
        `- ${m.titulo}${m.duracion_jornada ? ` (${m.duracion_jornada})` : ""}${m.precio_hora ? ` · $${m.precio_hora}/hs` : ""}${m.descripcion ? `: ${String(m.descripcion).slice(0, 80)}` : ""}`
      ).join("\n")
    : "";

  const ofertasTexto = ofertas.length > 0
    ? "OFERTAS ACTIVAS:\n" + ofertas.map(o =>
        `- ${o.titulo}${o.area ? ` [${o.area}]` : ""}${o.ciudad ? ` en ${o.ciudad}` : ""}`
      ).join("\n")
    : "";

  // Construir mensajes
  const messages: Array<{ role: string; content: string }> = [];
  for (const msg of historial.slice(-16)) {
    messages.push({
      role:    msg.tipo === "usuario" ? "user" : "assistant",
      content: msg.texto,
    });
  }

  const contextoBloque = `
[PERFIL]
${perfilLines || "Sin perfil completo."}

[${diagTexto}]

[${estadoTexto}]
${modulosTexto ? `\n[${modulosTexto}]` : ""}
${ofertasTexto ? `\n[${ofertasTexto}]` : ""}
`.trim();

  // Inyectar contexto en el último mensaje de usuario
  const mensajeConContexto = messages.length === 0
    ? `${contextoBloque}\n\n[MENSAJE]\n${mensajeUsuario}`
    : `${mensajeUsuario}\n\n[CONTEXTO ACTUALIZADO]\n${diagTexto}\n${estadoTexto}`;

  messages.push({ role: "user", content: mensajeConContexto });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":          ANTHROPIC_API_KEY,
      "anthropic-version":  "2023-06-01",
      "content-type":       "application/json",
    },
    body: JSON.stringify({
      model:      MODEL_CHAT,
      max_tokens: 450,
      system:     SYSTEM_PROMPT_KORAI,
      messages,
    }),
  });

  const data = await res.json() as Record<string, unknown>;
  const content = data.content as Array<{ type: string; text: string }>;
  return content?.[0]?.text ?? "Gracias por escribirnos. En un momento te atendemos.";
}

// ── Extraer estado post-conversación ──────────────────────────────────────────

async function extraerEstado(
  nombre:          string,
  historial:       Array<{ tipo: string; texto: string }>,
  mensajeUsuario:  string,
  respuestaBot:    string,
  estadoPrevio:    EstadoAcompanamiento | null,
): Promise<EstadoExtraido | null> {
  // Solo extraer si hay suficiente contenido
  if (!mensajeUsuario || mensajeUsuario.length < 10) return null;

  const conversacionTexto = [
    ...historial.slice(-8).map(m => `${m.tipo === "usuario" ? nombre : "Korai"}: ${m.texto}`),
    `${nombre}: ${mensajeUsuario}`,
    `Korai: ${respuestaBot}`,
  ].join("\n");

  const prompt = `Analizá esta conversación de acompañamiento y extraé el estado actualizado en JSON.

CONVERSACIÓN:
${conversacionTexto}

${estadoPrevio?.acciones_pendientes ? `ACCIONES PENDIENTES PREVIAS:\n${JSON.stringify(estadoPrevio.acciones_pendientes)}` : ""}

Extraé SOLO lo que se puede inferir de esta conversación. No inventes.
Si algo no fue mencionado, no lo incluyas.
Respondé SOLO con JSON válido, sin markdown:
{
  "situacion_actual": "resumen en 1-2 oraciones de la situación actual de la persona (null si no hay info)",
  "prioridades": ["..."],
  "acciones_pendientes": [{"descripcion": "...", "contexto": "..."}],
  "proximo_paso": "qué debe hacer la persona concretamente (null si no quedó claro)",
  "proximo_seguimiento_dias": 3
}

Para proximo_seguimiento_dias: 1 si es urgente, 3 si hay algo pendiente, 7 si es seguimiento normal, 14-30 si es solo mantenimiento.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":         ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      MODEL_EXTRA,
        max_tokens: 300,
        messages:   [{ role: "user", content: prompt }],
      }),
    });

    const data    = await res.json() as Record<string, unknown>;
    const content = data.content as Array<{ type: string; text: string }>;
    const text    = content?.[0]?.text?.trim() ?? "";
    return JSON.parse(text.replace(/```json|```/g, "").trim()) as EstadoExtraido;
  } catch (e) {
    console.warn("extraerEstado falló:", e);
    return null;
  }
}

// ── WhatsApp send ─────────────────────────────────────────────────────────────

async function enviarWhatsApp(numero: string, mensaje: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to:   numero,
      type: "text",
      text: { body: mensaje },
    }),
  });
  const data = await res.json();
  console.log("WA API status:", res.status, JSON.stringify(data));
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method === "GET") {
    const url       = new URL(req.url);
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
      // Autenticación del forward key
      if (KORAI_FORWARD_KEY) {
        const fwdKey = req.headers.get("x-forward-key") ?? "";
        if (fwdKey !== KORAI_FORWARD_KEY) {
          console.error("whatsapp_webhook: invalid x-forward-key");
          return new Response("Unauthorized", { status: 401 });
        }
      }

      const body   = await req.json() as Record<string, unknown>;
      const entry  = (body?.entry as Array<Record<string, unknown>>)?.[0];
      const change = (entry?.changes as Array<Record<string, unknown>>)?.[0];
      const value  = change?.value as Record<string, unknown>;
      const msgs   = value?.messages as Array<Record<string, unknown>>;

      if (!msgs || msgs.length === 0) return new Response("ok", { status: 200 });

      const msg  = msgs[0];
      if (msg.type !== "text") return new Response("ok", { status: 200 });

      const from  = msg.from as string;
      const texto = (msg.text as Record<string, unknown>)?.body as string;

      if (!from || !texto) return new Response("ok", { status: 200 });

      console.log(`Mensaje de: ${from}`);

      const usuario = await buscarUsuario(from);
      if (!usuario) {
        await enviarWhatsApp(from,
          "Hola 👋 No encontramos tu cuenta en OportunAI.\n\n" +
          `Registrate gratis en ${APP_URL} para que podamos acompañarte en tu búsqueda.`
        );
        return new Response("ok", { status: 200 });
      }

      if (!usuario.whatsapp_activo) return new Response("ok", { status: 200 });

      // Cargar todo en paralelo
      await guardarMensaje(usuario.id, "usuario", texto);
      const [historial, modulos, ofertas, estado] = await Promise.all([
        cargarHistorial(usuario.id),
        cargarModulos(),
        cargarOfertas(),
        cargarEstado(usuario.id),
      ]);

      const semaforo = (usuario.korai_semaforo ?? null) as Semaforo | null;

      // Generar respuesta
      const respuesta = await generarRespuesta(
        usuario, historial, texto, modulos, ofertas, semaforo, estado
      );

      // Enviar y guardar respuesta
      await Promise.all([
        enviarWhatsApp(from, respuesta),
        guardarMensaje(usuario.id, "bot", respuesta),
      ]);

      // Extraer estado en background (no bloquea la respuesta al usuario)
      extraerEstado(
        (usuario.nombre_completo as string).split(" ")[0],
        historial,
        texto,
        respuesta,
        estado,
      ).then(estadoExtraido => {
        if (estadoExtraido) {
          return actualizarEstado(usuario.id, estadoExtraido);
        }
      }).catch(e => console.warn("Error actualizando estado:", e));

      return new Response("ok", { status: 200 });
    } catch (err) {
      console.error("whatsapp_webhook error:", err);
      return new Response("ok", { status: 200 }); // siempre 200 a Meta
    }
  }

  return new Response("Method not allowed", { status: 405 });
});

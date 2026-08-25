/**
 * lib/push.ts — Web Push (VAPID) utilities
 *
 * Env vars required:
 *   VAPID_PUBLIC_KEY   — generá con: npx web-push generate-vapid-keys
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT      — mailto:hola@oportunai.com.ar (default)
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY — mismo valor que VAPID_PUBLIC_KEY (expuesto al cliente)
 */
import webpush from 'web-push';

const PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY  ?? '';
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? '';
const SUBJECT     = process.env.VAPID_SUBJECT     ?? 'mailto:hola@oportunai.com.ar';

if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body:  string;
  url:   string;   // ruta relativa a abrir al tocar la notificación
  tipo:  TipoPush;
  badge?: string;
  icon?:  string;
}

export type TipoPush =
  | 'accion_pendiente'
  | 'continuidad'
  | 'nueva_oportunidad'
  | 'seguimiento'
  | 'cambio_situacion'
  | 're_diagnostico';

export interface PushSub {
  endpoint: string;
  p256dh:   string;
  auth:     string;
}

/**
 * Envía un web push a una sola suscripción.
 * Devuelve true si fue enviado, false si el endpoint expiró (410/404).
 * Lanza error para otros fallos.
 */
export async function enviarPush(sub: PushSub, payload: PushPayload): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({
        ...payload,
        icon:  payload.icon  ?? '/icon-192.png',
        badge: payload.badge ?? '/badge-72.png',
      }),
      { TTL: 60 * 60 * 24 }, // 24hs de TTL — si el dispositivo está offline, el servidor lo entrega después
    );
    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) return false; // suscripción expirada
    throw err;
  }
}

export const VAPID_PUBLIC_KEY = PUBLIC_KEY;

# WhatsApp Bot — Setup completo

## Arquitectura

```
Usuario WhatsApp
      │ envía mensaje a 5491161210313
      ▼
Meta API
      │ llama webhook → Korai Supabase (jgqqkgfppovkbwklctol)
      ▼
Korai meta_webhook
      │ ¿es usuario Oportunai con bot activo?
      │   NO → Korai procesa normalmente
      │   SÍ → reenvía payload a Oportunai (con x-forward-key)
      ▼
Oportunai whatsapp_webhook (pqmqxsioxvgrturpgyhi)
      │ busca usuario en DB
      │ genera respuesta con Claude (claude-haiku-4-5-20251001)
      │ envía respuesta vía Meta API
      ▼
Usuario recibe respuesta
```

---

## Checklist de configuración

### 1. Proyecto Supabase de Oportunai (`pqmqxsioxvgrturpgyhi`)

Secrets → Edge Functions → Custom secrets:

| Secret               | Valor                              | Estado |
|----------------------|------------------------------------|--------|
| `WHATSAPP_TOKEN`     | token de acceso de Meta/Korai      | ✅ ok  |
| `WA_PHONE_NUMBER_ID` | phone number ID de 5491161210313   | ✅ ok  |
| `ANTHROPIC_API_KEY`  | clave de Anthropic                 | ✅ ok  |
| `KORAI_FORWARD_KEY`  | clave compartida con Korai         | ❓ verificar |

> `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` son automáticos — no hay que configurarlos.

### 2. Vercel — Variables de entorno

| Variable               | Valor                                                                 | Estado     |
|------------------------|-----------------------------------------------------------------------|------------|
| `OPORTUNAI_INTERNAL_KEY` | misma clave que `OPORTUNAI_INTERNAL_KEY` en Korai                   | ❓ agregar |
| `SUPABASE_FUNCTIONS_URL` | `https://pqmqxsioxvgrturpgyhi.supabase.co/functions/v1`            | ❓ agregar |
| `NEXT_PUBLIC_WA_SOPORTE` | `5491161210313`                                                     | ❓ verificar |

### 3. Proyecto Supabase de Korai (`jgqqkgfppovkbwklctol`)

Secrets → Edge Functions → Custom secrets:

| Secret                     | Valor                                                            |
|----------------------------|------------------------------------------------------------------|
| `OPORTUNAI_CHECK_URL`      | `https://oportunai.com.ar/api/whatsapp/check`                   |
| `OPORTUNAI_INTERNAL_KEY`   | clave inventada (ej: `optu_k3y_2024_abc123xyz`)                  |
| `OPORTUNAI_WEBHOOK_URL`    | `https://pqmqxsioxvgrturpgyhi.supabase.co/functions/v1/whatsapp_webhook` |
| `OPORTUNAI_SUPABASE_ANON_KEY` | anon key del proyecto Oportunai                              |
| `OPORTUNAI_FORWARD_KEY`    | misma clave que `KORAI_FORWARD_KEY` en Oportunai                |

### 4. Actualizar y deployar `meta_webhook` en Korai

Ver el snippet en `docs/korai-meta-webhook-routing.ts` para el código a agregar.

Luego:
```bash
# En el repo de Korai:
supabase functions deploy meta_webhook --project-ref jgqqkgfppovkbwklctol
```

---

## Flujo de opt-in correcto

1. Usuario activa el acompañamiento en el dashboard de Oportunai
2. Dashboard muestra: **"Escribile a OportunAI para activar"**
3. Usuario envía "Hola OportunAI" al número 5491161210313
4. Meta → Korai → chequeo → Oportunai → Claude → respuesta al usuario

⚠️ El bot NO puede enviar el primer mensaje. Meta sólo permite responder
dentro de las 24hs de que el usuario escriba primero (regla de ventana de conversación).

---

## Debug — Edge Function logs

Para ver si la función recibe mensajes:
1. Supabase Dashboard → Edge Functions → `whatsapp_webhook` → Logs
2. Buscar errores de `KORAI_FORWARD_KEY` inválido o `buscarUsuario` retornando null

### Test manual desde terminal

```bash
# Test de verificación webhook (GET)
curl "https://pqmqxsioxvgrturpgyhi.supabase.co/functions/v1/whatsapp_webhook?hub.mode=subscribe&hub.verify_token=oportunai-webhook-2024&hub.challenge=test123"
# → debe devolver: test123

# Test de mensaje entrante (POST) — reemplazar KORAI_FORWARD_KEY y ANON_KEY
curl -X POST "https://pqmqxsioxvgrturpgyhi.supabase.co/functions/v1/whatsapp_webhook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "x-forward-key: <KORAI_FORWARD_KEY>" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "type": "text",
            "from": "5491112345678",
            "text": { "body": "Hola, quiero activar el acompañamiento" }
          }]
        }
      }]
    }]
  }'
```

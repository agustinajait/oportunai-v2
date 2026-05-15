# Oportunai — Guía para desarrolladores

Este documento explica cómo está construido el sistema, dónde modificar cada cosa y cómo extenderlo. Está pensado para que cualquier desarrollador pueda continuar el proyecto sin fricción.

---

## 1. Modelo mental del sistema

```
Usuario se registra
  → slug autogenerado (nombre-apellido-últimos4dniDigits)

Usuario graba Video CV (o Pitch)
  → frontend: VideoRecorder.tsx
  → graba 4 módulos con MediaRecorder API (webm)
  → sube cada fragmento a POST /api/videos/upload
  → fragmentos se guardan en public/fragments/{userId}/
  → DB: Video { es_fragmento: true, orden_fragmento: 1..4 }

Al terminar todos los fragmentos
  → frontend llama POST /api/videos/merge
  → backend busca los 4 fragmentos en DB (ordenados)
  → FFmpeg los une en un .mp4 final
  → DB: Video { es_fragmento: false, video_url: "/videos/userId/file.mp4" }

Perfil público
  → /u/{slug}/cv  y  /u/{slug}/pitch
  → muestra solo videos con es_fragmento = false
  → Open Graph tags para WhatsApp/LinkedIn
```

---

## 2. Base de datos

### Modelos Prisma (`prisma/schema.prisma`)

#### `Usuario`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (cuid) | PK |
| `nombre_completo` | String | |
| `email` | String | único |
| `password_hash` | String | bcrypt 12 rounds |
| `telefono` | String | |
| `direccion` | String | |
| `dni` | String | único |
| `role` | Enum: `admin \| user` | default: user |
| `bio` | String? | editable por el usuario |
| `slug` | String | único, autogenerado al registrarse |
| `created_at` | DateTime | |

#### `Video`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (cuid) | PK |
| `user_id` | String | FK → Usuario |
| `tipo` | Enum: `video_cv \| video_pitch` | |
| `video_url` | String | ruta pública del archivo |
| `es_fragmento` | Boolean | true = fragmento parcial, false = video final |
| `orden_fragmento` | Int? | 1-4, solo para fragmentos |
| `modulo_id` | String? | ID del ConfiguracionVideo |
| `modulo_nombre` | String? | nombre del módulo grabado |
| `duracion_seg` | Int? | segundos reales grabados |
| `created_at` | DateTime | |

#### `ConfiguracionVideo`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (cuid) | PK |
| `tipo_video` | Enum: `video_cv \| video_pitch` | |
| `nombre_modulo` | String | ej. "Presentación" |
| `duracion_base` | Int | segundos base del módulo |
| `texto_guia` | String | instrucción que ve el usuario al grabar |
| `orden` | Int | 1-4 |

> **Importante:** `ConfiguracionVideo` es editable desde `/admin`. El frontend NUNCA hardcodea los módulos — los lee de la DB en cada render.

---

## 3. Flujo de grabación — detalle técnico

### Componente: `components/ui/VideoRecorder.tsx`

Este componente se reutiliza para ambos tipos. Recibe:
```typescript
{
  modulos: ConfiguracionVideo[]  // leídos de DB por la page server component
  session: SessionPayload
  tipo: 'video_cv' | 'video_pitch'
}
```

### Estados del grabador (`Stage`)
```
preview → countdown (3-2-1) → recording → between → (loop para sig. módulo)
                                                   → uploading → merging → done
                                                               → error
```

### Lógica de tiempo acumulativo
```typescript
// Cuando el usuario termina antes del tiempo asignado:
const elapsed  = tiempo_real_grabado
const leftover = duracion_efectiva - elapsed
setAccumulated(leftover)   // se suma al siguiente módulo

// Al inicio de cada módulo:
const efectivaDuration = modulo.duracion_base + accumulated
```

El acumulado se resetea a 0 cuando el tiempo se agota solo (sin intervención del usuario).

### MediaRecorder
- Formato preferido: `video/webm;codecs=vp9,opus`
- Fallback: `video/webm` → `video/mp4`
- Se graba con `timeslice=250ms` para chunks pequeños en memoria
- Al parar, se arma un `Blob` del tipo del recorder

---

## 4. Pipeline de video

### Upload de fragmentos (`POST /api/videos/upload`)
- Recibe cada fragmento como `multipart/form-data`
- Guarda en: `public/fragments/{userId}/{tipo}-orden{N}-{moduloId}-{ts}.webm`
- Crea registro en DB con `es_fragmento: true`

### Merge (`POST /api/videos/merge`)
```
1. Verificar FFmpeg disponible
2. Buscar fragmentos en DB (user_id + tipo + es_fragmento=true) ordenados por orden_fragmento
3. Verificar que los archivos existan en disco
4. Crear concat list para FFmpeg
5. Intentar -c copy (sin re-encodeo, más rápido)
   → Si falla: re-encodear con libx264 + aac (compatibilidad universal)
6. Guardar resultado en public/videos/{userId}/{tipo}-final-{ts}.mp4
7. Borrar video final anterior del mismo usuario+tipo (si existe)
8. Crear registro en DB con es_fragmento: false
```

### Descarga (`GET /api/videos/download?id=VIDEO_ID`)
- Solo sirve videos con `es_fragmento: false`
- Soporta Range requests (seek en móvil antes de descargar completo)
- Headers: `Content-Disposition: attachment`, `Content-Type: video/mp4`

---

## 5. Autenticación y seguridad

### JWT en cookie HttpOnly
```typescript
// lib/auth.ts
createToken(payload)      // genera JWT firmado con JWT_SECRET, expira en 7d
verifyToken(token)        // verifica y retorna SessionPayload | null
getSession()              // lee cookie en Server Components / Route Handlers
getSessionFromRequest()   // lee cookie en middleware
```

### Protección de rutas (`middleware.ts`)
- `/dashboard/*` → requiere sesión válida
- `/admin/*` → requiere `role === 'admin'`
- `/u/*` → público
- `/api/*` → cada route handler valida por su cuenta

### Validación de datos (`lib/validations.ts`)
- Todos los inputs pasan por schemas Zod antes de llegar a la DB
- Contraseñas: bcrypt 12 rounds
- Slugs: normalizados (sin acentos, sin caracteres especiales)

---

## 6. Dónde modificar cada cosa

### Cambiar los textos guía de grabación
→ Panel admin (`/admin`) → Tab "Configuración de video" → editar `texto_guia`

O directamente en la DB:
```sql
UPDATE "ConfiguracionVideo"
SET texto_guia = 'Nuevo texto'
WHERE tipo_video = 'video_cv' AND orden = 1;
```

### Cambiar la duración de un módulo
→ Panel admin → editar `duracion_base` (en segundos, mín 5, máx 120)

### Agregar un nuevo módulo al flujo
```sql
INSERT INTO "ConfiguracionVideo" (id, tipo_video, nombre_modulo, duracion_base, texto_guia, orden)
VALUES (gen_random_uuid(), 'video_cv', 'Nuevo módulo', 15, 'Texto guía', 5);
```
El frontend lo levanta automáticamente. No requiere cambios de código.

### Cambiar el número mínimo de fragmentos requeridos para merge
→ `app/api/videos/merge/route.ts` → cambiar `fragmentos.length < 2`

### Cambiar el formato de salida del video
→ `app/api/videos/merge/route.ts` → función `concatWithFFmpeg()` → modificar `cmdReencode`

### Agregar un nuevo campo al registro de usuario
1. Agregar columna en `prisma/schema.prisma`
2. Correr `npm run db:push`
3. Agregar al schema Zod en `lib/validations.ts`
4. Agregar el campo al form en `app/register/page.tsx`
5. Agregar al handler en `app/api/auth/register/route.ts`

---

## 7. Cómo extender el sistema

### Migrar almacenamiento a S3
Los archivos se guardan localmente en `public/`. Para migrar a S3:

1. Instalar AWS SDK: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
2. En `app/api/videos/upload/route.ts`: reemplazar `writeFile` por `PutObjectCommand`
3. En `app/api/videos/merge/route.ts`: después del merge, subir con `PutObjectCommand` y eliminar el local
4. En `app/api/videos/download/route.ts`: generar presigned URL con `GetObjectCommand`
5. Las URLs en DB pasarían de `/videos/...` a `https://bucket.s3.amazonaws.com/...`

Variables de entorno a agregar:
```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=oportunai-videos
```

### Agregar thumbnail al video
En `app/api/videos/merge/route.ts`, después del merge:
```typescript
const thumbPath = outputPath.replace('.mp4', '-thumb.jpg');
await execAsync(`ffmpeg -y -i "${outputPath}" -ss 00:00:01.000 -vframes 1 "${thumbPath}"`);
// Guardar thumbPath en DB (agregar columna thumbnail_url al modelo Video)
```

### Agregar Video Pitch al flujo (ya implementado)
El sistema soporta múltiples tipos via el enum `TipoVideo`. Para agregar un tercer tipo:
1. Agregar valor al enum en `prisma/schema.prisma`: `video_testimonial`
2. Correr `npm run db:push`
3. Crear ruta: `app/dashboard/grabar-testimonial/page.tsx`
4. Pasar `tipo="video_testimonial"` al `VideoRecorder`
5. Agregar módulos en `prisma/seed.js`

### Agregar analytics de visitas
Agregar tabla `VisitaPerfil` en schema con `user_id`, `tipo`, `created_at`, `ip_hash`.
En `app/u/[slug]/cv/page.tsx` y `pitch/page.tsx`, registrar la visita (server-side, sin JS del cliente).

### Deploy en producción

**Variables de entorno requeridas:**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=clave-muy-larga-y-aleatoria-min-32-chars
NEXT_PUBLIC_APP_URL=https://tudominio.com
FFMPEG_PATH=/usr/bin/ffmpeg   # si no está en PATH
```

**Checklist:**
- [ ] PostgreSQL accesible desde el servidor
- [ ] FFmpeg instalado: `ffmpeg -version`
- [ ] Directorios `public/fragments/`, `public/videos/`, `public/uploads/` con permisos de escritura
- [ ] `npm run build` sin errores
- [ ] `npm run db:push` aplicado en producción
- [ ] `npm run db:seed` corrido una vez para crear admin y módulos iniciales

---

## 8. Decisiones de diseño tomadas

| Decisión | Razón |
|---|---|
| Fragmentos guardados por separado | Permite regrabar módulos individuales en el futuro |
| `es_fragmento: false` para el video final | Una sola query filtra el video correcto sin joins complejos |
| JWT en cookie HttpOnly | Más seguro que localStorage; no expuesto a XSS |
| FFmpeg copia stream primero, re-encodea si falla | Óptimo de velocidad: mismos codecs = instantáneo; mixtos = sin error |
| `configuracion_video` editable en DB | Admin puede ajustar flujo sin deploy |
| Slug = nombre + últimos 4 dígitos DNI | Único, memorable, no revela el DNI completo |
| `public/` para almacenamiento | Simplifica MVP; S3 es drop-in replacement |

---

## 9. Endpoints API — referencia rápida

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | No | Registro con validación Zod |
| POST | `/api/auth/login` | No | Login, retorna cookie JWT |
| POST | `/api/auth/logout` | No | Borra cookie |
| GET | `/api/users/me` | Sí | Datos del usuario actual |
| PATCH | `/api/users/bio` | Sí | Actualizar bio |
| GET | `/api/users/[slug]` | No | Datos públicos del perfil |
| GET | `/api/users/[slug]/contact` | No | Contacto (solo bajo clic explícito) |
| POST | `/api/files/upload` | Sí | Subir CV (PDF/Word, máx 5MB) |
| GET | `/api/files/download?url=` | No | Descargar CV con headers correctos |
| POST | `/api/videos/upload` | Sí | Subir fragmento de video |
| POST | `/api/videos/merge` | Sí | Ejecutar FFmpeg concat |
| GET | `/api/videos/download?id=` | No | Descargar video final |
| GET | `/api/admin/config` | Admin | Listar configuración módulos |
| PATCH | `/api/admin/config` | Admin | Editar módulo (duración + guía) |
| GET | `/api/admin/users` | Admin | Listar todos los usuarios |

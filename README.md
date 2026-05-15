# Oportunai

Plataforma web para crear y compartir **Video CV** y **Video Pitch**.  
Diseñada para talleres de capacitación laboral — el usuario graba su presentación en módulos guiados, el sistema une los fragmentos con FFmpeg y genera una URL pública para compartir.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Base de datos | PostgreSQL + Prisma ORM |
| Auth | JWT en cookie HttpOnly (jose) |
| Estilos | Tailwind CSS |
| Tipografías | Fraunces (display) + DM Sans (cuerpo) |
| Procesamiento video | FFmpeg (CLI) |
| Almacenamiento | Local `/public/` (reemplazable por S3) |

---

## Instalación local

### Requisitos
- Node.js 18+
- PostgreSQL 14+ corriendo localmente
- FFmpeg instalado en el sistema

### 1 — Clonar e instalar
```bash
git clone <repo>
cd oportunai
npm install
```

### 2 — Variables de entorno
```bash
cp .env.example .env
```

Editá `.env`:
```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/oportunai"
JWT_SECRET="clave-secreta-larga-y-aleatoria"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Opcional — si ffmpeg no está en el PATH del sistema:
# FFMPEG_PATH="/usr/bin/ffmpeg"
```

### 3 — Base de datos
```bash
# Crear la base
psql -U postgres -c "CREATE DATABASE oportunai;"

# Aplicar el schema
npm run db:push

# Cargar datos iniciales (módulos CV + Pitch + usuario admin)
npm run db:seed
```

### 4 — Instalar FFmpeg
```bash
# Ubuntu / Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Verificar
ffmpeg -version
```

### 5 — Correr
```bash
npm run dev
# → http://localhost:3000
```

---

## Credenciales de prueba

| Campo | Valor |
|---|---|
| Email | `admin@oportunai.com` |
| Contraseña | `Admin1234!` |
| Acceso | `/admin` |

---

## Cómo crear un usuario admin manualmente

**Opción A — Desde psql:**
```sql
UPDATE "Usuario" SET role = 'admin' WHERE email = 'tu@email.com';
```

**Opción B — Prisma Studio:**
```bash
npm run db:studio
# Abre http://localhost:5555
# Tabla Usuario → cambiar role a "admin"
```

**Opción C — Script rápido:**
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.usuario.update({ where: { email: 'tu@email.com' }, data: { role: 'admin' } })
  .then(u => { console.log('Admin:', u.email); p.\$disconnect(); });
"
```

---

## Cómo probar el sistema completo

### Video CV
1. Ir a `/register` y crear una cuenta
2. Desde `/dashboard` → clic en **"Grabar Video CV"**
3. Aceptar permisos de cámara y micrófono
4. Seguir el flujo: preview → cuenta regresiva → 4 módulos → upload → merge
5. El video final aparece en el dashboard con estado **Grabado**
6. Perfil público: `http://localhost:3000/u/{slug}/cv`

### Video Pitch
Mismo flujo desde **"Grabar Video Pitch"** → perfil en `/u/{slug}/pitch`

### Perfil público
- Reproduce el video directamente
- Botón **Compartir perfil** → share nativo en móvil, copia link en desktop
- Botón **Descargar video** → descarga el `.mp4`
- Botón **Ver contacto** → revela teléfono, email, dirección
- Botón **Descargar CV** → descarga el PDF/Word si el usuario lo subió

### Panel admin
- URL: `/admin`
- Tab **Configuración de video**: editar duración y texto guía de cada módulo
- Tab **Usuarios**: ver todos los usuarios registrados

---

## Scripts disponibles

```bash
npm run dev          # Desarrollo (hot reload)
npm run build        # Build de producción
npm run start        # Servir build de producción
npm run db:push      # Aplicar schema a la DB (sin migraciones)
npm run db:studio    # Abrir Prisma Studio (GUI de la DB)
npm run db:seed      # Cargar datos iniciales
```

---

## Estructura del proyecto

```
oportunai/
├── app/
│   ├── page.tsx                    # Landing
│   ├── layout.tsx                  # Root layout + metadata global
│   ├── not-found.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx                # Server component — carga datos del usuario
│   │   ├── DashboardClient.tsx     # Client component — UI del dashboard
│   │   ├── grabar-cv/page.tsx      # Carga config Video CV → VideoRecorder
│   │   └── grabar-pitch/page.tsx   # Carga config Video Pitch → VideoRecorder
│   ├── admin/
│   │   ├── page.tsx                # Server component (solo role=admin)
│   │   └── AdminClient.tsx         # Editor de módulos + lista de usuarios
│   ├── u/[slug]/
│   │   ├── cv/page.tsx             # Perfil público Video CV + OG tags
│   │   └── pitch/page.tsx          # Perfil público Video Pitch + OG tags
│   └── api/
│       ├── auth/{login,register,logout}/
│       ├── users/{me,bio,[slug]/contact}/
│       ├── files/{upload,download}/
│       ├── videos/{upload,merge,download}/
│       └── admin/{config,users}/
├── components/
│   ├── layout/Navbar.tsx           # Barra de navegación autenticada
│   └── ui/
│       ├── VideoRecorder.tsx       # Componente de grabación (CV y Pitch)
│       └── PublicProfileClient.tsx # Perfil público (CV y Pitch)
├── lib/
│   ├── auth.ts                     # JWT, sesiones, generador de slug
│   ├── prisma.ts                   # Cliente Prisma singleton
│   └── validations.ts              # Schemas Zod
├── prisma/
│   ├── schema.prisma               # Modelos de DB
│   └── seed.js                     # Datos iniciales
├── styles/globals.css              # Estilos globales + variables CSS
├── middleware.ts                   # Protección de rutas
└── .env.example
```

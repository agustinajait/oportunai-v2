#!/bin/bash
# Genera todos los íconos de Android a partir de public/logo.png
# Requiere: ImageMagick (convert)
# Uso: bash scripts/generate-icons.sh

LOGO="public/logo.png"
ANDROID_RES="android/app/src/main/res"

if ! command -v convert &> /dev/null; then
  echo "Error: ImageMagick no está instalado. Corré: apt install imagemagick"
  exit 1
fi

if [ ! -f "$LOGO" ]; then
  echo "Error: No se encontró $LOGO"
  exit 1
fi

# Función para generar ícono con padding (fondo oscuro + logo centrado)
gen_icon() {
  local SIZE=$1
  local OUTPUT=$2
  local LOGO_SIZE=$((SIZE * 70 / 100))

  convert -size ${SIZE}x${SIZE} xc:"#0A0A0A" \
    \( "$LOGO" -resize ${LOGO_SIZE}x${LOGO_SIZE} \) \
    -gravity center -composite \
    -format png "$OUTPUT"
  echo "  ✓ $OUTPUT (${SIZE}x${SIZE})"
}

echo "Generando íconos Android..."

# mdpi (48x48)
gen_icon 48 "$ANDROID_RES/mipmap-mdpi/ic_launcher.png"
gen_icon 48 "$ANDROID_RES/mipmap-mdpi/ic_launcher_round.png"
gen_icon 108 "$ANDROID_RES/mipmap-mdpi/ic_launcher_foreground.png"

# hdpi (72x72)
gen_icon 72 "$ANDROID_RES/mipmap-hdpi/ic_launcher.png"
gen_icon 72 "$ANDROID_RES/mipmap-hdpi/ic_launcher_round.png"
gen_icon 162 "$ANDROID_RES/mipmap-hdpi/ic_launcher_foreground.png"

# xhdpi (96x96)
gen_icon 96 "$ANDROID_RES/mipmap-xhdpi/ic_launcher.png"
gen_icon 96 "$ANDROID_RES/mipmap-xhdpi/ic_launcher_round.png"
gen_icon 216 "$ANDROID_RES/mipmap-xhdpi/ic_launcher_foreground.png"

# xxhdpi (144x144)
gen_icon 144 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher.png"
gen_icon 144 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher_round.png"
gen_icon 324 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher_foreground.png"

# xxxhdpi (192x192)
gen_icon 192 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher.png"
gen_icon 192 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_round.png"
gen_icon 432 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_foreground.png"

# Splash screen (1024x1024)
convert -size 1024x1024 xc:"#0A0A0A" \
  \( "$LOGO" -resize 400x400 \) \
  -gravity center -composite \
  -format png "$ANDROID_RES/drawable/splash.png"
echo "  ✓ splash.png (1024x1024)"

echo ""
echo "✅ Íconos generados correctamente."
echo "Hacé 'npx cap sync android' y recompilá."

#!/usr/bin/env bash
set -euo pipefail

UUID="gocr@leonid.nasedkin"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
SCHEMA_DIR="$DEST/schemas"
SRC="$(cd "$(dirname "$0")" && pwd)"

echo "=== GOCR Extension Installer ==="

# --- Check dependencies ---
if ! command -v tesseract &>/dev/null; then
    echo ""
    echo "  ВНИМАНИЕ: tesseract не установлен."
    echo "  Установите командой:"
    echo "    sudo dnf install tesseract tesseract-langpack-rus"
    echo ""
fi

# --- Check gettext tools ---
if ! command -v msgfmt &>/dev/null; then
    echo "  ВНИМАНИЕ: msgfmt не найден (пакет gettext)."
    echo "  Установите: sudo dnf install gettext"
    echo "  Переводы не будут скомпилированы."
fi

# --- Copy extension files ---
mkdir -p "$SCHEMA_DIR"
cp "$SRC/metadata.json"  "$DEST/"
cp "$SRC/extension.js"   "$DEST/"
cp "$SRC/prefs.js"       "$DEST/"
cp "$SRC/stylesheet.css" "$DEST/"
cp "$SRC/schemas/"*.xml  "$SCHEMA_DIR/"
mkdir -p "$DEST/icons"
cp "$SRC/icons/"*.svg    "$DEST/icons/"

# --- Compile translations ---
if command -v msgfmt &>/dev/null; then
    for po_file in "$SRC/po/"*.po; do
        lang=$(basename "$po_file" .po)
        mo_dir="$DEST/locale/$lang/LC_MESSAGES"
        mkdir -p "$mo_dir"
        msgfmt "$po_file" -o "$mo_dir/$UUID.mo"
    done
    echo "Переводы скомпилированы."
fi

# --- Compile GSettings schema ---
glib-compile-schemas "$SCHEMA_DIR"
echo "Схема GSettings скомпилирована."

# --- Enable extension ---
if command -v gnome-extensions &>/dev/null; then
    gnome-extensions enable "$UUID" 2>/dev/null || true
    echo "Расширение включено (если уже загружено оболочкой)."
fi

echo ""
echo "Готово! Перезапустите GNOME Shell:"
echo "  • Wayland:  выйдите из сессии и войдите снова"
echo "  • X11:      нажмите Alt+F2, введите 'r', Enter"
echo ""
echo "После перезапуска горячая клавиша: Super+Shift+T"
echo "Сменить клавишу: Настройки расширений → GOCR → Настройки"

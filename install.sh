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
    echo "  WARNING: tesseract is not installed."
    echo "  Install it with:"
    echo "    sudo dnf install tesseract tesseract-langpack-rus"
    echo ""
fi

# --- Check gettext tools ---
if ! command -v msgfmt &>/dev/null; then
    echo "  WARNING: msgfmt not found (package: gettext)."
    echo "  Install it with: sudo dnf install gettext"
    echo "  Translations will not be compiled."
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
    echo "Translations compiled."
fi

# --- Compile GSettings schema ---
glib-compile-schemas "$SCHEMA_DIR"
echo "GSettings schema compiled."

# --- Enable extension ---
if command -v gnome-extensions &>/dev/null; then
    gnome-extensions enable "$UUID" 2>/dev/null || true
    echo "Extension enabled (if the shell has already loaded it)."
fi

echo ""
echo "Done! Restart GNOME Shell to activate the extension:"
echo "  • Wayland:  log out and log back in"
echo "  • X11:      press Alt+F2, type 'r', press Enter"
echo ""
echo "Default shortcut: Super+Shift+T"
echo "Change it in: Extensions → GOCR → Preferences"

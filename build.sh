#!/usr/bin/env bash
# Builds the extension archive for extensions.gnome.org / GitHub releases.
# Usage: ./build.sh [out-dir]   (default: dist/)
set -euo pipefail

cd "$(dirname "$0")"

UUID=$(python3 -c 'import json; print(json.load(open("metadata.json"))["uuid"])')
OUT_DIR=$(realpath -m "${1:-dist}")
ZIP="$OUT_DIR/$UUID.shell-extension.zip"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

cp metadata.json extension.js prefs.js stylesheet.css "$STAGE/"
mkdir -p "$STAGE/icons" "$STAGE/schemas"
cp icons/*.svg "$STAGE/icons/"
cp schemas/*.gschema.xml "$STAGE/schemas/"
glib-compile-schemas --strict --dry-run "$STAGE/schemas/"

for po_file in po/*.po; do
    lang=$(basename "$po_file" .po)
    mkdir -p "$STAGE/locale/$lang/LC_MESSAGES"
    msgfmt --check -o "$STAGE/locale/$lang/LC_MESSAGES/$UUID.mo" "$po_file"
done

mkdir -p "$OUT_DIR"
rm -f "$ZIP"
(cd "$STAGE" && zip -qr -X "$ZIP" .)

echo "$ZIP"

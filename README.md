# GOCR — Screen OCR for GNOME

**GNOME Shell extension** that lets you select any area of the screen, recognize the text in it with [Tesseract OCR](https://github.com/tesseract-ocr/tesseract), and copy the result to the clipboard. You can also copy the selected area as an image.

[Latest release](https://github.com/EvilX/gocr/releases/latest) · [GNOME Extensions](https://extensions.gnome.org/extension/9821/gocr/) · [Русская версия](README.ru.md)

## Features

- **OCR**: drag a rectangle over the screen, the recognized text goes to the clipboard and is shown in a notification
- **Screenshot**: copy the selected area to the clipboard as a PNG image (notification with a thumbnail)
- Configurable keyboard shortcuts and Tesseract language(s), e.g. `rus+eng`
- Optional Top Bar icon that starts OCR on click
- No external clipboard tools: works on Wayland and X11 out of the box

## Requirements

| Dependency | Fedora | Ubuntu/Debian |
|---|---|---|
| GNOME Shell 50–51 | — | — |
| `tesseract` | `sudo dnf install tesseract` | `sudo apt install tesseract-ocr` |
| Language data, e.g. Russian | `sudo dnf install tesseract-langpack-rus` | `sudo apt install tesseract-ocr-rus` |

List installed languages:

```bash
tesseract --list-langs
```

## Installation

Install from [extensions.gnome.org](https://extensions.gnome.org/extension/9821/gocr/), from the [latest release](https://github.com/EvilX/gocr/releases/latest/download/gocr@leonid.nasedkin.shell-extension.zip):

```bash
curl -LO https://github.com/EvilX/gocr/releases/latest/download/gocr@leonid.nasedkin.shell-extension.zip
gnome-extensions install --force gocr@leonid.nasedkin.shell-extension.zip
gnome-extensions enable gocr@leonid.nasedkin
```

or from source:

```bash
git clone https://github.com/EvilX/gocr.git
cd gocr
./install.sh
```

After installing or updating, log out and log back in so GNOME Shell loads the new code.

## Usage

| Action | Default shortcut | Result |
|---|---|---|
| OCR — recognize text | **Super + Shift + T** or click the Top Bar icon | Recognized text copied to clipboard |
| Screenshot — copy as image | **Alt + Shift + T** | Image copied to clipboard (paste into GIMP, Telegram, etc.) |
| Cancel selection | **Escape** | — |

Click and drag to draw a rectangle over any area of the screen. After you release the mouse button, the extension processes the area and shows a notification with the result.

## Settings

Open the preferences window via the **Extensions** app or:

```bash
gnome-extensions prefs gocr@leonid.nasedkin
```

| Setting | Description | Default |
|---|---|---|
| Show panel icon | Show the GOCR icon in the Top Bar | On |
| Capture Screen Area | Shortcut: select an area, run OCR, copy the text | Super+Shift+T |
| Copy Screenshot to Clipboard | Shortcut: select an area, copy it as an image | Alt+Shift+T |
| OCR Language | Tesseract language code(s), e.g. `eng`, `rus`, `rus+eng` | `rus+eng` |

To change a shortcut, click its row, press the key combination and release it. Escape cancels, the clear button removes the shortcut.

## Troubleshooting

**Text not recognized** — make sure the language data is installed (`tesseract --list-langs`) and listed in **OCR Language**.

**Screenshot does not paste** — some apps (e.g. browsers) accept images only as files, not from the clipboard. Use GIMP, Telegram or another app that supports pasting images with Ctrl+V.

**Logs** — `journalctl -f -o cat /usr/bin/gnome-shell`

## Building a release archive

```bash
./build.sh
```

This produces `dist/gocr@leonid.nasedkin.shell-extension.zip` ready for upload to extensions.gnome.org (requires `glib-compile-schemas`, `msgfmt` and `zip`).

## Development

```bash
npm install
npm run lint
npm test
```

GitHub Actions runs lint and tests on every push and pull request, then builds the archive (available as a workflow artifact).

To publish a release, bump `version` in `metadata.json`, commit, and push a matching tag:

```bash
git tag v5 && git push origin v5
```

The workflow checks that the tag matches `metadata.json` and creates a GitHub release with the archive attached.

## Adding a new translation

1. Copy `po/ru.po` to `po/<lang>.po` (e.g. `po/de.po`)
2. Translate the `msgstr` values
3. Run `./install.sh`: the new `.mo` file is compiled automatically

`npm test` checks that every translatable string in `extension.js` and `prefs.js` is translated in each `.po` file.

## Project structure

```
├── extension.js       Main logic (selection overlay, screenshot, OCR, clipboard)
├── prefs.js           Preferences UI (libadwaita)
├── stylesheet.css     Overlay and selection styles
├── metadata.json      Extension metadata
├── icons/gocr.svg     Top Bar icon
├── schemas/           GSettings schema
├── po/                Translation sources (.po)
├── install.sh         Install into ~/.local/share/gnome-shell/extensions
├── build.sh           Release archive build script
├── tests/             Unit tests (node:test)
└── .github/workflows/ CI: lint, tests, archive build, GitHub releases
```

## License

GPL-3.0-or-later

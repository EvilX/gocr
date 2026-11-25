# AGENTS.md

Guidance for AI coding agents working on this repository.

## Project

GOCR is a GNOME Shell extension (UUID `gocr@leonid.nasedkin`, GNOME Shell 50–51, ES modules / GJS). The user selects a screen area; the extension takes a screenshot with `Shell.Screenshot`, runs `tesseract` via `Gio.Subprocess` and puts the text (or the PNG image) on the clipboard with `St.Clipboard`.

| File | Role |
|---|---|
| `extension.js` | `GOCRExtension` (enable/disable, keybindings, capture pipeline), `SelectionOverlay`, `GcrIndicator`, pure helpers `selectionRect`, `notificationText` |
| `prefs.js` | libadwaita preferences window, `ShortcutRow` for capturing accelerators |
| `schemas/org.gnome.shell.extensions.gocr.gschema.xml` | Settings: `capture-shortcut`, `screenshot-shortcut`, `show-indicator`, `ocr-language` |
| `po/ru.po`, `po/POTFILES` | Russian translation and the list of translatable sources |
| `stylesheet.css`, `icons/gocr.svg` | Overlay styles and Top Bar icon |
| `docs/icon.svg` | Project logo for the READMEs (not shipped with the extension) |
| `install.sh` | Installs into `~/.local/share/gnome-shell/extensions/` |
| `build.sh` | Builds `dist/<uuid>.shell-extension.zip` |
| `tests/` | `node:test` unit tests; `stubs.mjs` fakes `gi://` and `resource://` imports |
| `.github/workflows/ci.yml` | Lint + tests → build archive → GitHub release on `v*` tags |

## Commands

```bash
npm install          # dev dependencies (eslint)
npm run lint         # ESLint
npm test             # unit tests under Node
./build.sh           # release archive into dist/
./install.sh         # install locally, then log out/in to reload GNOME Shell (Wayland)
```

Run `npm run lint && npm test` before committing. If Node is not installed locally, use a container: `podman run --rm -v "$PWD":/app:Z -w /app node:22 sh -c 'npm ci && npm run lint && npm test'`.

## Rules

- Follow the [GNOME Shell extension review guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html): create objects and connect signals only in `enable()`, destroy/disconnect everything in `disable()`, no work at module load beyond class definitions, no synchronous subprocess calls in the shell process.
- Keep logic that can be tested without GNOME in exported pure functions and cover it in `tests/`. When importing a new `gi://` or `resource://` module that is touched at module load, add a stub to `tests/stubs.mjs`.
- `_` is the gettext function: never name a `catch` parameter `_` (use `_e`).
- Every user-visible string goes through `_()` and must be translated in every `po/*.po`; tests fail on missing or obsolete entries. Keep msgids in English.
- A new settings key needs: the schema, the prefs UI, a README settings row (both `README.md` and `README.ru.md`), and the key list in `tests/metadata.test.mjs`.
- New files shipped with the extension must be added to both `install.sh` and `build.sh`.
- Keep `README.md` (English) and `README.ru.md` (Russian) in sync.

## Releases

1. Bump the integer `version` in `metadata.json` (and `Project-Id-Version` in `po/ru.po`).
2. Commit, then tag `v<version>` and push the tag: `git tag v5 && git push origin master v5`.
3. CI verifies the tag matches `metadata.json` and publishes a GitHub release with the archive. Upload the same archive to extensions.gnome.org manually.

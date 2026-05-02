# GOCR — Screen OCR for GNOME

A GNOME Shell extension that lets you select any area of the screen, recognize the text in it with Tesseract OCR, and copy the result to the clipboard.

---

## English

### Requirements

| Dependency | Install (Fedora) | Install (Ubuntu/Debian) |
|---|---|---|
| GNOME Shell 45–50 | — | — |
| `tesseract` | `sudo dnf install tesseract` | `sudo apt install tesseract-ocr` |
| Russian language pack | `sudo dnf install tesseract-langpack-rus` | `sudo apt install tesseract-ocr-rus` |

To see all installed languages:
```bash
tesseract --list-langs
```

### Installation

```bash
git clone https://github.com/EvilX/gocr
cd gocr
bash install.sh
```

Then **log out and log back in** (required on Wayland to reload GNOME Shell).

### Usage

| Action | How |
|---|---|
| Activate | Press **Super + Shift + T** or click the panel icon |
| Select area | Click and drag to draw a rectangle |
| Cancel | Press **Escape** |

After you release the mouse button, the extension captures the selected area, runs OCR, and copies the recognized text to the clipboard. A notification shows the result.

### Settings

Open **GNOME Extensions** → **GOCR** → **Preferences** to:

- **Change the keyboard shortcut** — click the shortcut row, then press the new key combination. Press Escape to cancel.
- **Change the OCR language** — enter a Tesseract language code (e.g. `eng`, `rus`, `rus+eng`).

### Project structure

```
gocr@leonid.nasedkin/
├── extension.js      — main logic (overlay, screenshot, OCR, clipboard)
├── prefs.js          — preferences window
├── stylesheet.css    — overlay and selection styles
├── metadata.json     — extension metadata
├── icons/
│   └── gocr-symbolic.svg   — panel icon
├── schemas/
│   └── org.gnome.shell.extensions.gocr.gschema.xml
└── install.sh        — install script
```

### Troubleshooting

**Text not recognized** — make sure the required language pack is installed (`tesseract --list-langs`).

**Shell freezes after an error** — this was fixed in the current version. If it still happens, press `Super` to open the Activities view and then close it; this resets the input focus.

**Icon not showing** — try disabling and re-enabling the extension in GNOME Extensions after relogging.

---

## Русский

### Требования

| Зависимость | Установка (Fedora) | Установка (Ubuntu/Debian) |
|---|---|---|
| GNOME Shell 45–50 | — | — |
| `tesseract` | `sudo dnf install tesseract` | `sudo apt install tesseract-ocr` |
| Пакет русского языка | `sudo dnf install tesseract-langpack-rus` | `sudo apt install tesseract-ocr-rus` |

Просмотр установленных языков:
```bash
tesseract --list-langs
```

### Установка

```bash
git clone https://github.com/EvilX/gocr
cd gocr
bash install.sh
```

После этого **выйдите из сессии и войдите снова** — на Wayland GNOME Shell не перезапускается иначе.

### Использование

| Действие | Способ |
|---|---|
| Активация | Нажмите **Super + Shift + T** или кликните иконку на панели |
| Выделение области | Нажмите и перетащите мышь, чтобы нарисовать прямоугольник |
| Отмена | Нажмите **Escape** |

После отпускания кнопки мыши расширение делает снимок выделенной области, запускает Tesseract, распознанный текст копируется в буфер обмена. Уведомление показывает результат.

### Настройки

Откройте **Расширения GNOME** → **GOCR** → **Настройки**:

- **Изменить горячую клавишу** — кликните на строку комбинации, затем нажмите новую комбинацию клавиш. Escape — отмена.
- **Изменить язык OCR** — введите код языка Tesseract (например `rus`, `eng`, `rus+eng`).

### Структура проекта

```
gocr@leonid.nasedkin/
├── extension.js      — основная логика (оверлей, скриншот, OCR, буфер обмена)
├── prefs.js          — окно настроек
├── stylesheet.css    — стили оверлея и выделения
├── metadata.json     — метаданные расширения
├── icons/
│   └── gocr-symbolic.svg   — иконка на панели
├── schemas/
│   └── org.gnome.shell.extensions.gocr.gschema.xml
└── install.sh        — скрипт установки
```

### Решение проблем

**Текст не распознаётся** — убедитесь, что нужный языковой пакет установлен (`tesseract --list-langs`).

**Shell зависает после ошибки** — исправлено в текущей версии. Если всё же происходит — нажмите `Super` для открытия Activities и закройте его; это сбрасывает захват ввода.

**Иконка не отображается** — после повторного входа попробуйте выключить и включить расширение в GNOME Extensions.

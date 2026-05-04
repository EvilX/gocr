# GOCR — Screen OCR for GNOME

A GNOME Shell extension that lets you select any area of the screen, recognize the text in it with Tesseract OCR, and copy the result to the clipboard. You can also copy the selected area as an image.

[Gnome Extenstions](https://extensions.gnome.org/extension/9821/gocr/)

---

## English

### Requirements

| Dependency | Install (Fedora) | Install (Ubuntu/Debian) |
|---|---|---|
| GNOME Shell 45–50 | — | — |
| `tesseract` | `sudo dnf install tesseract` | `sudo apt install tesseract-ocr` |
| Russian language pack | `sudo dnf install tesseract-langpack-rus` | `sudo apt install tesseract-ocr-rus` |
| `wl-clipboard` (for screenshot copy) | `sudo dnf install wl-clipboard` | `sudo apt install wl-clipboard` |

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

| Action | Default shortcut | Result |
|---|---|---|
| OCR — recognize text | **Super + Shift + T** or panel icon click | Recognized text copied to clipboard |
| Screenshot — copy as image | **Alt + Shift + T** | Screenshot copied to clipboard (paste in GIMP, Telegram, etc.) |
| Cancel selection | **Escape** | — |

Click and drag to draw a rectangle over any area of the screen. After you release the mouse button, the extension processes the selected area and shows a notification with the result.

### Settings

Open **GNOME Extensions** → **GOCR** → **Preferences** to:

- **Capture Screen Area** — shortcut that captures, runs OCR, and copies the recognized text.
- **Copy Screenshot to Clipboard** — shortcut that copies the selected area as a PNG image.
- **OCR Language** — enter a Tesseract language code (e.g. `eng`, `rus`, `rus+eng`).

Click a shortcut row, press the desired key combination, then release. Press Escape to cancel.

### Project structure

```
gocr@leonid.nasedkin/
├── extension.js      — main logic (overlay, screenshot, OCR, clipboard)
├── prefs.js          — preferences window
├── stylesheet.css    — overlay and selection styles
├── metadata.json     — extension metadata
├── icons/
│   └── gocr.svg            — panel icon
├── schemas/
│   └── org.gnome.shell.extensions.gocr.gschema.xml
├── po/
│   └── ru.po               — Russian translation
└── publish.sh        — bundle script for extensions.gnome.org
```

### Troubleshooting

**Text not recognized** — make sure the required language pack is installed (`tesseract --list-langs`).

**Screenshot not pasting** — some apps (e.g. browsers) only accept images from files, not the internal clipboard. Use GIMP, Telegram, or any app that supports Ctrl+V image paste.

---

## Русский

### Требования

| Зависимость | Установка (Fedora) | Установка (Ubuntu/Debian) |
|---|---|---|
| GNOME Shell 45–50 | — | — |
| `tesseract` | `sudo dnf install tesseract` | `sudo apt install tesseract-ocr` |
| Пакет русского языка | `sudo dnf install tesseract-langpack-rus` | `sudo apt install tesseract-ocr-rus` |
| `wl-clipboard` (для копирования скриншота) | `sudo dnf install wl-clipboard` | `sudo apt install wl-clipboard` |

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

| Действие | Комбинация по умолчанию | Результат |
|---|---|---|
| OCR — распознать текст | **Super + Shift + T** или клик по иконке на панели | Распознанный текст скопирован в буфер обмена |
| Скриншот — скопировать как изображение | **Alt + Shift + T** | Скриншот скопирован в буфер обмена (вставить в GIMP, Telegram и т.д.) |
| Отмена выделения | **Escape** | — |

Нажмите и перетащите мышь, чтобы выделить область экрана. После отпускания кнопки расширение обработает область и покажет уведомление с результатом.

### Настройки

Откройте **Расширения GNOME** → **GOCR** → **Настройки**:

- **Захват области экрана** — комбинация для распознавания текста (OCR) и копирования результата.
- **Скопировать скриншот в буфер обмена** — комбинация для копирования выделенной области как изображения.
- **Язык OCR** — код языка Tesseract (например `rus`, `eng`, `rus+eng`).

Нажмите на строку комбинации, введите нужную комбинацию клавиш, отпустите. Escape — отмена.

### Структура проекта

```
gocr@leonid.nasedkin/
├── extension.js      — основная логика (оверлей, скриншот, OCR, буфер обмена)
├── prefs.js          — окно настроек
├── stylesheet.css    — стили оверлея и выделения
├── metadata.json     — метаданные расширения
├── icons/
│   └── gocr.svg            — иконка на панели
├── schemas/
│   └── org.gnome.shell.extensions.gocr.gschema.xml
├── po/
│   └── ru.po               — русский перевод
└── publish.sh        — скрипт сборки для extensions.gnome.org
```

### Решение проблем

**Текст не распознаётся** — убедитесь, что нужный языковой пакет установлен (`tesseract --list-langs`).

**Скриншот не вставляется** — некоторые приложения (например, браузеры) принимают изображения только из файлов, а не из внутреннего буфера обмена. Используйте GIMP, Telegram или любое приложение, поддерживающее вставку изображений через Ctrl+V.

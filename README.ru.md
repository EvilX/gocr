# GOCR — распознавание текста с экрана для GNOME

**Расширение для GNOME Shell**: выделите любую область экрана, текст в ней распознаётся с помощью [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) и копируется в буфер обмена. Выделенную область также можно скопировать как изображение.

[Последний релиз](https://github.com/EvilX/gocr/releases/latest) · [GNOME Extensions](https://extensions.gnome.org/extension/9821/gocr/) · [English version](README.md)

## Возможности

- **OCR**: выделите прямоугольник на экране — распознанный текст попадёт в буфер обмена и появится в уведомлении
- **Скриншот**: копирование выделенной области в буфер обмена как PNG (уведомление с миниатюрой)
- Настраиваемые горячие клавиши и языки Tesseract, например `rus+eng`
- Необязательная иконка на верхней панели — запуск OCR по клику
- Не нужны внешние утилиты для буфера обмена: работает на Wayland и X11

## Требования

| Зависимость | Fedora | Ubuntu/Debian |
|---|---|---|
| GNOME Shell 50–51 | — | — |
| `tesseract` | `sudo dnf install tesseract` | `sudo apt install tesseract-ocr` |
| Языковые данные, например русский | `sudo dnf install tesseract-langpack-rus` | `sudo apt install tesseract-ocr-rus` |

Список установленных языков:

```bash
tesseract --list-langs
```

## Установка

Установите с [extensions.gnome.org](https://extensions.gnome.org/extension/9821/gocr/), из [последнего релиза](https://github.com/EvilX/gocr/releases/latest/download/gocr@leonid.nasedkin.shell-extension.zip):

```bash
curl -LO https://github.com/EvilX/gocr/releases/latest/download/gocr@leonid.nasedkin.shell-extension.zip
gnome-extensions install --force gocr@leonid.nasedkin.shell-extension.zip
gnome-extensions enable gocr@leonid.nasedkin
```

или из исходников:

```bash
git clone https://github.com/EvilX/gocr.git
cd gocr
./install.sh
```

После установки или обновления выйдите из сессии и войдите снова, чтобы GNOME Shell загрузил новый код.

## Использование

| Действие | Комбинация по умолчанию | Результат |
|---|---|---|
| OCR — распознать текст | **Super + Shift + T** или клик по иконке на панели | Распознанный текст скопирован в буфер обмена |
| Скриншот — скопировать как изображение | **Alt + Shift + T** | Изображение скопировано в буфер обмена (вставка в GIMP, Telegram и т.д.) |
| Отмена выделения | **Escape** | — |

Нажмите и перетащите мышь, чтобы выделить область экрана. После отпускания кнопки расширение обработает область и покажет уведомление с результатом.

## Настройки

Откройте окно настроек через приложение **Расширения** или командой:

```bash
gnome-extensions prefs gocr@leonid.nasedkin
```

| Настройка | Описание | По умолчанию |
|---|---|---|
| Показывать иконку на панели | Иконка GOCR на верхней панели | Вкл. |
| Захват области экрана | Комбинация: выделить область, распознать текст, скопировать | Super+Shift+T |
| Скопировать скриншот в буфер обмена | Комбинация: выделить область, скопировать как изображение | Alt+Shift+T |
| Язык OCR | Код(ы) языка Tesseract, например `eng`, `rus`, `rus+eng` | `rus+eng` |

Чтобы изменить комбинацию, нажмите на строку, введите комбинацию клавиш и отпустите. Escape — отмена, кнопка очистки удаляет комбинацию.

## Решение проблем

**Текст не распознаётся** — убедитесь, что языковые данные установлены (`tesseract --list-langs`) и указаны в поле **Язык OCR**.

**Скриншот не вставляется** — некоторые приложения (например, браузеры) принимают изображения только как файлы, а не из буфера обмена. Используйте GIMP, Telegram или другое приложение, поддерживающее вставку изображений через Ctrl+V.

**Логи** — `journalctl -f -o cat /usr/bin/gnome-shell`

## Сборка архива для релиза

```bash
./build.sh
```

Создаёт `dist/gocr@leonid.nasedkin.shell-extension.zip`, готовый для загрузки на extensions.gnome.org (нужны `glib-compile-schemas`, `msgfmt` и `zip`).

## Разработка

```bash
npm install
npm run lint
npm test
```

GitHub Actions запускает линтер и тесты при каждом push и pull request, затем собирает архив (доступен как артефакт workflow).

Чтобы выпустить релиз, увеличьте `version` в `metadata.json`, сделайте коммит и запушьте соответствующий тег:

```bash
git tag v5 && git push origin v5
```

Workflow проверяет, что тег совпадает с версией в `metadata.json`, и создаёт GitHub-релиз с приложенным архивом.

## Добавление нового перевода

1. Скопируйте `po/ru.po` в `po/<lang>.po` (например, `po/de.po`)
2. Переведите значения `msgstr`
3. Запустите `./install.sh` — новый `.mo`-файл скомпилируется автоматически

`npm test` проверяет, что каждая переводимая строка из `extension.js` и `prefs.js` переведена в каждом `.po`-файле.

## Структура проекта

```
├── extension.js       Основная логика (оверлей выделения, скриншот, OCR, буфер обмена)
├── prefs.js           Окно настроек (libadwaita)
├── stylesheet.css     Стили оверлея и выделения
├── metadata.json      Метаданные расширения
├── icons/gocr.svg     Иконка на верхней панели
├── schemas/           Схема GSettings
├── po/                Исходники переводов (.po)
├── install.sh         Установка в ~/.local/share/gnome-shell/extensions
├── build.sh           Сборка архива для релиза
├── tests/             Модульные тесты (node:test)
└── .github/workflows/ CI: линтер, тесты, сборка архива, GitHub-релизы
```

## Лицензия

GPL-3.0-or-later

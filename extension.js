import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

// ---------------------------------------------------------------------------
// Panel indicator — overrides _onButtonPress so our button-press-event handler
// is not blocked by PanelMenu.Button's own handler (which returns EVENT_STOP
// via Clutter's boolean-handled accumulator, suppressing all later handlers).
// ---------------------------------------------------------------------------
const GcrIndicator = GObject.registerClass(
class GcrIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'GOCR', true); // true = no popup menu
    }

    _onButtonPress(_actor, _event) {
        return Clutter.EVENT_PROPAGATE; // let our connected handler run
    }
});

// ---------------------------------------------------------------------------
// Selection overlay — lets the user drag a rectangle over the screen
// ---------------------------------------------------------------------------
const SelectionOverlay = GObject.registerClass({
    Signals: {
        'area-selected': {
            param_types: [
                GObject.TYPE_INT, GObject.TYPE_INT,
                GObject.TYPE_INT, GObject.TYPE_INT,
            ],
        },
        'cancelled': {},
    },
}, class SelectionOverlay extends St.Widget {
    _init() {
        const monitor = Main.layoutManager.primaryMonitor;

        super._init({
            reactive: true,
            can_focus: true,
            x: 0,
            y: 0,
            width: global.stage.width,
            height: global.stage.height,
            style_class: 'gocr-overlay',
        });

        // Selection rectangle drawn on top of the dim overlay
        this._selBox = new St.Widget({
            style_class: 'gocr-selection',
            visible: false,
        });
        this.add_child(this._selBox);

        // Hint label at the top center
        this._hint = new St.Label({
            style_class: 'gocr-hint',
            text: _('Select area — Escape to cancel'),
        });
        this._hint.set_position(
            Math.round((global.stage.width - 340) / 2), 18
        );
        this.add_child(this._hint);

        // Set crosshair cursor on this actor — reverts automatically on destroy
        try {
            this.set_cursor_type(Clutter.CursorType.CROSSHAIR ?? Clutter.CursorType.crosshair);
        } catch (_) {}

        this._startX = 0;
        this._startY = 0;
        this._dragging = false;

        this.connect('button-press-event',   this._onPress.bind(this));
        this.connect('motion-event',         this._onMotion.bind(this));
        this.connect('button-release-event', this._onRelease.bind(this));
        this.connect('key-press-event',      this._onKey.bind(this));
    }

    _onPress(_actor, event) {
        if (event.get_button() !== 1)
            return Clutter.EVENT_PROPAGATE;

        [this._startX, this._startY] = event.get_coords();
        this._dragging = true;
        this._selBox.set_position(this._startX, this._startY);
        this._selBox.set_size(0, 0);
        this._selBox.show();
        return Clutter.EVENT_STOP;
    }

    _onMotion(_actor, event) {
        if (!this._dragging)
            return Clutter.EVENT_PROPAGATE;

        const [x, y] = event.get_coords();
        this._selBox.set_position(
            Math.min(x, this._startX),
            Math.min(y, this._startY)
        );
        this._selBox.set_size(
            Math.abs(x - this._startX),
            Math.abs(y - this._startY)
        );
        return Clutter.EVENT_STOP;
    }

    _onRelease(_actor, event) {
        if (!this._dragging)
            return Clutter.EVENT_PROPAGATE;

        this._dragging = false;
        const [x, y] = event.get_coords();
        const x1 = Math.round(Math.min(x, this._startX));
        const y1 = Math.round(Math.min(y, this._startY));
        const w  = Math.round(Math.abs(x - this._startX));
        const h  = Math.round(Math.abs(y - this._startY));

        if (w > 4 && h > 4)
            this.emit('area-selected', x1, y1, w, h);
        else
            this.emit('cancelled');

        return Clutter.EVENT_STOP;
    }

    _onKey(_actor, event) {
        if (event.get_key_symbol() === Clutter.KEY_Escape)
            this.emit('cancelled');
        return Clutter.EVENT_STOP;
    }
});

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------
export default class GOCRExtension extends Extension {

    enable() {
        this.initTranslations();
        this._settings = this.getSettings();

        // Panel indicator button
        this._indicator = new GcrIndicator();
        const icon = new St.Icon({
            gicon: Gio.icon_new_for_string(`${this.path}/icons/gocr.svg`),
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(icon);
        this._indicatorPressId = this._indicator.connect('button-press-event', () => {
            this._startCapture('ocr');
            return Clutter.EVENT_STOP;
        });
        Main.panel.addToStatusArea('gocr', this._indicator);

        // Keyboard shortcuts
        Main.wm.addKeybinding(
            'capture-shortcut',
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => this._startCapture('ocr')
        );
        Main.wm.addKeybinding(
            'screenshot-shortcut',
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => this._startCapture('screenshot')
        );

        this._overlay = null;
        this._captureInProgress = false;
    }

    disable() {
        this._captureInProgress = false;
        this._removeOverlay();

        Main.wm.removeKeybinding('capture-shortcut');
        Main.wm.removeKeybinding('screenshot-shortcut');

        if (this._indicator) {
            if (this._indicatorPressId) {
                this._indicator.disconnect(this._indicatorPressId);
                this._indicatorPressId = null;
            }
            this._indicator.destroy();
            this._indicator = null;
        }

        this._settings = null;
    }

    // -----------------------------------------------------------------------
    // Overlay management
    // -----------------------------------------------------------------------

    _startCapture(action = 'ocr') {
        if (this._overlay || this._captureInProgress)
            return;

        this._overlay = new SelectionOverlay();
        this._overlayAreaId = this._overlay.connect('area-selected', (_o, x, y, w, h) => {
            const task = action === 'screenshot'
                ? this._copyScreenshot(x, y, w, h)
                : this._captureArea(x, y, w, h);
            task.catch(e => Main.notify(_('GOCR — Error'), String(e)));
        });
        this._overlayCancelId = this._overlay.connect('cancelled', () => this._removeOverlay());

        Main.layoutManager.addTopChrome(this._overlay);

        this._modalPushed = Main.pushModal(this._overlay);
        if (!this._modalPushed) {
            this._removeOverlay();
            return;
        }

        this._overlay.grab_key_focus();

        // Listen for Escape on the stage — reliable regardless of overlay focus
        this._stageKeyId = global.stage.connect('key-press-event', (_s, event) => {
            if (event.get_key_symbol() === Clutter.KEY_Escape) {
                this._removeOverlay();
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });
    }

    _removeOverlay() {
        if (this._stageKeyId) {
            try { global.stage.disconnect(this._stageKeyId); } catch (_) {}
            this._stageKeyId = null;
        }

        if (!this._overlay)
            return;

        if (this._overlayAreaId) {
            try { this._overlay.disconnect(this._overlayAreaId); } catch (_) {}
            this._overlayAreaId = null;
        }
        if (this._overlayCancelId) {
            try { this._overlay.disconnect(this._overlayCancelId); } catch (_) {}
            this._overlayCancelId = null;
        }
        if (this._modalPushed) {
            try { Main.popModal(this._overlay); } catch (_) {}
            this._modalPushed = false;
        }
        try { Main.layoutManager.removeChrome(this._overlay); } catch (_) {}
        try { this._overlay.destroy(); } catch (_) {}
        this._overlay = null;
    }

    // -----------------------------------------------------------------------
    // Capture → OCR → clipboard pipeline
    // -----------------------------------------------------------------------

    async _captureArea(x, y, w, h) {
        this._removeOverlay();
        this._captureInProgress = true;

        // Let the overlay fully disappear before taking the screenshot
        await this._sleep(150);

        const tmpFile = `/tmp/gocr_${GLib.get_monotonic_time()}.png`;

        try {
            await this._screenshotArea(x, y, w, h, tmpFile);
            const text = await this._runTesseract(tmpFile);
            const trimmed = text.trim();

            if (trimmed) {
                // Core purpose: write OCR-recognised text to clipboard (write-only, no read)
                St.Clipboard.get_default().set_text(
                    St.ClipboardType.CLIPBOARD, trimmed
                );
                Main.notify('GOCR', trimmed.length > 200 ? trimmed.slice(0, 200) + '…' : trimmed);
            } else {
                Main.notify('GOCR', _('Text not detected'));
            }
        } finally {
            this._captureInProgress = false;
            try {
                Gio.File.new_for_path(tmpFile).delete(null);
            } catch (_) { /* already gone */ }
        }
    }

    async _copyScreenshot(x, y, w, h) {
        this._removeOverlay();
        this._captureInProgress = true;

        await this._sleep(150);
        const tmpFile = `/tmp/gocr_${GLib.get_monotonic_time()}.png`;

        try {
            await this._screenshotArea(x, y, w, h, tmpFile);
            await this._wlCopy(tmpFile);

            // Copy to cache so the file outlives the tmp cleanup below
            const thumbPath = `${GLib.get_user_cache_dir()}/gocr_screenshot.png`;
            try {
                Gio.File.new_for_path(tmpFile).copy(
                    Gio.File.new_for_path(thumbPath),
                    Gio.FileCopyFlags.OVERWRITE, null, null
                );
                this._notifyWithThumb(_('Screenshot copied to clipboard'), thumbPath);
            } catch (_e) {
                Main.notify('GOCR', _('Screenshot copied to clipboard'));
            }
        } finally {
            this._captureInProgress = false;
            try { Gio.File.new_for_path(tmpFile).delete(null); } catch (_) {}
        }
    }

    _notifyWithThumb(body, imagePath) {
        const source = new MessageTray.Source({
            title: 'GOCR',
            iconName: 'edit-copy-symbolic',
        });
        Main.messageTray.add(source);
        const notification = new MessageTray.Notification({
            source,
            title: 'GOCR',
            body,
            gicon: Gio.FileIcon.new(Gio.File.new_for_path(imagePath)),
        });
        source.addNotification(notification);
    }

    // Pipe a PNG file to wl-copy (wl-clipboard). wl-copy stays running in the
    // background as the Wayland clipboard owner; we resolve as soon as stdin is
    // closed and the data is handed off.
    _wlCopy(filename) {
        return new Promise((resolve, reject) => {
            let proc;
            try {
                proc = Gio.Subprocess.new(
                    ['wl-copy', '--type', 'image/png'],
                    Gio.SubprocessFlags.STDIN_PIPE
                );
            } catch (_) {
                reject(new Error(_('wl-copy not found. Install: sudo dnf install wl-clipboard')));
                return;
            }

            let inStream;
            try {
                inStream = Gio.File.new_for_path(filename).read(null);
            } catch (e) {
                reject(e);
                return;
            }

            const outStream = proc.get_stdin_pipe();
            outStream.splice_async(
                inStream,
                Gio.OutputStreamSpliceFlags.CLOSE_SOURCE |
                Gio.OutputStreamSpliceFlags.CLOSE_TARGET,
                GLib.PRIORITY_DEFAULT,
                null,
                (_out, result) => {
                    try {
                        _out.splice_finish(result);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        });
    }

    // Take a screenshot using Shell.Screenshot (internal class, no D-Bus required).
    // GNOME 50 API: screenshot_area(x, y, w, h, GOutputStream, callback)
    _screenshotArea(x, y, w, h, filename) {
        return new Promise((resolve, reject) => {
            try {
                const shot = new Shell.Screenshot();
                const file = Gio.File.new_for_path(filename);
                const stream = file.replace(null, false, Gio.FileCreateFlags.NONE, null);

                shot.screenshot_area(x, y, w, h, stream, (_obj, result) => {
                    try {
                        const ret = shot.screenshot_area_finish(result);
                        try { stream.close(null); } catch (_) {}
                        // finish returns [ok] or [ok, area] depending on version
                        const ok = Array.isArray(ret) ? ret[0] : !!ret;
                        if (ok)
                            resolve();
                        else
                            reject(new Error(_('Screenshot failed')));
                    } catch (e) {
                        try { stream.close(null); } catch (_) {}
                        reject(e);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    // Run tesseract and return stdout as a string
    _runTesseract(filename) {
        return new Promise((resolve, reject) => {
            const lang = this._settings?.get_string('ocr-language') ?? 'rus+eng';
            let proc;
            try {
                proc = Gio.Subprocess.new(
                    ['tesseract', filename, 'stdout', '-l', lang],
                    Gio.SubprocessFlags.STDOUT_PIPE |
                    Gio.SubprocessFlags.STDERR_PIPE
                );
            } catch (_) {
                reject(new Error(_('tesseract not found. Install: sudo dnf install tesseract')));
                return;
            }

            proc.communicate_utf8_async(null, null, (_proc, result) => {
                try {
                    const [, stdout, stderr] = proc.communicate_utf8_finish(result);
                    if (proc.get_exit_status() !== 0)
                        reject(new Error(stderr?.trim() || _('tesseract exited with error')));
                    else
                        resolve(stdout ?? '');
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    _sleep(ms) {
        return new Promise(resolve =>
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
                resolve();
                return GLib.SOURCE_REMOVE;
            })
        );
    }
}

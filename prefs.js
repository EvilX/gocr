import GObject from 'gi://GObject';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

// Modifier keys that should not be saved as standalone shortcuts
const MODIFIER_KEYVALS = new Set([
    Gdk.KEY_Super_L,   Gdk.KEY_Super_R,
    Gdk.KEY_Control_L, Gdk.KEY_Control_R,
    Gdk.KEY_Alt_L,     Gdk.KEY_Alt_R,
    Gdk.KEY_Shift_L,   Gdk.KEY_Shift_R,
    Gdk.KEY_Meta_L,    Gdk.KEY_Meta_R,
    Gdk.KEY_Hyper_L,   Gdk.KEY_Hyper_R,
    Gdk.KEY_ISO_Level3_Shift,
]);

// ---------------------------------------------------------------------------
// ShortcutRow — Adw.ActionRow that captures a keyboard shortcut inline
// ---------------------------------------------------------------------------
const ShortcutRow = GObject.registerClass(
class ShortcutRow extends Adw.ActionRow {
    _init(title, settings, settingsKey) {
        super._init({title, activatable: true});

        this._settings = settings;
        this._settingsKey = settingsKey;
        this._listening = false;

        // Gtk.ShortcutLabel renders the accelerator in human-readable form
        this._shortcutLabel = new Gtk.ShortcutLabel({
            disabled_text: _('Not set'),
            valign: Gtk.Align.CENTER,
        });
        this._refreshLabel();
        this.add_suffix(this._shortcutLabel);

        // Clear button
        const clearBtn = new Gtk.Button({
            icon_name: 'edit-clear-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
            tooltip_text: _('Reset'),
        });
        clearBtn.connect('clicked', (btn) => {
            // Don't trigger the row's own activation
            btn.get_ancestor(Adw.ActionRow.$gtype)?.grab_focus();
            this._settings.set_strv(this._settingsKey, []);
            this._stopListening();
        });
        this.add_suffix(clearBtn);

        // Key controller — lives on this row widget
        const keyCtrl = new Gtk.EventControllerKey();
        keyCtrl.connect('key-pressed', this._onKeyPressed.bind(this));
        this.add_controller(keyCtrl);

        this.connect('activated', () => this._startListening());

        // Keep label in sync if the setting is changed externally
        this._settings.connect(`changed::${settingsKey}`, () => {
            if (!this._listening)
                this._refreshLabel();
        });
    }

    _refreshLabel() {
        const accel = this._settings.get_strv(this._settingsKey)[0] ?? '';
        this._shortcutLabel.set_accelerator(accel);
    }

    _startListening() {
        if (this._listening) return;
        this._listening = true;

        this._shortcutLabel.set_accelerator('');
        this._shortcutLabel.disabled_text = _('Press a key combination…');
        this.set_subtitle(_('Escape — cancel'));
        this.add_css_class('accent');
        this.grab_focus();
    }

    _stopListening() {
        if (!this._listening) return;
        this._listening = false;

        this._shortcutLabel.disabled_text = _('Not set');
        this.set_subtitle('');
        this.remove_css_class('accent');
        this._refreshLabel();
    }

    _onKeyPressed(_ctrl, keyval, _keycode, state) {
        if (!this._listening)
            return Gdk.EVENT_PROPAGATE;

        if (keyval === Gdk.KEY_Escape) {
            this._stopListening();
            return Gdk.EVENT_STOP;
        }

        // Ignore bare modifier key presses
        if (MODIFIER_KEYVALS.has(keyval))
            return Gdk.EVENT_STOP;

        const mods = state & Gtk.accelerator_get_default_mod_mask();

        if (!Gtk.accelerator_valid(keyval, mods))
            return Gdk.EVENT_STOP;

        const accel = Gtk.accelerator_name(keyval, mods);
        this._settings.set_strv(this._settingsKey, [accel]);
        this._stopListening();
        return Gdk.EVENT_STOP;
    }
});

// ---------------------------------------------------------------------------
// Preferences window
// ---------------------------------------------------------------------------
export default class GOCRPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('GOCR'),
            icon_name: 'edit-find-symbolic',
        });
        window.add(page);

        // --- Keyboard shortcut -------------------------------------------
        const shortcutGroup = new Adw.PreferencesGroup({
            title: _('Keyboard Shortcut'),
            description: _('Click the row, then press the desired key combination'),
        });
        page.add(shortcutGroup);

        shortcutGroup.add(
            new ShortcutRow(_('Capture Screen Area'), settings, 'capture-shortcut')
        );

        // --- OCR language -------------------------------------------------
        const ocrGroup = new Adw.PreferencesGroup({title: _('Recognition')});
        page.add(ocrGroup);

        const langRow = new Adw.EntryRow({
            title: _('OCR Language'),
            text: settings.get_string('ocr-language'),
            show_apply_button: true,
        });
        langRow.connect('apply', () => {
            const val = langRow.text.trim();
            settings.set_string('ocr-language', val || 'rus+eng');
        });
        ocrGroup.add(langRow);

        const infoRow = new Adw.ActionRow({
            title: _('Available languages'),
            subtitle: _(
                'Run tesseract --list-langs in terminal.\n' +
                'Install Russian: sudo dnf install tesseract-langpack-rus'
            ),
            activatable: false,
        });
        ocrGroup.add(infoRow);
    }
}

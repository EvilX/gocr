// Minimal stand-ins for GJS / GNOME Shell modules so extension code can be
// imported under Node. Only what is touched at module load is provided.
const STUBS = {
    'gi://GObject': `export default {
        registerClass: (...args) => args.at(-1),
        TYPE_INT: 'gint',
    };`,
    'gi://St': 'export default { Widget: class {}, Label: class {}, Icon: class {} };',
    'gi://Adw': 'export default { ActionRow: class {} };',
    'gi://Gdk': 'export default {};',
    'resource:///org/gnome/shell/ui/panelMenu.js': 'export class Button {}',
    'resource:///org/gnome/shell/extensions/extension.js':
        'export class Extension {}\nexport const gettext = s => s;',
    'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js':
        'export class ExtensionPreferences {}\nexport const gettext = s => s;',
};

export function resolve(specifier, context, next) {
    if (specifier.startsWith('gi://') || specifier.startsWith('resource://'))
        return { url: `stub:${specifier}`, shortCircuit: true };
    return next(specifier, context);
}

export function load(url, context, next) {
    if (url.startsWith('stub:')) {
        const source = STUBS[url.slice(5)] ?? 'export default {};';
        return { format: 'module', source, shortCircuit: true };
    }
    return next(url, context);
}

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const metadata = JSON.parse(read('metadata.json'));

describe('metadata.json', () => {
    it('has the required fields', () => {
        for (const key of ['uuid', 'name', 'description', 'shell-version', 'url', 'settings-schema', 'gettext-domain'])
            assert.ok(metadata[key], `missing ${key}`);
        assert.ok(Number.isInteger(metadata.version), 'version must be an integer');
        assert.equal(metadata['gettext-domain'], metadata.uuid);
    });

    it('references an existing settings schema', () => {
        const schemaFile = `${metadata['settings-schema']}.gschema.xml`;
        assert.ok(readdirSync(new URL('schemas/', root)).includes(schemaFile));
        assert.match(read(`schemas/${schemaFile}`), new RegExp(`id="${metadata['settings-schema']}"`));
    });
});

describe('settings schema', () => {
    const schema = read(`schemas/${metadata['settings-schema']}.gschema.xml`);
    const sources = read('extension.js') + read('prefs.js');

    for (const key of ['capture-shortcut', 'screenshot-shortcut', 'show-indicator', 'ocr-language']) {
        it(`declares key "${key}"`, () => assert.match(schema, new RegExp(`<key name="${key}"`)));
        it(`key "${key}" is used by the code`, () => assert.ok(sources.includes(`'${key}'`)));
    }
});

// Extracts gettext strings: _('...') including 'a' + 'b' concatenations.
function sourceStrings(source) {
    const strings = new Set();
    for (const [, args] of source.matchAll(/\b_\(\s*((?:'(?:[^'\\]|\\.)*'\s*\+?\s*)+)\)/g)) {
        const parts = [...args.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(m => m[1]);
        strings.add(parts.join('').replace(/\\n/g, '\n').replace(/\\'/g, "'"));
    }
    return strings;
}

// Parses msgid/msgstr pairs from a .po file (multi-line strings supported).
function poEntries(po) {
    const entries = new Map();
    const unquote = block => [...block.matchAll(/"((?:[^"\\]|\\.)*)"/g)]
        .map(m => m[1]).join('').replace(/\\n/g, '\n').replace(/\\"/g, '"');
    for (const [, id, str] of po.matchAll(/^msgid ((?:".*"\n)+)msgstr ((?:".*"\n?)+)/gm))
        entries.set(unquote(id), unquote(str));
    entries.delete('');
    return entries;
}

describe('translations', () => {
    const files = read('po/POTFILES').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    const strings = new Set(files.flatMap(file => [...sourceStrings(read(file))]));
    const poFiles = readdirSync(new URL('po/', root)).filter(f => f.endsWith('.po'));

    it('POTFILES lists only existing files', () => {
        for (const file of files)
            assert.doesNotThrow(() => read(file), file);
    });

    it('finds translatable strings in sources', () => assert.ok(strings.size > 10));

    for (const poFile of poFiles) {
        const entries = poEntries(read(`po/${poFile}`));

        it(`${poFile} translates every source string`, () => {
            const missing = [...strings].filter(s => !entries.get(s));
            assert.deepEqual(missing, []);
        });

        it(`${poFile} has no obsolete strings`, () => {
            const obsolete = [...entries.keys()].filter(s => !strings.has(s));
            assert.deepEqual(obsolete, []);
        });
    }
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { selectionRect, notificationText } from '../extension.js';

describe('selectionRect', () => {
    it('normalizes a top-left to bottom-right drag', () => {
        assert.deepEqual(selectionRect(10, 20, 110, 70), { x: 10, y: 20, width: 100, height: 50 });
    });

    it('normalizes drags in any direction', () => {
        const expected = { x: 10, y: 20, width: 100, height: 50 };
        assert.deepEqual(selectionRect(110, 70, 10, 20), expected);
        assert.deepEqual(selectionRect(110, 20, 10, 70), expected);
        assert.deepEqual(selectionRect(10, 70, 110, 20), expected);
    });

    it('rounds fractional coordinates', () => {
        assert.deepEqual(selectionRect(10.4, 20.6, 110.4, 70.6), { x: 10, y: 21, width: 100, height: 50 });
    });

    it('rejects clicks and tiny selections', () => {
        assert.equal(selectionRect(50, 50, 50, 50), null);
        assert.equal(selectionRect(50, 50, 54, 200), null);
        assert.equal(selectionRect(50, 50, 200, 54), null);
    });

    it('accepts the minimum size', () => {
        assert.deepEqual(selectionRect(0, 0, 5, 5), { x: 0, y: 0, width: 5, height: 5 });
    });
});

describe('notificationText', () => {
    it('keeps short text as is', () => {
        assert.equal(notificationText('hello'), 'hello');
        assert.equal(notificationText('a'.repeat(200)), 'a'.repeat(200));
    });

    it('truncates long text with an ellipsis', () => {
        assert.equal(notificationText('a'.repeat(201)), `${'a'.repeat(200)}…`);
        assert.equal(notificationText('abcdef', 3), 'abc…');
    });
});

/**
 * Unit tests for the Asyntai NodeBB plugin.
 *
 * The server readers come from library.js. The browser loader comes from
 * public/lib/main.js, which runs here inside a small fake page, so every rule
 * can be driven without a forum and without a browser.
 *
 * Run: node --test tests/test_loader.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('../nodebb-plugin-asyntai/', import.meta.url);

/**
 * Loads library.js outside a forum.
 *
 * The file asks NodeBB for two core modules through `require.main.require`.
 * Neither is used by the readers under test, so a stub is enough.
 */
function loadLibrary() {
	const fakeRequire = () => ({});
	fakeRequire.main = { require: () => ({ settings: {} }) };
	const module = { exports: {} };
	const context = vm.createContext({ require: fakeRequire, module, exports: module.exports, console });
	vm.runInContext(readFileSync(new URL('library.js', ROOT), 'utf8'), context);
	return module.exports;
}

const library = loadLibrary();

const SNIPPET = '<script src="https://widget.asyntai.com/static/js/chat-widget.js" data-asyntai-id="asyntai_2bcd9dfbae24"></script>';

test('a bare widget ID is accepted', () => {
	assert.equal(library._readWidgetId('asyntai_2bcd9dfbae24'), 'asyntai_2bcd9dfbae24');
});

test('surrounding spaces are removed', () => {
	assert.equal(library._readWidgetId('  asyntai_2bcd9dfbae24 \n'), 'asyntai_2bcd9dfbae24');
});

test('the whole dashboard snippet is accepted', () => {
	assert.equal(library._readWidgetId(SNIPPET), 'asyntai_2bcd9dfbae24');
});

test('a snippet with single quotes is accepted', () => {
	assert.equal(library._readWidgetId("<script data-asyntai-id='asyntai_abc123'></script>"), 'asyntai_abc123');
});

test('an empty field gives an empty ID', () => {
	assert.equal(library._readWidgetId(''), '');
	assert.equal(library._readWidgetId('   '), '');
});

test('a value that is not a string gives an empty ID', () => {
	assert.equal(library._readWidgetId(undefined), '');
	assert.equal(library._readWidgetId(null), '');
	assert.equal(library._readWidgetId(42), '');
});

test('a malformed ID is rejected', () => {
	assert.equal(library._readWidgetId('not-a-real-id'), '');
	assert.equal(library._readWidgetId('asyntai_'), '');
	assert.equal(library._readWidgetId('asyntai_abc'), '');
	assert.equal(library._readWidgetId('<script>alert(1)</script>'), '');
});

test('an http or https script address is kept', () => {
	assert.equal(library._readScriptUrl('https://example.com/w.js'), 'https://example.com/w.js');
	assert.equal(library._readScriptUrl('http://example.com/w.js'), 'http://example.com/w.js');
});

test('any other script address falls back to the default', () => {
	assert.equal(library._readScriptUrl('javascript:alert(1)'), library.DEFAULT_SCRIPT_URL);
	assert.equal(library._readScriptUrl('/local/w.js'), library.DEFAULT_SCRIPT_URL);
	assert.equal(library._readScriptUrl(''), library.DEFAULT_SCRIPT_URL);
	assert.equal(library._readScriptUrl(undefined), library.DEFAULT_SCRIPT_URL);
});

test('the switch reads the values NodeBB stores', () => {
	assert.equal(library._readSwitch('on'), true);
	assert.equal(library._readSwitch(true), true);
	assert.equal(library._readSwitch('off'), false);
	assert.equal(library._readSwitch(undefined), false);
});

/** Builds a fake page and runs the browser loader inside it. */
function page(asyntaiConfig, uid) {
	const head = [];
	const window = {
		config: asyntaiConfig ? { asyntai: asyntaiConfig } : {},
		app: { user: { uid: uid || 0 } },
		addEventListener: () => {},
	};
	const document = {
		readyState: 'loading',
		createElement: () => {
			const node = { attributes: {}, setAttribute(k, v) { this.attributes[k] = v; } };
			return node;
		},
		querySelector: sel => (sel.includes('data-asyntai-id') ? head.find(n => n.attributes['data-asyntai-id']) || null : null),
		head: { appendChild: node => head.push(node) },
	};
	window.document = document;
	const context = vm.createContext({ window, document, setTimeout, console });
	context.globalThis = context;
	vm.runInContext(readFileSync(new URL('public/lib/main.js', ROOT), 'utf8'), context);
	return { window, head };
}

test('the widget loads for a guest', () => {
	const { window, head } = page({ widgetId: 'asyntai_2bcd9dfbae24', scriptUrl: 'https://widget.asyntai.com/static/js/chat-widget.js', hideForMembers: false }, 0);
	assert.equal(window.asyntaiNodeBB.inject(), true);
	assert.equal(head.length, 1);
	assert.equal(head[0].attributes['data-asyntai-id'], 'asyntai_2bcd9dfbae24');
	assert.equal(head[0].src, 'https://widget.asyntai.com/static/js/chat-widget.js');
	assert.equal(head[0].async, true);
});

test('nothing loads when the forum publishes no settings', () => {
	const { window, head } = page(null, 0);
	assert.equal(window.asyntaiNodeBB.inject(), false);
	assert.equal(head.length, 0);
});

test('nothing loads when the widget ID is empty', () => {
	const { window, head } = page({ widgetId: '', scriptUrl: 'https://x/y.js', hideForMembers: false }, 0);
	assert.equal(window.asyntaiNodeBB.inject(), false);
	assert.equal(head.length, 0);
});

test('a member gets nothing while the guest-only switch is on', () => {
	const { window, head } = page({ widgetId: 'asyntai_2bcd9dfbae24', scriptUrl: 'https://x/y.js', hideForMembers: true }, 7);
	assert.equal(window.asyntaiNodeBB.inject(), false);
	assert.equal(head.length, 0);
});

test('a member still gets the widget while the switch is off', () => {
	const { window, head } = page({ widgetId: 'asyntai_2bcd9dfbae24', scriptUrl: 'https://x/y.js', hideForMembers: false }, 7);
	assert.equal(window.asyntaiNodeBB.inject(), true);
	assert.equal(head.length, 1);
});

test('the widget loads once per tab', () => {
	const { window, head } = page({ widgetId: 'asyntai_2bcd9dfbae24', scriptUrl: 'https://x/y.js', hideForMembers: false }, 0);
	assert.equal(window.asyntaiNodeBB.inject(), true);
	assert.equal(window.asyntaiNodeBB.inject(), false);
	assert.equal(head.length, 1);
});

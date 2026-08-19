'use strict';

/**
 * Asyntai AI Chatbot for NodeBB.
 *
 * The plugin adds one small script to the forum. That script fetches the chat
 * widget from Asyntai after the page has finished loading. Your server never
 * talks to Asyntai; only the visitor's browser does.
 *
 * Written as CommonJS on purpose. NodeBB 3 and NodeBB 4 both load CommonJS
 * plugin libraries, so one file covers both.
 */

const meta = require.main.require('./src/meta');
const routeHelpers = require.main.require('./src/routes/helpers');

const plugin = {};

const SETTINGS_KEY = 'asyntai';
const DEFAULT_SCRIPT_URL = 'https://widget.asyntai.com/static/js/chat-widget.js';
const ID_PATTERN = /^asyntai_[A-Za-z0-9]{6,64}$/;

/**
 * Accepts either a bare widget ID or the whole snippet from the Asyntai
 * dashboard. Returns an empty string when there is no usable ID, which is how
 * the chat stays off until the administrator fills the field in.
 */
function readWidgetId(raw) {
	if (typeof raw !== 'string') {
		return '';
	}

	let value = raw.trim();
	const attribute = value.match(/data-asyntai-id\s*=\s*["']([^"']+)["']/);

	if (attribute) {
		value = attribute[1].trim();
	}

	return ID_PATTERN.test(value) ? value : '';
}

function readScriptUrl(raw) {
	if (typeof raw !== 'string') {
		return DEFAULT_SCRIPT_URL;
	}

	const value = raw.trim();

	return /^https?:\/\//i.test(value) ? value : DEFAULT_SCRIPT_URL;
}

/** NodeBB stores unchecked switches as 'off' and checked ones as 'on'. */
function readSwitch(raw) {
	return raw === 'on' || raw === true || raw === 'true' || raw === 1;
}

plugin.init = async function (params) {
	const { router } = params;

	await meta.settings.setOnEmpty(SETTINGS_KEY, {
		widgetId: '',
		scriptUrl: DEFAULT_SCRIPT_URL,
		hideForMembers: 'off',
	});

	routeHelpers.setupAdminPageRoute(router, '/admin/plugins/asyntai', (req, res) => {
		res.render('admin/plugins/asyntai', { title: 'Asyntai AI Chatbot' });
	});
};

plugin.addAdminNavigation = function (header) {
	header.plugins.push({
		route: '/plugins/asyntai',
		icon: 'fa-comments',
		name: 'Asyntai AI Chatbot',
	});

	return header;
};

/**
 * Publishes the three values the frontend needs onto the client config.
 *
 * Nothing is published while the widget ID is missing or malformed, so a fresh
 * install adds no key at all. Nothing about your users or your posts is sent.
 */
plugin.appendConfig = async function (config) {
	const settings = await meta.settings.get(SETTINGS_KEY);
	const widgetId = readWidgetId(settings && settings.widgetId);

	if (!widgetId) {
		return config;
	}

	config.asyntai = {
		widgetId: widgetId,
		scriptUrl: readScriptUrl(settings.scriptUrl),
		hideForMembers: readSwitch(settings.hideForMembers),
	};

	return config;
};

// Exposed so the tests can check the readers without a running forum.
plugin._readWidgetId = readWidgetId;
plugin._readScriptUrl = readScriptUrl;
plugin._readSwitch = readSwitch;
plugin.DEFAULT_SCRIPT_URL = DEFAULT_SCRIPT_URL;

module.exports = plugin;

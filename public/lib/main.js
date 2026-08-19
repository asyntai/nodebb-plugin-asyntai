'use strict';

/**
 * Asyntai AI Chatbot for NodeBB, forum frontend.
 *
 * Loads the chat widget once per tab, after the page load event, so NodeBB is
 * drawn first and page speed does not change. NodeBB is a single page
 * application, so the load event fires one time and the widget stays alive
 * while the visitor moves between pages.
 */
(function () {
	function settings() {
		return (window.config && window.config.asyntai) || null;
	}

	/** True when the visitor is signed in to the forum. */
	function isMember() {
		return !!(window.app && window.app.user && parseInt(window.app.user.uid, 10) > 0);
	}

	function inject() {
		var config = settings();

		if (!config || !config.widgetId || window.__asyntaiRequested) {
			return false;
		}

		// The administrator can keep the chat for guests only.
		if (config.hideForMembers && isMember()) {
			return false;
		}

		if (document.querySelector('script[data-asyntai-id]')) {
			return false;
		}

		window.__asyntaiRequested = config.widgetId;

		var script = document.createElement('script');
		script.src = config.scriptUrl;
		script.async = true;
		script.setAttribute('data-asyntai-id', config.widgetId);
		document.head.appendChild(script);

		return true;
	}

	// Exposed so the tests can drive the loader without a running forum.
	window.asyntaiNodeBB = { inject: inject, isMember: isMember };

	if (document.readyState === 'complete') {
		setTimeout(inject, 0);
	} else {
		window.addEventListener('load', inject);
	}
}());

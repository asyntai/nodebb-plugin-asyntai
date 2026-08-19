'use strict';

/**
 * Asyntai AI Chatbot for NodeBB, admin page.
 *
 * NodeBB loads this module only when the administrator opens the settings
 * page. The form is a standard NodeBB settings form, so loading and saving is
 * handled by the core settings module.
 */
define('admin/plugins/asyntai', ['settings', 'alerts'], function (Settings, alerts) {
	var Asyntai = {};

	Asyntai.init = function () {
		Settings.load('asyntai', $('.asyntai-settings'));

		$('#save').on('click', function () {
			Settings.save('asyntai', $('.asyntai-settings'), function () {
				alerts.alert({
					type: 'success',
					alert_id: 'asyntai-saved',
					title: 'Settings saved',
					message: 'Reload the forum to see the change.',
					timeout: 5000,
				});
			});
		});
	};

	return Asyntai;
});

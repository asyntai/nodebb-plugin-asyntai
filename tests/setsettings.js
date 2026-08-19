const nconf = require('nconf');
nconf.file({ file: '/opt/config/config.json' });
nconf.defaults({ base_dir: '/usr/src/app', views_dir: '/usr/src/app/build/public/templates', upload_path: 'public/uploads' });
(async () => {
	const db = require('/usr/src/app/src/database');
	await db.init();
	const meta = require('/usr/src/app/src/meta');
	const values = JSON.parse(process.argv[2]);
	await meta.settings.set('asyntai', values);
	console.log('saved:', JSON.stringify(await meta.settings.get('asyntai')));
	process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });

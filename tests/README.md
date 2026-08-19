# Tests

Two suites. Both pass on NodeBB 4.15.0.

`test_loader.mjs` runs the server readers and the browser loader inside a small
fake page, with no browser and no forum, so every rule can be driven directly.
16 checks.

```
node --test tests/test_loader.mjs
```

`test_forum.py` runs against a real NodeBB in Docker. It checks that the plugin
is built into the forum, that the three settings reach the browser, and that
nothing else does. 18 checks.

```
python tests/test_forum.py
```

No password is typed anywhere. Settings are written with NodeBB's own
`meta.settings` module inside the container, which is what the admin screen
does.

## Setting up the forum

The stack is NodeBB plus MongoDB. Copy the plugin to `tests/plugin` first:

```
mkdir tests/plugin && cp -r library.js package.json plugin.json public templates LICENSE README.md tests/plugin/
```

That folder is mounted read-only at `/plugin-src` and installed with
`NODEBB_ADDITIONAL_PLUGINS: "/plugin-src"`,
which makes the container run `npm install /plugin-src` on every start. That is
the same path a real administrator takes with `npm install
nodebb-plugin-asyntai`.

`/opt/config` must be a named volume. Without it the container loses
`config.json` on every recreate and drops back into the web installer.

Activate and build after the first start:

```
docker exec <nodebb> ./nodebb activate nodebb-plugin-asyntai --config=/opt/config/config.json
docker exec <nodebb> ./nodebb build --config=/opt/config/config.json
docker restart <nodebb>
```

`setsettings.js` is copied into the container by hand; it writes the plugin
settings through `meta.settings.set`. The integration test restarts the forum
after each write, because a process outside NodeBB cannot clear the settings
cache of the running one. Saving from the admin screen clears it straight away.

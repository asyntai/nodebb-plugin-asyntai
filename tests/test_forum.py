"""
Integration tests for the Asyntai NodeBB plugin.

Runs against a real NodeBB in Docker. It checks that the plugin is built into
the forum, that the three settings reach the browser, and that nothing else
does.

No password is typed anywhere. Settings are written with NodeBB's own
meta.settings module inside the container, which is what the admin screen does.

Run: python tests/test_forum.py
"""
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request

FORUM = "http://localhost:4567"
CONTAINER = "nbb-nodebb-1"
COMPOSE_DIR = None  # set with --compose-dir if the stack lives elsewhere

WIDGET_ID = "asyntai_2bcd9dfbae24"
DEFAULT_SCRIPT_URL = "https://widget.asyntai.com/static/js/chat-widget.js"
SNIPPET = (
    '<script src="https://widget.asyntai.com/static/js/chat-widget.js" '
    'data-asyntai-id="%s"></script>' % WIDGET_ID
)

passed = []
failed = []


def check(name, condition, detail=""):
    if condition:
        passed.append(name)
        print("  PASS  %s" % name)
    else:
        failed.append(name)
        print("  FAIL  %s %s" % (name, detail))


def get(path, timeout=20):
    with urllib.request.urlopen(FORUM + path, timeout=timeout) as response:
        return response.getcode(), response.read().decode("utf-8", "replace")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def status_no_redirect(path):
    """Returns the first status code, so a redirect shows up as a redirect."""
    opener = urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(FORUM + path, timeout=20) as response:
            return response.getcode()
    except urllib.error.HTTPError as err:
        return err.code
    except Exception:
        return 0


def status(path):
    try:
        code, _ = get(path)
        return code
    except urllib.error.HTTPError as err:
        return err.code
    except Exception:
        return 0


def client_config():
    _, body = get("/api/config")
    return json.loads(body)


def set_settings(values):
    """Writes the plugin settings and restarts the forum.

    The restart is only needed because this script runs outside the NodeBB
    process, so it cannot clear that process's settings cache. Saving from the
    admin screen clears it straight away.
    """
    subprocess.run(
        ["docker", "exec", CONTAINER, "sh", "-lc",
         "cd /usr/src/app && node setsettings.js %s" % json.dumps(json.dumps(values))],
        capture_output=True, check=True,
    )
    subprocess.run(["docker", "restart", CONTAINER], capture_output=True, check=True)
    for _ in range(40):
        time.sleep(5)
        if status("/api/config") == 200:
            return
    raise RuntimeError("the forum did not come back after a restart")


print("Asyntai NodeBB plugin, integration tests")
print("Forum: %s" % FORUM)

if status("/") != 200:
    print("The forum does not answer. Start the stack first.")
    sys.exit(1)

print("\n1. The plugin is part of the forum")
_, bundle = get("/assets/nodebb.min.js", timeout=60)
check("the browser loader is bundled into the forum script", "asyntaiNodeBB" in bundle)
check("the admin module is served", status("/assets/src/admin/plugins/asyntai.js") == 200)
check("the admin template is built", status("/assets/templates/admin/plugins/asyntai.js") == 200)
check("the admin page sends a visitor to the login screen", status_no_redirect("/admin/plugins/asyntai") == 302)
check("the admin data is closed to visitors", status_no_redirect("/api/admin/plugins/asyntai") == 401)

print("\n2. A valid widget ID reaches the browser")
set_settings({"widgetId": WIDGET_ID, "scriptUrl": DEFAULT_SCRIPT_URL, "hideForMembers": "off"})
config = client_config()
check("the settings reach the browser", "asyntai" in config)
published = config.get("asyntai", {})
check("the widget ID is correct", published.get("widgetId") == WIDGET_ID, published)
check("the script address is correct", published.get("scriptUrl") == DEFAULT_SCRIPT_URL)
check("the guest-only switch is off", published.get("hideForMembers") is False)
check("exactly three values are published", sorted(published) == ["hideForMembers", "scriptUrl", "widgetId"], sorted(published))

print("\n3. The dashboard snippet is accepted as well")
set_settings({"widgetId": SNIPPET, "scriptUrl": DEFAULT_SCRIPT_URL, "hideForMembers": "on"})
published = client_config().get("asyntai", {})
check("the ID is taken out of the snippet", published.get("widgetId") == WIDGET_ID, published)
check("no markup reaches the browser", "<script" not in json.dumps(published))
check("the guest-only switch is on", published.get("hideForMembers") is True)

print("\n4. Bad values are refused")
set_settings({"widgetId": WIDGET_ID, "scriptUrl": "javascript:alert(1)", "hideForMembers": "off"})
published = client_config().get("asyntai", {})
check("a javascript address is replaced by the default", published.get("scriptUrl") == DEFAULT_SCRIPT_URL, published)

set_settings({"widgetId": "not-a-real-id", "scriptUrl": DEFAULT_SCRIPT_URL, "hideForMembers": "off"})
check("a malformed ID publishes nothing at all", "asyntai" not in client_config())

set_settings({"widgetId": "", "scriptUrl": DEFAULT_SCRIPT_URL, "hideForMembers": "off"})
check("an empty ID publishes nothing at all", "asyntai" not in client_config())
check("the forum still works with the chat off", status("/") == 200)

print("\n5. The forum is left switched on")
set_settings({"widgetId": WIDGET_ID, "scriptUrl": DEFAULT_SCRIPT_URL, "hideForMembers": "off"})
check("the chat is on again", client_config().get("asyntai", {}).get("widgetId") == WIDGET_ID)

print("\n%d passed, %d failed" % (len(passed), len(failed)))
sys.exit(1 if failed else 0)

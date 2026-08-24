#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EDITOR = ROOT / "public/js/admin-packaging-studio.js"
PAGE = ROOT / "admin/packaging-studio/index.html"

OLD_HEADER = "// Build 277 - Restore dedicated French + English ingredient panels, strengthen claim spacing, and retain Build 276 Inventory traceability/overflow safety."
NEW_HEADER = "// Build 298 - Mature Packaging editor requests now use the native DDPackagingClient facade.\n// Build 277 renderer/content behavior remains otherwise unchanged."

OLD_API = """  async function api(body = null, projectId = 0) {
    const url = `/api/admin/packaging-studio${projectId ? `?packaging_project_id=${encodeURIComponent(projectId)}` : ''}`;
    const response = await DDAuth.apiFetch(url, body ? { method: 'POST', body: JSON.stringify(body) } : undefined);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Packaging Studio request failed.');
    return data;
  }
"""

NEW_API = """  async function api(body = null, projectId = 0) {
    const client = globalThis.DDPackagingClient;
    if (!client || typeof client.request !== 'function') throw new Error('Packaging native client is unavailable.');
    const response = await client.request(body, projectId);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Packaging Studio request failed.');
    return data;
  }
"""

OLD_SCRIPTS = """  <script src=\"/public/js/admin-packaging-startup-gate-v297.js?v=297\"></script>
  <script src=\"/public/js/admin.js?v=296\"></script>
  <script src=\"/public/js/admin-packaging-client-transport-v297.js?v=297\"></script>
  <script src=\"/public/js/admin-packaging-studio.js?v=277\"></script>
"""

NEW_SCRIPTS = """  <script src=\"/public/js/admin-packaging-startup-gate-v297.js?v=297\"></script>
  <script src=\"/public/js/admin.js?v=296\"></script>
  <script src=\"/public/js/admin-packaging-client-transport-v297.js?v=297\"></script>
  <script src=\"/public/js/admin-packaging-native-client-v298.js?v=298\"></script>
  <script src=\"/public/js/admin-packaging-studio.js?v=298\"></script>
"""


def fail(message):
    raise SystemExit(f"FAIL: {message}")


editor = EDITOR.read_text(encoding="utf-8")
page = PAGE.read_text(encoding="utf-8")

if NEW_API in editor and NEW_SCRIPTS in page:
    print("Build 298 native Packaging client cutover is already applied.")
    raise SystemExit(0)

if OLD_HEADER not in editor:
    fail("expected Build 277 editor header was not found")
if editor.count(OLD_API) != 1:
    fail(f"expected exactly one mature editor API helper; found {editor.count(OLD_API)}")
if editor.count("/api/admin/packaging-studio") != 1:
    fail("mature editor retired-route reference count changed; refusing non-surgical patch")
if page.count(OLD_SCRIPTS) != 1:
    fail("expected Build 297 Packaging page script block was not found exactly once")

editor = editor.replace(OLD_HEADER, NEW_HEADER, 1).replace(OLD_API, NEW_API, 1)
page = page.replace(OLD_SCRIPTS, NEW_SCRIPTS, 1)

if "/api/admin/packaging-studio" in editor:
    fail("retired Packaging Studio endpoint remains in mature editor after patch")
if "DDPackagingClient.request" not in editor and "client.request(body, projectId)" not in editor:
    fail("mature editor does not call the Build 298 native client after patch")

EDITOR.write_text(editor, encoding="utf-8")
PAGE.write_text(page, encoding="utf-8")

print("PASS: mature Packaging editor now uses DDPackagingClient without naming the retired route")
print("PASS: Packaging page now loads Build 298 native client before the mature editor")
print("No server, schema, binding, R2, or Production resource was contacted.")

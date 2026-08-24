#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "admin/packaging-studio/index.html"

OLD_SCRIPTS = """  <script src=\"/public/js/admin-packaging-startup-gate-v297.js?v=297\"></script>
  <script src=\"/public/js/admin.js?v=296\"></script>
  <script src=\"/public/js/admin-packaging-client-transport-v297.js?v=297\"></script>
  <script src=\"/public/js/admin-packaging-native-client-v298.js?v=298\"></script>
  <script src=\"/public/js/admin-packaging-studio.js?v=298\"></script>
"""

NEW_SCRIPTS = """  <script src=\"/public/js/admin.js?v=296\"></script>
  <script src=\"/public/js/admin-packaging-native-client-v299.js?v=299\"></script>
  <script src=\"/public/js/admin-packaging-studio.js?v=298\"></script>
"""


def fail(message):
    raise SystemExit(f"FAIL: {message}")


page = PAGE.read_text(encoding="utf-8")

if NEW_SCRIPTS in page:
    print("Build 299 Packaging browser compatibility retirement is already applied.")
    raise SystemExit(0)

if page.count(OLD_SCRIPTS) != 1:
    fail("expected exact Build 298 Packaging script block was not found once")

page = page.replace(OLD_SCRIPTS, NEW_SCRIPTS, 1)

for forbidden in [
    "/public/js/admin-packaging-startup-gate-v297.js?v=297",
    "/public/js/admin-packaging-client-transport-v297.js?v=297",
    "/public/js/admin-packaging-native-client-v298.js?v=298",
]:
    if forbidden in page:
        fail(f"retired browser script remains active after patch: {forbidden}")

for required in [
    "/public/js/admin.js?v=296",
    "/public/js/admin-packaging-native-client-v299.js?v=299",
    "/public/js/admin-packaging-studio.js?v=298",
]:
    if required not in page:
        fail(f"required Build 299 Packaging page script missing after patch: {required}")

PAGE.write_text(page, encoding="utf-8")

print("PASS: Packaging page no longer loads the Build 297 startup gate or client overlay")
print("PASS: Packaging page now loads Build 290 runtime -> Build 299 native client -> mature Build 298 editor")
print("Build 297 files remain in the repository as historical rollback artifacts.")
print("No server, schema, binding, R2, or Production resource was contacted.")

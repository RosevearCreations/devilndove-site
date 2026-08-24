#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "admin/packaging-studio/index.html"

OLD_EYEBROW = '<p class="eyebrow">Build 277 • bilingual ingredient panels restored, Inventory traceability retained, long-list overflow protection</p>'
NEW_EYEBROW = '<p class="eyebrow">Build 301 compatibility checkpoint • bilingual ingredient panels restored, Inventory traceability retained, long-list overflow protection</p>'

OLD_SCRIPTS = '''  <script src="/public/js/admin-packaging-native-client-v298.js?v=298"></script>\n  <script src="/public/js/admin-packaging-save-stabilizer-v300.js?v=300"></script>\n  <script src="/public/js/admin-packaging-studio.js?v=298"></script>'''
NEW_SCRIPTS = '''  <script src="/public/js/admin-packaging-native-client-v298.js?v=298"></script>\n  <script src="/public/js/admin-packaging-save-stabilizer-v300.js?v=300"></script>\n  <script src="/public/js/admin-packaging-compatibility-v301.js?v=301"></script>\n  <script src="/public/js/admin-packaging-studio.js?v=298"></script>'''


def fail(message):
    raise SystemExit(f"FAIL: {message}")


text = PAGE.read_text(encoding="utf-8")

already_active = NEW_EYEBROW in text and NEW_SCRIPTS in text
if already_active:
    print("PASS: Build 301 Packaging compatibility checkpoint is already active")
    print("No server, schema, binding, R2, or Production resource was contacted.")
    raise SystemExit(0)

if text.count(OLD_EYEBROW) != 1:
    fail(f"expected exactly one historical Packaging eyebrow marker, found {text.count(OLD_EYEBROW)}")
if text.count(OLD_SCRIPTS) != 1:
    fail(f"expected exactly one Build 298/300 Packaging script block, found {text.count(OLD_SCRIPTS)}")
if '/public/js/admin-packaging-compatibility-v301.js' in text:
    fail("Build 301 compatibility launcher is partially present; refusing ambiguous activation")

text = text.replace(OLD_EYEBROW, NEW_EYEBROW, 1)
text = text.replace(OLD_SCRIPTS, NEW_SCRIPTS, 1)
PAGE.write_text(text, encoding="utf-8")

print("PASS: Packaging page now presents Build 301 as the single compatibility checkpoint")
print("PASS: Build 301 compatibility status loads after stabilized native client and before mature editor")
print("PASS: Build 297/298/300 proven implementation files remain unchanged")
print("No server, schema, binding, R2, or Production resource was contacted.")

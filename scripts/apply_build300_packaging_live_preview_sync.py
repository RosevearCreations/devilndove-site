#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "admin/packaging-studio/index.html"

OLD = '''  <script src="/public/js/admin-packaging-native-client-v298.js?v=298"></script>
  <script src="/public/js/admin-packaging-studio.js?v=298"></script>
  <script src="/public/js/admin-packaging-print-source-v299.js?v=299"></script>'''

NEW = '''  <script src="/public/js/admin-packaging-native-client-v298.js?v=298"></script>
  <script src="/public/js/admin-packaging-studio.js?v=298"></script>
  <script src="/public/js/admin-packaging-preview-sync-v300.js?v=300"></script>
  <script src="/public/js/admin-packaging-print-source-v299.js?v=299"></script>'''

text = PAGE.read_text(encoding="utf-8")
if NEW in text:
    print("PASS: Build 300 Packaging preview sync is already activated")
    raise SystemExit(0)
if OLD not in text:
    raise SystemExit("FAIL: Packaging page activation block drifted; no file was changed")

PAGE.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
print("PASS: Build 300 Packaging preview sync loads after the mature editor and before print-source control")
print("No server, schema, binding, R2, or Production resource was contacted.")

#!/usr/bin/env python3
"""Validate Release 447 installable-client and notification safety invariants."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


manifest = json.loads((ROOT / 'manifest.webmanifest').read_text(encoding='utf-8'))
require(manifest.get('display') == 'standalone', 'PWA display must remain standalone')
require(manifest.get('orientation') == 'any', 'PWA must support phone/tablet/desktop orientation')
require(manifest.get('scope') == '/', 'PWA scope must remain site-wide')
require(any(row.get('url') == '/admin/it-platform/' for row in manifest.get('shortcuts', [])), 'I.T. shortcut is missing from converged app manifest')

sw = (ROOT / 'sw.js').read_text(encoding='utf-8')
require("devilndove-shell-r447" in sw, 'service worker cache is not Release 447')
require("self.addEventListener('push'" in sw, 'service worker push handler is missing')
require("self.addEventListener('notificationclick'" in sw, 'service worker notification click handler is missing')
require("'/admin/'" in sw and "'/api/'" in sw, 'admin/API cache bypass is missing')
require('BUILD' not in sw.upper(), 'service worker must not carry historical Build identity')

client = (ROOT / 'public/js/pwa-platform.js').read_text(encoding='utf-8')
require("navigator.serviceWorker.register('/sw.js'" in client, 'shared PWA client does not register the service worker')
require('Notification.requestPermission()' in client, 'explicit notification opt-in action is missing')
require('setInterval(' not in client, 'PWA new-item notifications must not use background polling')
require("localStorage.getItem(ENABLE_KEY) !== '1'" in client, 'new-item checks must remain opt-in')
require("CHECK_INTERVAL_MS = 15 * 60 * 1000" in client, 'launch/resume check throttle drifted')

middleware = (ROOT / 'functions/_middleware.js').read_text(encoding='utf-8')
require('/public/js/pwa-platform.js?v=${CURRENT_RELEASE}' in middleware, 'shared HTML PWA bootstrap is missing')
require("contentType.includes('text/html')" in middleware, 'PWA bootstrap must be limited to HTML responses')

feed = (ROOT / 'functions/api/new-items.js').read_text(encoding='utf-8')
require("COALESCE(status,'active')='active'" in feed, 'new-item feed must filter inactive products')
require("COALESCE(review_status,'published') IN ('approved','published','')" in feed, 'new-item feed must filter unpublished products')
require('SELECT product_id, slug, name, created_at, updated_at' in feed, 'new-item feed exposes an unexpected data shape')

print('PWA PLATFORM GATE')
print('Clients: Web / Phone / Desktop')
print('Notifications: explicit opt-in, launch/resume, no timer polling')
if failures:
    for i, failure in enumerate(failures, 1):
        print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('PWA PLATFORM GATE: PASS')

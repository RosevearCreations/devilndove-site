#!/usr/bin/env python3
"""Build 442 source regression for current-release obstacle mechanics and feature detail."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "admin/it-platform/index.html").read_text(encoding="utf-8")
JS = (ROOT / "public/js/admin-it-platform.js").read_text(encoding="utf-8")
CSS = (ROOT / "admin/it-platform/it-platform.css").read_text(encoding="utf-8")
PROVIDER = (ROOT / "functions/api/payment-providers.js").read_text(encoding="utf-8")
ROOT_PROVIDER = (ROOT / "payment-providers.js").read_text(encoding="utf-8")
ROADMAP = (ROOT / "PROJECT_STATUS_AND_ROADMAP.md").read_text(encoding="utf-8")
GATE = (ROOT / "docs/releases/BUILD442_RELEASE_GATE.md").read_text(encoding="utf-8")

checks: list[tuple[str, bool]] = [
    ("I.T. page exposes current Build 442 obstacle bridge", 'id="currentReleaseObstacleBridge"' in HTML and "Build 442 current-release authority" in HTML),
    ("I.T. D1 correction mechanic remains guarded and Development-only", "IT-442-H1" in HTML and "build442_apply_development_it_platform.py --auth-only" in HTML and "devilndove-dev" in HTML),
    ("Stripe old-build obstacle is bridged to PAY-442-H1", "PAY-442-H1" in HTML and "Stripe Development checkout" in HTML),
    ("PayPal old-build obstacle is bridged to PAY-442-H2", "PAY-442-H2" in HTML and "PayPal Development checkout" in HTML),
    ("CAIP obstacle remains current Build 442 HOLD", "CAIP-442-H1" in HTML and "Private media evidence" in HTML),
    ("Stripe mechanic names test credentials, webhook and replay proof", all(token in HTML for token in ("STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "duplicate-event"))),
    ("PayPal mechanic names sandbox credentials, capture, webhook and replay proof", all(token in HTML for token in ("PAYPAL_CLIENT_ID", "PAYPAL_SECRET", "PAYPAL_WEBHOOK_ID", "PAYPAL_ENV=sandbox", "approval/capture"))),
    ("Payment mechanics link first-party provider references", "https://docs.stripe.com/" in HTML and "https://developer.paypal.com/" in HTML),
    ("Safe readiness is explicit user action", 'id="it442RefreshProviderReadiness"' in HTML and "addEventListener('click', refreshProviderReadiness)" in JS),
    ("Readiness client uses only safe GET provider endpoint", "fetch('/api/payment-providers'" in JS and "method: 'GET'" in JS and "method: 'POST'" not in JS),
    ("Readiness client has no polling/background timer", "setInterval" not in JS and "setTimeout" not in JS),
    ("Readiness client labels configuration as insufficient for acceptance", "Configuration readiness is not end-to-end payment acceptance" in JS),
    ("Stripe readiness distinguishes test and live key pairs without exposing values", all(token in PROVIDER for token in ('startsWith("pk_test_")', 'startsWith("sk_test_")', 'startsWith("pk_live_")', 'startsWith("sk_live_")', "environment: stripeMode"))),
    ("Safe readiness response cannot be retained as stale configuration", '"Cache-Control": "no-store"' in PROVIDER),
    ("Root and Functions payment-provider compatibility copies stay aligned", PROVIDER == ROOT_PROVIDER),
    ("Home carousel is detailed as next probable Build 443 direction", "Build 443 candidate — editable Home carousel" in HTML),
    ("Carousel contract documents operator and public behavior", all(token in HTML for token in ("Admin editing", "Public behavior", "Safety and fallback", "Accessibility and SEO", "Release acceptance"))),
    ("Carousel contract retains static hero fallback and reduced motion", "existing static Home hero" in HTML and "reduced-motion" in HTML),
    ("I.T. bridge is responsive on tablet and phone", "@media (max-width:820px)" in CSS and "@media (max-width:520px)" in CSS),
    ("Current roadmap carries both payment HOLD IDs", "PAY-442-H1" in ROADMAP and "PAY-442-H2" in ROADMAP),
    ("Current release gate carries both payment HOLD IDs", "PAY-442-H1" in GATE and "PAY-442-H2" in GATE),
    ("Separate live Production remains closed", "Production promotion: **CLOSED**" in GATE),
]

failed = []
for label, ok in checks:
    print(f"{'PASS' if ok else 'FAIL'} — {label}")
    if not ok:
        failed.append(label)

print(f"\nBUILD 442 I.T. RELEASE OBSTACLE BRIDGE: {len(checks) - len(failed)}/{len(checks)} passed")
print("Remote provider/Cloudflare/D1 access: NONE")
print("Provider mutation capability: NONE")
print("Production mutation capability: NONE")
if failed:
    raise SystemExit(1)

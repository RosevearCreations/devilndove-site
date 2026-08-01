#!/usr/bin/env python3
"""Generate a static Build 193 handoff report without reading secrets."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
cases = [
    {"key":"fee_cost_configuration","area":"business_data","priority":10,"requires_live_binding":False},
    {"key":"marketplace_margin_gate","area":"business_data","priority":20,"requires_live_binding":False},
    {"key":"mobile_draft_recovery","area":"mobile","priority":30,"requires_live_binding":False},
    {"key":"mobile_resumable_media","area":"mobile","priority":40,"requires_live_binding":True},
    {"key":"r2_derivative_worker","area":"media","priority":50,"requires_live_binding":True},
    {"key":"approved_real_media","area":"media","priority":60,"requires_live_binding":False},
    {"key":"search_console_import","area":"seo","priority":70,"requires_live_binding":False},
    {"key":"gbp_monthly_evidence","area":"seo","priority":80,"requires_live_binding":False},
    {"key":"customer_duplicate_review","area":"customers","priority":90,"requires_live_binding":False},
    {"key":"stripe_webhook_signature","area":"payments","priority":100,"requires_live_binding":True},
    {"key":"email_test_delivery","area":"communications","priority":110,"requires_live_binding":True},
    {"key":"r2_live_health","area":"deployment","priority":120,"requires_live_binding":True},
    {"key":"pagespeed_lighthouse","area":"performance","priority":130,"requires_live_binding":False},
    {"key":"real_device_qa","area":"performance","priority":140,"requires_live_binding":False},
    {"key":"legacy_admin_usage","area":"operations","priority":150,"requires_live_binding":False},
]
payload = {
    "build_label":"Build 193",
    "focus":"Live readiness evidence and R2 multipart/resume mobile media.",
    "test_case_count":len(cases),
    "live_binding_test_count":sum(1 for item in cases if item["requires_live_binding"]),
    "test_cases":cases,
    "key_routes":["/admin/command-center/","/admin/mobile-product/","/admin/local-seo-review/","/admin/marketplace-exports/","/admin/live-ops-followthrough/"],
    "notes":[
        "No secret values are stored in this static report.",
        "Browser reloads require re-selecting the same file; completed R2 parts remain tracked.",
        "Use LIVE_TESTING_GUIDE.md for detailed owner steps."
    ]
}
out=ROOT/"data/site/build193-live-readiness-playbook.json"
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
print(out)

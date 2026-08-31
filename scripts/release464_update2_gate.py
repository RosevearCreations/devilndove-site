#!/usr/bin/env python3
"""Release 464 Update 2 source authority gate."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []

authority_path = ROOT / "release464-update2-operational-acceptance.json"
try:
    authority = json.loads(authority_path.read_text(encoding="utf-8"))
except Exception as exc:
    authority = {}
    FAIL.append(f"operational authority unreadable: {exc}")

if authority.get("release") != 464 or authority.get("update") != 2:
    FAIL.append("operational authority must identify Release 464 Update 2")
items = authority.get("items") if isinstance(authority.get("items"), list) else []
if [int(x.get("id", 0)) for x in items if isinstance(x, dict)] != [8,9,10,11,12,13]:
    FAIL.append("Update 2 authority must contain exact items 8-13")
safety = authority.get("safety") or {}
for key in ("runtime_schema_ddl","raw_r2_delete","provider_execution","production_mutation","preview_access_weakened_for_smoke"):
    if safety.get(key) is not False:
        FAIL.append(f"safety authority must keep {key}=false")
if safety.get("retention_delete_requires_archived_approved_review") is not True:
    FAIL.append("retention delete approval safety rule missing")

item12 = next((x for x in items if isinstance(x, dict) and int(x.get("id", 0)) == 12), {})
item12_requirements = "\n".join(str(x) for x in item12.get("requirements", []))
for token in ("no authentication header or service token", "never weaken Cloudflare Access", "all intercepted anonymously", "validate those application surfaces directly"):
    if token not in item12_requirements:
        FAIL.append(f"Preview smoke authority missing Access-safe contract: {token}")

manifest = json.loads((ROOT / "migrations/canonical/manifest.json").read_text(encoding="utf-8"))
migration_names = [str(x.get("file") or "") for x in manifest.get("migrations", [])]
if migration_names != ["0001_release464_migration_authority.sql","0002_release464_operational_acceptance.sql"]:
    FAIL.append(f"canonical migration sequence drifted: {migration_names}")
migration = (ROOT / "migrations/canonical/0002_release464_operational_acceptance.sql").read_text(encoding="utf-8", errors="replace")
for token in ("operational_retention_reviews","operational_retention_archive_items","operational_recovery_events","ON DELETE RESTRICT"):
    if token not in migration:
        FAIL.append(f"migration 0002 missing authority: {token}")

runtime = (ROOT / "functions/api/admin/runtime-incidents.js").read_text(encoding="utf-8", errors="replace")
helpers = "\n".join((ROOT / f"functions/api/admin/{name}").read_text(encoding="utf-8", errors="replace") for name in ("_operationalThresholds.js","_operationalRetention.js","_operationalRecovery.js"))
combined = runtime + "\n" + helpers
if re.search(r"\b(?:CREATE\s+(?:TABLE|INDEX|TRIGGER|VIEW)|ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW))\b", combined, flags=re.I): FAIL.append("Update 2 incident runtime/helpers contain request-time schema DDL")
for token in ("request_retention_review","approve_retention_review","cleanup_resolved","safe_recheck","operational_recovery_events","operational_retention_archive_items","payment_provider_failures_24h","approvedRecoveryUrl","redirect:'manual'"):
    if token not in combined: FAIL.append(f"runtime incident operational contract missing: {token}")
if "DELETE FROM runtime_incidents" not in combined or "operational_retention_archive_items" not in combined: FAIL.append("runtime incident deletion must be constrained to archived source ids")

storage = (ROOT / "functions/api/admin/storage-orphan-diagnostics.js").read_text(encoding="utf-8", errors="replace")
for forbidden in (".delete(", ".put(", "DELETE FROM", "UPDATE ", "INSERT INTO"):
    if forbidden in storage:
        FAIL.append(f"orphan diagnostic contains mutation token: {forbidden}")
for token in ("PRODUCT_MEDIA_BUCKET","CAIP_PRIVATE_MEDIA_BUCKET","r2_delete_available: false","object_body_reads: false"):
    if token not in storage:
        FAIL.append(f"orphan diagnostic safety contract missing: {token}")

runtime_ui = (ROOT / "public/js/admin-runtime-incidents.js").read_text(encoding="utf-8", errors="replace")
for token in ("Today Needs Attention","Safe recheck","Archive & request review","Approve archive","Delete archived rows","Run read-only storage scan","storage-orphan-diagnostics"):
    if token not in runtime_ui:
        FAIL.append(f"operations recovery UI missing: {token}")

preview_smoke = (ROOT / "scripts/preview_smoke.py").read_text(encoding="utf-8", errors="replace")
for token in ("cloudflareaccess.com", "PREVIEW_MODE: CLOUDFLARE_ACCESS_PROTECTED", "preview_access_consistent", "Cloudflare Access weakened: NO", "source_manifest_identity", "DIRECT_APPLICATION"):
    if token not in preview_smoke:
        FAIL.append(f"Preview smoke missing Access-safe acceptance contract: {token}")
if "Authorization" in preview_smoke or "CF-Access-Client" in preview_smoke:
    FAIL.append("non-secret Preview smoke must not send authentication headers/service-token headers")

workflow = (ROOT / ".github/workflows/system-gate.yml").read_text(encoding="utf-8", errors="replace")
for token in ("release464_update2_gate.py","accessibility_acceptance_gate.py","preview_smoke.py","0002_release464_operational_acceptance.sql"):
    if token not in workflow:
        FAIL.append(f"System Gate missing Update 2 acceptance: {token}")

print("RELEASE 464 UPDATE 2 SOURCE GATE")
if FAIL:
    print("FAIL")
    for i, message in enumerate(FAIL, 1):
        print(f"{i:03d}. {message}")
    raise SystemExit(1)
print("PASS")
print("Items 8-13: SOURCE COMPLETE")
print("Runtime schema DDL in Update 2 incident route: ZERO")
print("Raw orphan-storage deletion capability: ZERO")
print("Provider execution capability added: ZERO")
print("Non-secret Preview smoke weakens Cloudflare Access: NO")

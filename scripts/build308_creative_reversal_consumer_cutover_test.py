#!/usr/bin/env python3
from __future__ import annotations

import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = "075b905c5fa7960fb7abde410571d840f1983c91"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD308_CHANGED_FILES.md",
    "BUILD308_VALIDATION.md",
    "docs/architecture/BUILD308_CREATIVE_REVERSAL_CONSUMER_CUTOVER.md",
    "functions/api/_lib/creativeInventoryReversalConsumer.js",
    "functions/api/admin/creative-process.js",
    "public/js/core/dd-module-contracts.mjs",
    "scripts/build308_creative_reversal_consumer_cutover_test.py",
}


def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def check(ok: bool, message: str) -> None:
    if not ok:
        print(f"FAIL: {message}")
        raise SystemExit(1)
    print(f"PASS: {message}")


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def main() -> int:
    consumer = text("functions/api/_lib/creativeInventoryReversalConsumer.js")
    creative = text("functions/api/admin/creative-process.js")
    contracts = text("public/js/core/dd-module-contracts.mjs")
    validation307 = text("BUILD307_VALIDATION.md")

    for path in (
        "functions/api/_lib/creativeInventoryReversalConsumer.js",
        "functions/api/admin/creative-process.js",
    ):
        subprocess.run(["node", "--check", str(ROOT / path)], check=True, cwd=ROOT)
    check(True, "Build 308 Creative consumer JavaScript syntax")

    check(
        "reverseCreativeInventoryPost" in consumer
        and "./inventoryReversalService.js" in consumer
        and "export const BUILD = 308" in consumer,
        "Creative consumer delegates to the proven Inventory-owned Build 307 service",
    )

    forbidden_consumer_writes = (
        "UPDATE site_item_inventory",
        "INSERT INTO site_inventory_movements",
        "INSERT INTO creative_project_inventory_reversals",
        "UPDATE creative_project_inventory_posts",
        "UPDATE creative_project_material_reviews",
        "INSERT INTO site_inventory_usage_movements",
    )
    check(
        not any(marker in consumer for marker in forbidden_consumer_writes),
        "Creative consumer adapter contains no direct reversal stock/ledger mutation SQL",
    )

    check(
        "creative_inventory_reversal_original_movement_missing" in consumer
        and "creative_inventory_reversal_original_movement_ambiguous" in consumer
        and "candidates.length !== 1" in consumer
        and "movement_type,'')))='consume'" in consumer,
        "original Creative consume movement resolution fails closed when missing or ambiguous",
    )

    check(
        "reverseCreativeInventoryThroughContract" in creative
        and "return reverseCreativeInventoryThroughContract(db,{projectId,postId,reason,userId});" in creative
        and creative.count("reverseInventoryPost(") == 4,
        "Creative keeps its three reversal workflows but routes their helper through Inventory authority",
    )

    check(
        "Creative Project ${projectId} inventory reversal. Reason:" not in creative
        and "'adjustment'" not in creative,
        "retired Creative direct reversal implementation is absent",
    )

    check(
        "async function postInventoryUsage" in creative
        and "action==='post_material_inventory'" in creative
        and "action==='record_inventory_use'" in creative,
        "Inventory posting remains on the existing Creative compatibility path in Build 308",
    )

    check(
        "ORDER BY is_primary DESC,creative_work_project_id DESC" in creative,
        "unrelated Creative product-link ordering remains historically unchanged",
    )

    reverse_block = contracts.split("contract('inventory-reverse'", 1)[1].split("contract('creative-projects'", 1)[0]
    post_block = contracts.split("contract('inventory-post'", 1)[1].split("contract('inventory-reverse'", 1)[0]
    check(
        "implementationState: 'implemented-creative-consumer-enabled'" in reverse_block
        and "consumerWritesReady: true" in reverse_block
        and "directStockAddBackAllowed: false" in reverse_block,
        "inventory-reverse contract records Creative consumer cutover while retaining compensating-only guardrails",
    )
    check(
        "implementationState: 'existing-authority-not-yet-contract-route'" in post_block
        and "consumerWritesReady: false" in post_block,
        "inventory-post extraction remains explicitly out of scope",
    )

    check(
        "Status — COMPLETE IN DEVELOPMENT" in validation307
        and "f1cc11000b0c90944c4224b6c0002ddab7063876" in validation307,
        "completed Build 307 reversal-service proof is historically pinned",
    )

    changed = {p for p in git("diff", "--name-only", BASE, "HEAD").splitlines() if p}
    check(changed == EXPECTED, "exact Build 308 Creative reversal consumer-cutover changed-file boundary")

    forbidden_paths = [
        p for p in changed
        if p.endswith(".sql")
        or p in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"}
        or p.startswith("functions/api/admin/site-item-inventory")
        or p.startswith("functions/api/_lib/inventoryReversalService")
        or p.startswith("public/js/core/dd-admin-module-runtime")
        or p.startswith("admin/packaging-studio")
    ]
    check(not forbidden_paths, "no schema, legacy Inventory mutation, Build 307 authority, Core lifecycle, Packaging, config, R2, or Production change")

    print("BUILD 308 CREATIVE REVERSAL CONSUMER CUTOVER: PASS")
    print("No Cloudflare resource was contacted.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

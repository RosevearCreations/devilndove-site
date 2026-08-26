#!/usr/bin/env python3
"""Build 440 local-only Product / Inventory / Tools source gate.

Preserves proven Product/Inventory authority and validates Build 440 Product removal,
asset URL safety/parity/native restore, production reversal, Inventory integrity,
Product integrity, and Tool lifecycle source contracts. It never contacts Cloudflare,
D1, R2 or providers.
"""
from __future__ import annotations
import os
from pathlib import Path
import subprocess
import sys
ROOT=Path(__file__).resolve().parents[1]; PYTHON=sys.executable
STEPS=(
 ('Build 232 product removal baseline',['node','scripts/build232_product_removal_test.mjs']),
 ('Build 244 Inventory fractional authority baseline',[PYTHON,'scripts/build244_inventory_authority_fractional_usage_regression.py']),
 ('Build 440 Product Delete Reference Inspector regression',[PYTHON,'scripts/build440_product_reference_inspector_regression_test.py']),
 ('Build 440 Resource Asset URL regression',['node','scripts/build440_resource_asset_url_regression_test.mjs']),
 ('Build 440 Inventory Asset Parity regression',[PYTHON,'scripts/build440_inventory_asset_parity_regression_test.py']),
 ('Build 440 Native Development Inventory Asset Restore regression',[PYTHON,'scripts/build440_inventory_asset_server_restore_regression_test.py']),
 ('Build 440 Finished Production Reversal regression',[PYTHON,'scripts/build440_finished_production_reversal_regression_test.py']),
 ('Build 440 Inventory Integrity Review regression',[PYTHON,'scripts/build440_inventory_integrity_review_regression_test.py']),
 ('Build 440 Product Integrity Review regression',[PYTHON,'scripts/build440_product_integrity_review_regression_test.py']),
 ('Build 440 Tool Lifecycle regression',[PYTHON,'scripts/build440_tool_lifecycle_regression_test.py']),
 ('Build 440 delete-product UI JavaScript syntax',['node','--check','public/js/admin-delete-product.js']),
 ('Build 440 cleanup-centre UI JavaScript syntax',['node','--check','public/js/admin-product-cleanup.js']),
 ('Build 440 resource-search API JavaScript syntax',['node','--check','functions/api/admin/product-resource-search.js']),
 ('Build 440 Admin asset URL safety JavaScript syntax',['node','--check','public/js/admin-asset-url-safety.js']),
 ('Build 440 Inventory asset transport guard JavaScript syntax',['node','--check','public/js/admin-inventory-asset-transport-guard.js']),
 ('Build 440 Inventory asset parity API JavaScript syntax',['node','--check','functions/api/admin/inventory-asset-parity.js']),
 ('Build 440 Inventory native restore API JavaScript syntax',['node','--check','functions/api/admin/inventory-asset-restore.js']),
 ('Build 440 Inventory asset parity/restore UI JavaScript syntax',['node','--check','public/js/admin-inventory-asset-parity.js']),
 ('Build 440 production-reversal API JavaScript syntax',['node','--check','functions/api/admin/product-production-reversal.js']),
 ('Build 440 production-reversal UI JavaScript syntax',['node','--check','public/js/admin-product-production-reversal.js']),
 ('Build 440 Inventory Integrity API JavaScript syntax',['node','--check','functions/api/admin/inventory-integrity-review.js']),
 ('Build 440 Inventory Integrity UI JavaScript syntax',['node','--check','public/js/admin-inventory-integrity-review.js']),
 ('Build 440 Product Integrity API JavaScript syntax',['node','--check','functions/api/admin/product-integrity-review.js']),
 ('Build 440 Product Integrity UI JavaScript syntax',['node','--check','public/js/admin-product-integrity-review.js']),
 ('Build 440 Tool Lifecycle API JavaScript syntax',['node','--check','functions/api/admin/tool-lifecycle-review.js']),
 ('Build 440 Tool Lifecycle UI JavaScript syntax',['node','--check','public/js/admin-tool-lifecycle-review.js']),
 ('Build 440 Admin loader JavaScript syntax',['node','--check','public/js/admin.js']),
 ('Tools public API JavaScript syntax baseline',['node','--check','functions/api/tools.js']),
)
def run(label,args):
 print('\n'+'='*60);print(label.upper());print('='*60);r=subprocess.run(args,cwd=ROOT,env={**os.environ,'NO_COLOR':'1','FORCE_COLOR':'0'},check=False)
 if r.returncode: print(f'STOP: {label} failed with exit code {r.returncode}.',file=sys.stderr);raise SystemExit(r.returncode)
def main():
 print('BUILD 440 PRODUCT / INVENTORY / TOOLS SOURCE GATE');print('Cloudflare/D1/R2/provider access: NONE');print('Production mutation capability: NONE');print('Remote schema mutation: NONE (focused Tool migration is source-validated only)')
 for label,args in STEPS: run(label,list(args))
 print('\n'+'='*60);print('BUILD 440 PRODUCT / INVENTORY / TOOLS SOURCE GATE: PASS');print('='*60)
 print('Product removal safety baseline: PASS / BOUNDED V2');print('Inventory fractional authority baseline: PASS');print('Product Delete Reference Inspector: PASS / SOURCE READY');print('Resource image object-key URL handling: PASS / # -> %23');print('Inventory Admin asset payload boundary: PASS / NORMALIZED BEFORE RENDER');print('Inventory generated-HTML asset boundary: PASS / NORMALIZED BEFORE HTML PARSE');print('Inventory direct src/href asset boundary: PASS / GUARDED');print('Development Tool/Supply R2 parity diagnostic: PASS / MANUAL / LIST-ONLY');print('Development R2 parity mutation capability: NONE');print('Development R2 restore authority: DEPLOYED DEVELOPMENT APP / NATIVE D1+R2 BINDINGS');print('Development R2 restore local Wrangler/npm/Python dependency: NONE');print('Development R2 restore scope: CURRENT D1 KEYS / BATCH 8 / MISSING ONLY / NO OVERWRITE');print('Development R2 restore source integrity: SHA256 + BOUNDED IMAGE BYTES');print('Development R2 restore final acceptance: EXACT PARITY RECHECK');print('Finished Production reversal: PASS / SOURCE READY');print('Production reversal ledger: EXISTING product_production_runs AUTHORITY');print('Reversal raw-stock basis: IMMUTABLE RUN SNAPSHOT');print('Reversal finished-stock guard: FAIL-CLOSED CURRENT QUANTITY');print('Double reversal: BLOCKED');print('Inventory physical count: PASS / AUDITED / CONCURRENCY-GUARDED');print('Usage Setup Required: PASS / LEGACY SAFE DEFAULT REVIEW');print('Inventory integrity authority: EXISTING TABLES / NO NEW SCHEMA');print('Ingredient review queue: PASS / EXISTING PRODUCT RESOURCE AUTHORITY');print('Product media integrity queue: PASS / BUILD 245 SNAPSHOT + GALLERY CHECKS');print('Product integrity queue mutation authority: NONE / OPEN OWNER ONLY');print('Tool identity/usage authority: EXISTING INVENTORY / REUSABLE USAGE LEDGER');print('Tool lifecycle authority: PASS / FOCUSED BUILD 440 MIGRATION SOURCE READY');print('Tool do-not-reuse safety: OUT-OF-SERVICE + RETIRED ENFORCED / REACTIVATE EXPLICIT');print('Protected history deletion authority: UNCHANGED');print('Tool lifecycle Development migration executed by source gate: NO');print('D1/R2 mutation executed by source gate: NO');print('R2/provider mutation executed by source gate: NO');print('Production D1 mutation executed: NO');print('PRODUCTION PROMOTION: CLOSED');print('\nNext local review: git diff --check && git status --short');return 0
if __name__=='__main__': raise SystemExit(main())

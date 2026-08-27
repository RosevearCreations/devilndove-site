#!/usr/bin/env python3
"""Build 440 local-only Product / Inventory / Tools source gate.

Preserves proven Product/Inventory authority and validates Product removal, resource
persistence/identity normalization, Accounting-owned Product-cost schema, asset safety,
lot-aware production/reversal, receiving/source provenance, kit/component depletion,
Inventory integrity, Product integrity, public Tool/Supply authority and Tool lifecycle.
It never contacts Cloudflare, D1, R2 or providers.
"""
from __future__ import annotations
import os
from pathlib import Path
import subprocess
import sys
ROOT=Path(__file__).resolve().parents[1]; PYTHON=sys.executable
STEPS=(
 ('Build 232 product removal baseline',['node','scripts/build232_product_removal_test.mjs']),
 ('Build 243 Inventory case normalization baseline',[PYTHON,'scripts/build243_inventory_resilience_regression.py']),
 ('Build 244 Inventory fractional authority baseline',[PYTHON,'scripts/build244_inventory_authority_fractional_usage_regression.py']),
 ('Build 253 linked human-readable Inventory labels baseline',[PYTHON,'scripts/build253_inventory_link_labels_reset_regression.py']),
 ('Build 440 Product Resource Persistence and Normalization regression',['node','scripts/build440_product_resource_persistence_regression_test.mjs']),
 ('Build 440 Product Cost Schema Ownership regression',[PYTHON,'scripts/build440_product_cost_schema_ownership_regression_test.py']),
 ('Build 440 Public Tool Supply Inventory Authority regression',[PYTHON,'scripts/build440_public_inventory_authority_regression.py']),
 ('Build 440 Product Delete Reference Inspector regression',[PYTHON,'scripts/build440_product_reference_inspector_regression_test.py']),
 ('Build 440 Resource Asset URL regression',['node','scripts/build440_resource_asset_url_regression_test.mjs']),
 ('Build 440 Inventory Asset Parity regression',[PYTHON,'scripts/build440_inventory_asset_parity_regression_test.py']),
 ('Build 440 Native Development Inventory Asset Restore regression',[PYTHON,'scripts/build440_inventory_asset_server_restore_regression_test.py']),
 ('Build 440 Product Inventory Lot Provenance regression',[PYTHON,'scripts/build440_product_inventory_lot_provenance_regression_test.py']),
 ('Build 440 Inventory Receiving Source Provenance regression',[PYTHON,'scripts/build440_inventory_receiving_regression_test.py']),
 ('Build 440 Inventory Source Provenance Review regression',[PYTHON,'scripts/build440_inventory_source_provenance_review_regression_test.py']),
 ('Build 440 Inventory Kit Component Depletion regression',['node','scripts/build440_inventory_kit_component_depletion_regression_test.mjs']),
 ('Build 440 Inventory Kit D1 Runtime Contract regression',['node','scripts/build440_inventory_kit_runtime_contract_test.mjs']),
 ('Build 440 Finished Production Reversal regression',[PYTHON,'scripts/build440_finished_production_reversal_regression_test.py']),
 ('Build 440 Inventory Integrity Review regression',[PYTHON,'scripts/build440_inventory_integrity_review_regression_test.py']),
 ('Build 440 Product Integrity Review regression',[PYTHON,'scripts/build440_product_integrity_review_regression_test.py']),
 ('Build 440 Tool Lifecycle regression',[PYTHON,'scripts/build440_tool_lifecycle_regression_test.py']),
 ('Build 440 API commitment constraint middleware JavaScript syntax',['node','--check','functions/api/_middleware.js']),
 ('Build 440 Product resource API JavaScript syntax',['node','--check','functions/api/admin/product-resources.js']),
 ('Build 440 Product resource data helper JavaScript syntax',['node','--check','functions/api/admin/_productResourcesData.js']),
 ('Build 440 Product costs API JavaScript syntax',['node','--check','functions/api/admin/product-costs.js']),
 ('Build 440 receiving helper JavaScript syntax',['node','--check','functions/api/_lib/inventoryReceiving.js']),
 ('Build 440 receiving reversal helper JavaScript syntax',['node','--check','functions/api/_lib/inventoryReceivingReversal.js']),
 ('Build 440 kit authority helper JavaScript syntax',['node','--check','functions/api/_lib/inventoryKitService.js']),
 ('Build 440 receiving API JavaScript syntax',['node','--check','functions/api/admin/inventory-receiving.js']),
 ('Build 440 source provenance review API JavaScript syntax',['node','--check','functions/api/admin/inventory-source-provenance-review.js']),
 ('Build 440 kit API JavaScript syntax',['node','--check','functions/api/admin/inventory-kits.js']),
 ('Build 440 kit component usage API JavaScript syntax',['node','--check','functions/api/admin/inventory-kit-component-usage.js']),
 ('Build 440 purchase-order receiving JavaScript syntax',['node','--check','functions/api/admin/purchase-orders.js']),
 ('Build 440 receiving UI JavaScript syntax',['node','--check','public/js/admin-inventory-receiving.js']),
 ('Build 440 receiving reversal UI JavaScript syntax',['node','--check','public/js/admin-inventory-receiving-reversal.js']),
 ('Build 440 source provenance review UI JavaScript syntax',['node','--check','public/js/admin-inventory-source-provenance-review.js']),
 ('Build 440 kit UI JavaScript syntax',['node','--check','public/js/admin-inventory-kits.js']),
 ('Build 440 kit component usage UI JavaScript syntax',['node','--check','public/js/admin-inventory-kit-component-usage.js']),
 ('Build 440 delete-product UI JavaScript syntax',['node','--check','public/js/admin-delete-product.js']),
 ('Build 440 cleanup-centre UI JavaScript syntax',['node','--check','public/js/admin-product-cleanup.js']),
 ('Build 440 resource-search API JavaScript syntax',['node','--check','functions/api/admin/product-resource-search.js']),
 ('Build 440 Admin asset URL safety JavaScript syntax',['node','--check','public/js/admin-asset-url-safety.js']),
 ('Build 440 Inventory asset transport guard JavaScript syntax',['node','--check','public/js/admin-inventory-asset-transport-guard.js']),
 ('Build 440 Inventory asset parity API JavaScript syntax',['node','--check','functions/api/admin/inventory-asset-parity.js']),
 ('Build 440 Inventory native restore API JavaScript syntax',['node','--check','functions/api/admin/inventory-asset-restore.js']),
 ('Build 440 Inventory asset parity/restore UI JavaScript syntax',['node','--check','public/js/admin-inventory-asset-parity.js']),
 ('Build 440 lot-provenance helper JavaScript syntax',['node','--check','functions/api/_lib/productLotProvenance.js']),
 ('Build 440 production-release API JavaScript syntax',['node','--check','functions/api/admin/product-production-release.js']),
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
 ('Supplies public API JavaScript syntax baseline',['node','--check','functions/api/supplies.js']),
)
def run(label,args):
 print('\n'+'='*60);print(label.upper());print('='*60);r=subprocess.run(args,cwd=ROOT,env={**os.environ,'NO_COLOR':'1','FORCE_COLOR':'0'},check=False)
 if r.returncode: print(f'STOP: {label} failed with exit code {r.returncode}.',file=sys.stderr);raise SystemExit(r.returncode)
def main():
 print('BUILD 440 PRODUCT / INVENTORY / TOOLS SOURCE GATE');print('Cloudflare/D1/R2/provider access: NONE');print('Production mutation capability: NONE');print('Remote schema mutation: NONE (focused Build 440 migrations are source-validated only)')
 for label,args in STEPS: run(label,list(args))
 print('\n'+'='*60);print('BUILD 440 PRODUCT / INVENTORY / TOOLS SOURCE GATE: PASS');print('='*60)
 print('Product removal safety baseline: PASS / BOUNDED V2');print('Inventory identity case-normalization: PASS / MERGE-SAFE');print('Inventory fractional authority baseline: PASS');print('Product resource link persistence: ATOMIC D1 BATCH / READBACK VERIFIED');print('Product use-per-batch default: MISSING/NON-POSITIVE -> 1');print('Product lot-size default: MISSING/NON-POSITIVE -> 1');print('Product resource submitted duplicates: NORMALIZED KIND+KEY / CASE-INSENSITIVE');print('Product resource linked names: D1 INVENTORY FIRST / HUMAN-READABLE / NORMALIZED IDENTITY');print('Public Tool/Supply authority: CATALOG PUBLICATION REGISTRY + LIVE INVENTORY METADATA');print('Legacy Tool/Supply JSON: EMERGENCY READ-ONLY FALLBACK / RUNTIME REIMPORT DISABLED');print('Inventory-only internal Tool/Supply rows: NOT PUBLICLY EXPOSED');print('Product cost schema ownership: ACCOUNTING MIGRATION-OWNED / REQUEST-TIME DDL NONE');print('Product media review product count: DISTINCT PRODUCT SIGNAL');print('Product Delete Reference Inspector: PASS / SOURCE READY');print('Resource image object-key URL handling: PASS / # -> %23');print('Inventory Admin asset payload boundary: PASS / NORMALIZED BEFORE RENDER');print('Inventory generated-HTML asset boundary: PASS / NORMALIZED BEFORE HTML PARSE');print('Inventory direct src/href asset boundary: PASS / GUARDED');print('Development Tool/Supply R2 parity diagnostic: PASS / MANUAL / LIST-ONLY');print('Development R2 parity mutation capability: NONE');print('Development R2 restore authority: DEPLOYED DEVELOPMENT APP / NATIVE D1+R2 BINDINGS');print('Development R2 restore local Wrangler/npm/Python dependency: NONE');print('Development R2 restore final acceptance: EXACT PARITY RECHECK');print('Product/Inventory lot provenance: PASS / FORWARD CUTOVER / NO FABRICATED HISTORY');print('Raw production material authority: inventory_purchase_lots + inventory_lot_policies');print('Physical raw-lot reconciliation: NON-RETURNED STOCK / QUARANTINE PRESERVED');print('Raw lot depletion policy: FIFO/FEFO / REVIEWED MANUAL FAIL-CLOSED');print('Raw lot readiness: RECONCILED REQUIRED');print('Raw material costing: PURCHASE-LOT LANDED COST SNAPSHOT');print('Finished inventory provenance: LEGACY OPENING BALANCE + NEW PRODUCTION LOTS');print('Downstream order commitment attribution: POST-CUTOVER FIFO');print('Refund policy: REMAINS PHYSICALLY COMMITTED UNTIL EXPLICIT RETURN/RESTOCK');print('Order oversell guard: INSERT/UPDATE/REACTIVATION FAIL-CLOSED');print('Partial checkout conflict: PARENT ORDER CANCELLED + 409 MAPPED');print('Finished inventory reduction below commitments: BLOCKED');print('Inventory receiving authority: site_item_inventory + site_inventory_movements + inventory_purchase_lots');print('Barcode/SKU resolver: NORMALIZED / AMBIGUOUS FAIL-CLOSED / NO HISTORICAL BARCODE FABRICATION');print('Supplier/source provenance: NORMALIZED MULTI-SOURCE / PREFERRED SOURCE EXPLICIT');print('Supplier/source cleanup: METADATA-ONLY REVIEW / LEGACY FIELD SYNC');print('Purchase-order receiving: SHARED LOT-AWARE SERVICE / PARTIAL RECEIPT SAFE');print('Receipt reversal: ONE COMPENSATING REVERSAL / UNCONSUMED PURCHASE LOT REQUIRED');print('Finished Product receiving cross-mutation: BLOCKED');print('Receiving camera scan: USER-TRIGGERED / BOUNDED / NO BACKGROUND POLLING');print('Purchased-kit opening: ATOMIC PARENT AGGREGATE + EXACT LOT -> CHILD BALANCES');print('Released Supply kit components: NEW PURCHASE LOT + WEIGHTED ALLOCATED COST');print('Kit component exact/estimated use: ATOMIC INVENTORY + USAGE + PURCHASE-LOT DEPLETION');print('Kit component reusable/log-only use: USAGE EVIDENCE / NO FALSE STOCK CONSUMPTION');print('Kit D1-shaped runtime contract: PASS / BIND COUNTS + ATOMIC BATCH COMPOSITION');print('Kit historical provenance: NO FABRICATION / LOT RECONCILIATION REQUIRED');print('Kit Product cross-mutation: BLOCKED');print('Finished Production reversal: PASS / SOURCE READY');print('Production reversal raw-stock basis: IMMUTABLE RUN + PURCHASE-LOT SNAPSHOT');print('Production reversal finished-stock guard: RUN LOT DOWNSTREAM COMMITMENT ATTRIBUTION');print('Pre-cutover reversal policy: CONSERVATIVE AGGREGATE STOCK / NO HISTORICAL PROVENANCE CLAIM');print('Double reversal: BLOCKED');print('Inventory physical count: PASS / AUDITED / CONCURRENCY-GUARDED');print('Usage Setup Required: PASS / LEGACY SAFE DEFAULT REVIEW');print('Ingredient review queue: PASS / EXISTING PRODUCT RESOURCE AUTHORITY');print('Product media integrity queue: PASS / BUILD 245 SNAPSHOT + CANONICAL GALLERY CHECKS');print('Product integrity queue mutation authority: NONE / OPEN OWNER ONLY');print('Tool identity/usage authority: EXISTING INVENTORY / REUSABLE USAGE LEDGER');print('Tool lifecycle authority: PASS / FOCUSED BUILD 440 MIGRATION SOURCE READY');print('Tool do-not-reuse safety: OUT-OF-SERVICE + RETIRED ENFORCED / REACTIVATE EXPLICIT');print('Protected history deletion authority: UNCHANGED');print('Build 440 Development migrations executed by source gate: NO');print('D1/R2 mutation executed by source gate: NO');print('R2/provider mutation executed by source gate: NO');print('Production D1 mutation executed: NO');print('PRODUCTION PROMOTION: CLOSED');print('\nNext local review: git diff --check && git status --short');return 0
if __name__=='__main__': raise SystemExit(main())

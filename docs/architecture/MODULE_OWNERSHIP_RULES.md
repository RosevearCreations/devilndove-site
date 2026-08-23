# Devil n Dove Module Ownership Rules — Build 281

This document defines the classification used by the Build 281 local inventory tool. It is a starting map, not permission logic.

## Ownership labels

| Label | Primary responsibility |
|---|---|
| `CORE` | shared auth/session/API/error/module infrastructure |
| `PUBLIC` | customer-facing static/presentation shell |
| `CATALOG` | products, catalog, commerce and merchandising |
| `INVENTORY` | supplies, tools, materials, inventory and source/cost movement |
| `CREATIVE` | Creative Process projects, work timeline and actual-material review |
| `CAIP` | private creative assets, evidence, derivatives and story intelligence |
| `PACKAGING` | packaging, labels, formulas, INCI, claims and print templates |
| `CONTENT` | Media & Content Studio, content projects/deliverables and site media |
| `MARKETING` | SEO, social publishing, campaigns and distribution |
| `ACCOUNTING` | ledger, journals, reconciliation, statements and financial operations |
| `ADMIN` | users, platform settings, release/readiness, diagnostics and maintenance |
| `LEGACY_REVIEW` | ownership not yet safe to infer automatically |

## Classification principles

1. Ownership means **who owns the business rule**, not who happens to call the code today.
2. Shared code is `CORE` only when multiple domains genuinely need the same generic behavior. Do not move domain logic into Core merely to avoid deciding ownership.
3. Ambiguous files stay `LEGACY_REVIEW` until reviewed. A wrong confident assignment is worse than an explicit backlog item.
4. CAIP-specific Creative Asset/evidence/derivative code belongs to `CAIP`; ordinary project lifecycle/timeline/material-review code belongs to `CREATIVE`.
5. Packaging ingredient/INCI/template logic belongs to `PACKAGING`; actual stock quantity and movement belong to `INVENTORY`.
6. Content authoring/site media belongs to `CONTENT`; downstream social/SEO/distribution belongs to `MARKETING`.
7. Checkout/customer product flow belongs to `CATALOG`; financial posting/reconciliation belongs to `ACCOUNTING`.
8. Authentication primitives are `CORE`; user/platform-management screens are `ADMIN`.
9. Public pages are `PUBLIC` even when they consume catalog/content/marketing capabilities.
10. File ownership is not database authorization. Protected Functions must continue to authenticate independently.

## Boundary rule for future file moves

Prefer a future shape similar to:

```text
public/js/core/
public/modules/catalog/
public/modules/inventory/
public/modules/creative/
public/modules/caip/
public/modules/packaging/
public/modules/content/
public/modules/marketing/
public/modules/accounting/
public/modules/admin/
```

and, where useful after callers are migrated:

```text
functions/api/modules/<module>/
```

Build 281 does **not** mass-move existing files into these folders.

## Ownership inventory

Run:

```bash
python scripts/build281_module_inventory.py --write
```

The generated report is placed under `.wrangler/build281/` so it is local evidence rather than a manually maintained source file. Review the `LEGACY_REVIEW` rows first; those are the places where architecture decisions are still required.

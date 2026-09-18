# Release 467 — Build 183 Inventory & Tool/Supply Identity Cleanup

## Purpose

Build 181 exposed cross-authority catalog health. Build 182 improved Product facts and buyer readiness. Build 183 now concentrates on the **identity and operating facts of Tools and Supplies** while preserving the established Inventory mutation authorities.

This build does not create another inventory editor. Instead, it adds a bounded live-D1 review layer that answers:

- do multiple active Inventory rows represent the same source identity?
- is an item missing the supplier or source information needed to understand where it came from?
- does usage tracking still need a human-reviewed mode/conversion?
- is physical-count or reorder context stale or contradictory?
- does the Inventory Tool/Supply kind still agree with the catalog reference for the same source key?

## New review workspace

Inventory Operations now contains:

**Tool & Supply Identity Review**

The workspace is mounted in `/admin/inventory-operations/` and remains idle on page startup.

Nothing is read until the operator explicitly chooses:

- **Load identity health**; or
- **Load 40 issue rows**.

The API authority is:

`GET /api/admin/inventory-identity-health`

Runtime contract:

- read-only;
- Admin-only;
- live D1;
- issue rows capped at 40;
- no polling;
- no background retry;
- no request-time schema mutation;
- no R2 lookup or mutation;
- no Product mutation;
- no Inventory mutation.

## Identity review areas

### Duplicate / missing identity

Build 183 identifies:

- active Tool/Supply rows sharing the same normalized external/source key;
- same-kind duplicates;
- cross-kind Tool/Supply duplicates;
- missing external keys.

A duplicate is **never merged automatically**.

If review confirms that the same source key was historically classified once as Tool and once as Supply, the operator opens the existing Inventory editor and deliberately corrects Tool/Supply classification. The established Build 244 mutation authority already supports this reviewed correction:

- it detects a canonical target;
- it consolidates the misclassified record;
- it uses the established max-stock policy to avoid legacy duplicate default stock being double-counted;
- it updates linked Product-resource kind references;
- it updates/archives the corresponding catalog kind reference;
- it records Inventory movement evidence.

Build 183 exposes the problem; Build 244 remains the mutation authority.

### Supplier / source facts

Build 183 flags:

- missing supplier name;
- missing source/Amazon URL;
- sourced rows that still lack a supplier SKU.

The operator is routed to the existing Full Edit Inventory form so the complete row can be reviewed before any save.

### Usage mode

Build 183 flags:

- Supplies with no usage profile;
- legacy Supplies still in the safe `log_only` review state;
- Tools that have an explicit usage profile but are not marked reusable.

Usage fixes route to the existing Physical Count & Usage Setup Review. That existing audited authority remains responsible for saving:

- tracking mode;
- stock unit;
- usage unit;
- usage-units-per-stock conversion;
- minimum usage increment;
- review note.

### Physical count / reorder context

Build 183 flags:

- never-counted items;
- counts older than 90 days;
- stock at/below a configured reorder level but not on the reorder list when reorder is permitted;
- items marked both do-not-reorder and on-reorder-list.

No count or reorder value changes automatically.

### Catalog-reference drift

The new review distinguishes:

- **matched** — active catalog row exists for the same kind + source key;
- **kind_drift** — the source key exists in catalog data under the other Tool/Supply kind;
- **missing** — no active Tool/Supply catalog reference exists for that source key.

Build 184 will address image evidence separately. Build 183 deliberately does not use image drift as an identity mutation trigger.

## Operator actions

The review queue has two explicit routes:

- **Open Inventory editor** — filters the existing Tools & Supplies Inventory Operations table to the selected identity. The operator then chooses Full edit and reviews the entire record before saving.
- **Open count / usage review** — opens the established integrity queue for that identity.

This keeps all writes in their proven owners and prevents a diagnostic screen from becoming an accidental mutation surface.

## D1 acceptance

D1 is fully functional and is used as the live Development authority for Build 183 acceptance.

The Build 183 workflow performs a read-only query against exact `devilndove-dev`, recording:

- active Tool/Supply count;
- duplicate source-key rows;
- missing supplier count;
- missing source-reference count;
- usage-review count;
- count-due count;
- reorder-review count;
- unmatched catalog-reference count.

No Development data is copied wholesale into Production. Production business data remains Production-owned.

## Safety boundary

Build 183 introduces:

- no canonical migration;
- no request-time DDL;
- no automatic duplicate merge;
- no automatic classification change;
- no automatic supplier/source edit;
- no automatic usage/count/reorder edit;
- no Product or Product-image mutation;
- no R2 mutation;
- no provider/publication execution;
- no payment/refund action;
- no accounting posting.

## Acceptance

Build 183 is GREEN only when:

1. Build 183 source gate passes;
2. exact Development D1 identity-health proof is GREEN;
3. retained Build 182, 181, 180 and Inventory regressions remain GREEN;
4. exact-SHA Development System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene are GREEN;
5. the exact Development SHA is promoted non-force to `main`;
6. Production Pages, Live Resource Integrity, Product Production Browser, Product Route Production and Build 183 proof are GREEN on that exact SHA.

## Next planned build

**Build 184 — Product & Tool/Supply Image Repair Workflow** will use the health evidence already gathered to unify missing-image, image-source, alt-text and R2 evidence review while keeping finished-Product media, Tool/Supply media and static-site Media Studio as separate authorities.

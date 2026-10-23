# Devil n Dove — Maker Application Build Queue 439–455

**Recorded:** 2026-10-23  
**Repository:** `RosevearCreations/devilndove-site`  
**Status:** Approved queue for sequential implementation; **planning documentation only**, not a claim that these builds are implemented or Production GREEN.  
**Next build:** **439 — Etsy Live Draft Creation & Connection Acceptance**.

## Why this queue exists

Devil n Dove is a real, mixed-discipline maker workshop, not simply an online store. We make jewellery, polymer-clay and resin work, candles and soap, metal/forge and lost-wax castings, lapidary, wirework, laser/CNC and 3D-print objects, sublimation/apparel, gifts and experiments. Some attempts succeed, some fail, some are repaired or salvaged, and many are therapeutic or private rather than for sale.

An honest Maker application must trace **idea → materials/design → workstation/process → attempt → result/learning → finished object → optional listing/commission/fulfilment**. A project must never be forced to create a saleable Product. Existing Creative Projects, knowledge/recipe history, manufacturing travelers, production QA, Inventory, commissions, media and cross-project costing are the authoritative building blocks: **extend and connect them rather than create rival ledgers**.

The previous queue is [Builds 429–438](RELEASE_467_BUILD_429_438_ROADMAP.md). In practice Build **438** was redirected from the historical “release evidence consolidation” plan to the urgent Etsy/Facebook Product Editor tab and draft boundary. Its source was merged to `main` at `f5a16a3974180decf474b8f70bb76fdcb07f1f40`, with [Production Pages Deploy](https://github.com/RosevearCreations/devilndove-site/actions/runs/39890910076) and [Live Resource Integrity Proof](https://github.com/RosevearCreations/devilndove-site/actions/runs/39891012729) successful. **A live authenticated Etsy draft write has not been accepted**; Build 439 must prove it. The old release evidence wrap-up belongs in Build 455.

> Historical CAIP source files also contain “Build 439” labels from a separate prior feature stream. Those are legacy provenance identifiers, **not** evidence that the **Maker queue Build 439** below is done.

## Phase 1 — First make the current seller workflow actually work

### Build 439 — Etsy Live Draft Creation & Connection Acceptance
**Priority:** P0, first. **Depends on:** Build 438 Product Editor tabs and existing Etsy OAuth grant.
- In the existing Admin Etsy area, show shop identity, connected scopes, token state, expiry/refresh result and actionable errors without leaking credentials.
- Validate the authorized Etsy shop and listing prerequisites (including current taxonomy, inventory, shipping and processing-profile requirements); distinguish absent permissions from expired token, missing product data and Etsy rejection.
- From an **existing canonical Product**, prepare a human-reviewable payload; create **one real unpublished Etsy draft** only after an explicit owner click; upload approved canonical media when supported and reconcile the returned listing ID, state and link.
- Save provider request/response provenance and idempotent retry state; never create duplicate drafts or activate a listing through a retry. Respect Canada-only delivery constraints.
**Acceptance:** One owner-approved test product produces a confirmed **draft**, visible in Etsy with the matching ID; reconnection and error paths tested; no public publication and no duplicated listings. If permission or credentials block it, report **HOLD** with exact missing requirement rather than GREEN.

### Build 440 — Product Editor Reliability & Unified Publishing
**Priority:** P0. **Depends on:** 439.
- Repair all Product Editor load/save/validation, zero-price, stock, SKU, canonical-media/image-order and async state failures; preserve unsaved work across recoverable errors.
- Keep distinct **Storefront**, **Etsy** and **Facebook Marketplace** tabs, with per-channel readiness, owner approval, actual provider state and clear drafts versus published labels.
- Make mobile, keyboard, contrast and long-form layout usable; enforce safe operator-only routes and bounded network requests.
**Acceptance:** Create/edit/reopen a Product with photos and CAD price, save all fields, prepare an Etsy draft and see accurate channel status without false success.

### Build 441 — Facebook Marketplace Integration & Authorization
**Priority:** P0/P1 after Etsy. **Depends on:** 440 and owner-provided Meta credentials.
- Display separate Meta connection and permission diagnostics; verify exactly which app, Page, catalog, Commerce account and supported APIs the owner is allowed to use.
- Implement official catalog/item draft or sync operations **only where actually authorized and supported**. Ordinary individual Marketplace listing automation must never be promised without a supported capability.
- Provide a clearly marked owner-reviewed export/copy workflow when direct publishing is unavailable. No credential disclosure, fake provider success or surprise publication.
**Acceptance:** Permission report and one provable authorized test path; explicit **MANUAL** or **HOLD** if the requested Marketplace action cannot be done through Meta's supported API.

## Phase 2 — Daily workshop journey

### Build 442 — Maker Home & Guided Project Creation
**Priority:** P1. **Depends on:** 440.
- A welcoming home dashboard routes **idea, experiment, prototype, one-off, batch, gift and commissioned work** into existing Creative Project identities.
- Show next step, blocked materials, paused work and recent successes/failures without forcing a Product, price or listing.
- Give large touch targets, optional brief notes and accessible resumable progress.
**Acceptance:** Start three unlike projects, pause and resume them, and finish a private/non-sale attempt without touching the storefront.

### Build 443 — Multi-Process Templates & Recipe Reuse
**Priority:** P1. **Depends on:** 442; reuse Builds 221–222 knowledge/recipe history.
- Offer editable versioned workflows for clay, UV/epoxy resin, candle/soap, wirework, wax/lost-wax/sand casting, forging, CNC, laser, 3D print, sublimation and custom hybrids.
- Record materials, equipment/settings, wait/cure time, hazards, checkpoints, “worked/didn't work”, source project and confidence.
- Keep recipe suggestions provisional and operator-approved; do not invent successful settings.
**Acceptance:** Reuse a versioned recipe on a second project, preserve the first attempt's values and record an adjusted version.

### Build 444 — Digital Designs, Files & Version History
**Priority:** P1. **Depends on:** 442.
- Associate CAD/CAM and reference assets (e.g. STL, 3MF, SVG, DXF, G-code, photos, patterns) with projects and source revisions; record file type, license/source, machine readiness and review.
- Protect originals, access boundaries and ownership; revisions should not silently replace approved output.
**Acceptance:** Trace a manufactured piece back to the exact design/file revision, while keeping an earlier failed design accessible.

### Build 445 — Bill of Materials & Actual Inventory Usage
**Priority:** P1. **Depends on:** 443 and existing Build 380 project costing.
- Build a process-aware BOM using **canonical Inventory stock units, usage units, supplier lots and current workstation allocation**; support planned, reserved, partially consumed, returned and scrapped quantities.
- Handle bulk-to-usage conversion and partial packages without negative stock, double posting or fabricated counts.
**Acceptance:** One resin project and one metal/jewellery project consume correct real stock quantities and preserve exact movement receipts.

### Build 446 — Guided Manufacturing & Job Traveler
**Priority:** P1. **Depends on:** 443–445 and existing Build 219 travelers / Build 379 work orders.
- Turn a selected process revision into workstation-by-workstation traveler steps with photos, timed/cure checkpoints, operator notes, work time and pause/resume.
- Support interruptions, equipment availability, substitutions and clear manual completion authority.
**Acceptance:** Complete one multi-step job over separate sessions; time, checklist and evidence survive refresh without duplicated events.

### Build 447 — Finished Quality, Failures, Rework & Salvage
**Priority:** P1. **Depends on:** 446; extend existing Build 220 QA.
- Record first-quality, second-quality, reject, scrap, salvage, abandoned and learning-only outcomes with photo, cause, rework and material recovery.
- Failures and prototypes remain meaningful Maker projects even with no product/revenue.
- Keep failed, unsafe or unapproved items automatically excluded from public inventory and provider listings.
**Acceptance:** Trace one good piece, one failed casting/print and one repaired piece from attempts to inventory and lessons learned without double counting stock.

### Build 448 — Tools, Workstations & Maintenance
**Priority:** P2. **Depends on:** 446; extend Build 378/381 and existing canonical Tools.
- Support tools shared among multiple workstations, locations, availability, calibration/maintenance, consumables, bookings and safety checks.
- Surface conflicts and out-of-service equipment to the traveler; never infer that a check was performed.
**Acceptance:** Two projects sharing the same tool show a real scheduling conflict, a recorded owner resolution and maintenance block.

### Build 449 — True Project Costs & Pricing
**Priority:** P2. **Depends on:** 445–448; build on Builds 380/383.
- Reconcile actual and estimated materials, consumables, packaging, machine time, labour/time and scrap/rework into a transparent CAD cost.
- Compare optional suggested sale price and margin; show **unknown**, not zero, for missing rates or allocations.
- Permit private/therapeutic work to have effort and material costs without sales requirements.
**Acceptance:** Cost comparison for a good one-off, failed batch and commission; no phantom revenue or accounting posting.

## Phase 3 — Finished pieces, customer continuity and safety

### Build 450 — Finished Pieces, Variants & Unique Inventory
**Priority:** P2. **Depends on:** 447 and 449.
- Link actual accepted production output to canonical Products, serial/unique pieces, editions, variations, kits/sets and stock moves.
- Protect one-of-one items against double allocation or overselling across Storefront/Etsy/any supported channel.
**Acceptance:** A one-off can be reserved/sold once; rejects cannot become salable and a multi-item kit decrements only actual components.

### Build 451 — Maker Photography, Videos & Product Stories
**Priority:** P2. **Depends on:** 444, 447 and 450.
- Organize before/during/after media, tutorials, project journals, failures and genuine Maker stories with source attribution.
- Reuse canonical image slots/media, consent/privacy, caption/alt text, format/dimension and operator-selected principal images.
**Acceptance:** One project produces an approved product gallery plus an optional learning story without exposing private media or old placeholders.

### Build 452 — Product Safety, Labels & Traceability
**Priority:** P1 safety gate; implement as early as product categories require. **Depends on:** 443–447 and 450.
- Provide category-specific review checklists and records for candles, soaps/cosmetics, jewellery, child-directed goods, resin and heated/metal work, based on **current Canadian regulatory guidance**.
- Associate materials/lots, warnings, allergens where applicable, labeling reviews, incidents and recall trace with finished pieces.
- No “compliant/certified” claim is generated automatically; human safety and legal review is mandatory for regulated classifications.
**Acceptance:** Trace finished item to material lot and manual label-review receipt; hold unsafe or unknown-regulatory-state items from public publication.

### Build 453 — Custom Orders & Commission Completion
**Priority:** P2. **Depends on:** 442–450; reuse existing Build 382 Commission Workbench.
- Connect inquiry → quote → customer-approved design/proof → deposit status → maker traveler → changes → accepted delivery.
- Keep customer files and communications private; distinguish payment-request drafts from actual settled payments.
**Acceptance:** Realistic commission history with an approved change, cost impact and final maker handoff; no fabricated customer approval.

### Build 454 — Packaging, Fulfillment & Aftercare
**Priority:** P2. **Depends on:** 450, 452 and 453.
- Assemble Canada-only postage/pickup decisions, protective package instructions, shipment receipts, tracking, repair/returns/damage follow-ups.
- Preserve current U.S. sales/shipping suspension until the owner explicitly changes policy.
**Acceptance:** Canadian shipped order and local pickup each reconcile to canonical orders; failure/return and customer follow-up are visible.

### Build 455 — Full Maker Journey Acceptance & Next Roadmap
**Priority:** Final gate. **Depends on:** 439–454 or explicit HOLD records.
- Execute independent end-to-end tests for jewellery/metal, mixed-media/resin or clay, digital fabrication, a failed attempt, a private therapeutic project and a commission.
- Review accessibility, autosave, security, D1/Worker/R2 quotas, media correctness, cross-channel stock and release gate evidence. Close the earlier deferred Build 438 release-evidence consolidation task.
- Capture gaps, release receipts, production verification and next numbered batch; **do not relabel incomplete work GREEN**.
**Acceptance:** Source-linked journey receipts and verifiable exact-SHA Production checks; blocked external authorization remains named HOLD, not falsely completed.

## Shared implementation rules and release acceptance

1. **Single authority:** Reuse Creative Projects, Recipe History, Inventory, manufacturing QA/travelers, Product, Media, Orders, Commissions and Finance. Migrations are additive, reviewed and forward-only. No competing ledger, manual database patch or double-counted material/financial posting.
2. **Creator-first:** Support mixed crafts, mistakes, prototypes, “seconds”, salvage and noncommercial therapy work; making is valid independent of selling.
3. **Owner control:** No automatic Etsy listing activation, unsupported Marketplace posting, purchase, material consumption, D1 mutation, publication, refund, US-shipping enablement or destructive media overwrite. Explicit intent plus durable receipt for consequential actions.
4. **Usable interface:** Standard-theme tokens, proper contrast, keyboard/accessibility, visible save/error states, touch-friendly controls and mobile usability.
5. **Cost awareness:** Keep Cloudflare Workers CPU/D1 query/storage, R2, GitHub Actions runtime and image processing bounded; page large lists; don't launch unnecessary continuous polling.
6. **Stop stalled scripts:** At start/end of each build check GitHub Actions `in_progress`, `queued`, `waiting`, `pending` and `requested`. Ensure each required workflow job has a finite `timeout-minutes`; use bounded waits, network request timeouts and retries. Report any blocked/abandoned run with exact run URL/SHA. Never cancel an unrelated active run or weaken a mandatory release check merely to clear a queue.
7. **Production authority:** For *each implemented build*: run exact-SHA Development `System Gate`, `Current Application Quality Proof`, `I.T. Admin Runtime Proof` and `Repository Hygiene` plus canonical Preview; promote only the tested state to `main`; verify Cloudflare `Production Pages Deploy`, `Production Live Resource Integrity Proof`, exact deployed SHA and live smoke. Failed, missing or inaccessible evidence = **HOLD/UNKNOWN**, never GREEN.
8. **External acceptance distinction:** Even if code/Cloudflare is GREEN, provider-authorized Etsy/Meta writes, owner-specific images or physical shop checks still require a separate **OWNER ACCEPTANCE** receipt. Do not conflate source deployment and connected-account integration.
9. **Sequence:** Default **439→455**. A safety blocker may elevate 452 earlier. A truly unsupported Meta Marketplace capability may be recorded as HOLD while subsequent local Maker features proceed after an owner decision.

## Canonical prior features to extend

- [Prototype and Sample Runs — 214](RELEASE_467_BUILD_214_PROTOTYPE_SAMPLE_PRODUCTION_RUN.md)
- [Manufacturing Travelers — 219](RELEASE_467_BUILD_219_MANUFACTURING_WORK_ORDER_JOB_TRAVELER.md)
- [QA, Rework and Scrap — 220](RELEASE_467_BUILD_220_PRODUCTION_RUN_QA_REWORK_SCRAP_EVIDENCE.md)
- [Workshop Knowledge — 221](RELEASE_467_BUILD_221_WORKSHOP_KNOWLEDGE_LIBRARY_FOUNDATION.md)
- [Recipe History — 222](RELEASE_467_BUILD_222_PROJECT_TO_KNOWLEDGE_PROMOTION_RECIPE_HISTORY.md)
- [Workstations / Materials / Commissions / Costing — 377–384](RELEASE_467_SYSTEM_WIDE_PLATFORM_BUILDS_377_384.md)
- [Build 429–438 historic queue](RELEASE_467_BUILD_429_438_ROADMAP.md)

**Queue tracking convention:** On completing a build, update `PROJECT_STATUS_AND_ROADMAP.md` with the exact build number, PR/commit, gate and deployment receipts, external HOLD items and **next queued build**. The existence of this document alone does not complete or promote a build.

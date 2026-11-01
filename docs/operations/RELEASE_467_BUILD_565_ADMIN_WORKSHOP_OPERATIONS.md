# Release 467 · Build 565 — Admin Modernization: Workshop Operations

## Approved scope and route decisions

Build 565 adopts the Brand V3 navy/purple, copper/gold Admin direction on **five legacy Workshop routes only**. The Build 556 route inventory remains a provisional static audit, not owner visual approval. New presentation is opt-in via `data-dd-workshop-v565` and `css/admin-workshop-565.css` rather than an application-wide stylesheet rewrite.

| Route | Build 556 audit | Build 565 presentation | Existing authority unchanged |
| --- | --- | --- | --- |
| `/admin/custom-request/` | IMPROVE | Concise request command header, five-section navigation, workflow quick-jumps, collapsible safeguards and clearer source-backed queue cards | Intake, photos, triage, proof, quote, traveler, production run, Inventory/Finance boundaries and non-mutating CSV exports |
| `/admin/commission-workbench/` | REVIEW | Clear commission header, scoped navigation, responsive request selector/refresh bar and completion evidence styling | Original request/quote/approval/deposit records, private commission decisions and safe customer progress |
| `/admin/project-resource-calendar/` | REVIEW | Clear date/resource filters, distinct review versus record panels, readable conflict evidence tables and mobile controls | UTC source bookings, maintenance/resource hard blocks, separate human overlap review, explicit override fields and history |
| `/admin/project-capacity-planner/` | REVIEW | Workstation demand header, search/filter workbench, responsive paging and table treatment | Source-linked project demand, inventory workstation identities and **demand-only** planning interpretation |
| `/admin/project-work-orders/` | REVIEW | Work-order header, responsive project selector, append-only evidence review surface and shared workstream navigation | Creative Process task sequencing, actual whole-minute time, real milestone events, dependency blocking and immutable status/time history |

All five routes have the same five reachable destinations, a single `aria-current="page"`, keyboard-visible focus, mobile grids, responsive forms, horizontal table scrolling and reduced-motion support. The additional quick-jumps on Custom Requests point to existing mounts. No mock metric or fabricated source-backed availability is introduced.

The legacy Commission navigation link to the non-existent `/admin/custom-requests/` was corrected to `/admin/custom-request/` (the canonical page) without changing a business action.

## Safety and unchanged screens

- No API/Worker changes, D1/R2 changes, schema migration, automated stock movement, payment/deposit settlement, booking action or customer send introduced by this build.
- A saved Production Calendar overlap still needs the exact reviewed human decision; maintenance and resource holds remain hard blocks. The Capacity planner never claims that an empty calendar proves physical availability.
- Custom Request event/market sales remain live-authority-only, with offline human notes unable to claim reservation or sale. CSV export remains read-only and no unpublished marketplace pack is created automatically.
- Commissions cannot issue customer approvals or deposit receipts. Work Orders remain append-only; dependency and real-evidence checks are unchanged.
- Existing satisfactory Product Editor, Product Browser, Maker Workbench, Made Today capture, System Operations and other specialized Maker screens are intentionally untouched.

## Proof and promotion

1. `node scripts/release467_build556_admin_interface_inventory.mjs --check` — deterministic Admin route inventory.
2. `node --test scripts/release467_build565_workshop_admin_modernization.test.mjs` — exact five-route scope, navigation, keyboard/mobile/reduced-motion styling, every critical mount/control/script, safeguards and release marker.
3. Run inherited App Quality regressions against the **exact dev commit**, along with System Gate, I.T. Admin Runtime and Repository Branch Hygiene proofs.
4. Only after all four Development proofs succeed for the same SHA, promote `dev` to `main` by PR. Require Production Pages Deploy and downstream Production Live Resource Integrity Proof success for the exact main SHA.
5. Confirm `https://devilndove.com/release-version.json` reports `"branch":"main"`, `"build":565` and `"source_sha"` equal to the proven main SHA; probe the five production pages and new scoped stylesheet.

## Next build announcement

At full Production GREEN, announce **Build 566 — Admin Modernization: Management & Systems**: selectively modernize legacy reports, configuration, I.T. and remaining System/Admin screens; leave the recently modernized System Operations and other satisfactory screens untouched.

# Devil n Dove Build 457 — Maker Workbench Usability & Navigation

**Entry point:** [/admin/maker-workbench/](/admin/maker-workbench/). Read-only authenticated Maker routing and a functional Admin dashboard card. This is a consolidation of existing source screens, **not** a replacement for Creative Projects, Job Travelers, Inventory, Finance, Customer Requests or Owner Trial reviews.

## Owner procedure

1. Open Maker Workbench, choose one real Creative Project from the current page of 25. **More projects** advances with the canonical Workflow & Evidence endpoint's bounded cursor; **Previous projects** returns to an already known cursor. Refresh requests source counts again, without polling or creating work.
2. Choose the current task (design, materials, making, quality, costing in **CAD**, photography, owner evidence or commission). Read the suggested action and inspect the four source counts. A missing count can suggest where to investigate; positive counts do **not** prove completeness.
3. Open a specialist card. Creative Process, Design Files, BOM, Finished Quality, True Costs and Maker Media now accept a safe project URL preselection when their original selectable list still contains the record. Guided Manufacturing selects a verified traveler, not an arbitrary project. Customer commission records stay in the Commission Workbench.
4. For real physical trial receipts, choose one of the six scenarios (including private learning and failed/salvage) and open **Owner trial evidence**. The original Build 456 module preselects the matching real project and scenario, without inventing an evidence source or deciding accepted/HOLD.

Each card exposes a keyboard-native expandable **ⓘ** help. Screen uses visible focus, 44px+ interactive buttons/links, a responsive one-column layout at narrow widths, skip navigation, correct field labels, and a live status message. Source metadata is rendered as text, not executable markup.

## Safety and technical boundaries

- One authenticated read-only `GET /api/admin/project-workflow-routing?cursor=N&limit=25` is made per user navigation or explicit Refresh, with cache disabled. No new D1 migration, worker runtime write or persistent Maker project table.
- The workflow routing endpoint's totals and subquery counters are the **existing authority**. No automatic score, owner trial status, product approval, media consent or public publication is asserted.
- No provider operation, Inventory movement, Accounting post, price mutation, live order, payment, Etsy/Meta listing, photo upload or external write is included.
- Real maker trial acceptance and customer/physical safety decisions remain **HOLD until owners supply evidence**, exactly as in Build 456.
- Older projects may not be in individual specialist modules' own bounded selection lists; return to Creative Process / source module for historical access rather than guessing a linked identity.

## Verification

```text
node --check public/js/admin-maker-workbench-457.js
node --check public/js/maker-workbench-policy-457.mjs
node --check public/js/admin-maker-owner-trials.js
node --test scripts/release467_build457_maker_workbench.test.mjs
python scripts/current_application_quality_gate.py
```

The route, accessibility and safety tests are synthetic source contracts. An in-person owner session on a small-screen device, keyboard and actual maker evidence remains a separate manual acceptance. Build 458 Safe Draft Recovery & Offline Workshop Resumption is the next authorized follow-up; see its separate runbook. Production GREEN is defined only by the protected `dev` → `main` release and Cloudflare Production D1/Pages/public smoke/independent integrity evidence.

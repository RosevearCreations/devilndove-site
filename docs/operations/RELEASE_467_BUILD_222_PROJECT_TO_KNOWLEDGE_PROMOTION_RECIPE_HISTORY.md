# Release 467 Build 222 — Project-to-Knowledge Promotion & Recipe History

## Exact predecessor
Build 221 is fully GREEN. Development `eceee6897410295b029f08ac728b159cf7559823`, Production `44cdd9aef639fc58343e0810a9a351986dd39052`, shared tree `321514649fa70ba2ccdc4961ca69eba08eef6962`.

## Outcome
Build 222 extends the Build 221 Workshop Knowledge Library. It promotes only human-approved Creative Project `lessons_learned` summaries into reusable recipe history. It does not replace Creative Process, the shared process catalog, Inventory, CAIP/media, or Finance.

Each approved recipe version records the exact source project, exact operation when known, canonical process identities, exact Inventory material/tool identities where known, observed settings, observed result, failure/rework notes, confidence, provenance and generalization state.

## History and correction
A new reviewed promotion can supersede the currently approved version. The prior recipe version is preserved as `superseded`; its settings, failures and provenance are not deleted. This is the successor correction path promised by Build 221's immutable reviewed foundation.

## Safety
- A `worked_once` observation is explicitly non-generalized and never called safe, universal or best.
- Unknown or untested settings remain absent/unknown.
- Settings require source evidence notes.
- Creative Project lessons must already be approved before promotion.
- Source Creative Project, operation, Inventory, process and media authorities are never rewritten.
- No request-time DDL, R2 mutation, provider execution, Finance posting or automatic publication.

## Canonical schema
Migration `0021_release467_project_knowledge_recipe_history.sql` adds immutable version, process snapshot, Inventory snapshot, observed-setting snapshot and recipe-event history.

## Acceptance
`scripts/release467_build222_gate.py` proves the source contract, retains Build 221 exact closure, validates JS syntax, enforces one H1, and checks no source-authority mutation. Exact-head Development proof and exact-tree Production promotion remain external release proofs.

## Queue
Build 223 — Capability Case Studies, Workshop Journal & Search Richness remains planned after Build 222 is exact-SHA Production GREEN. Build 224 remains the evidence-driven manufacturing-era closure build.

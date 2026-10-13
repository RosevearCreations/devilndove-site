# Release 467 Build 388 — Inventory Reconciliation Workspace & Purchase-Tax Evidence Review

## Product Editor blocking popup (reported with three screenshots)
The global Build 236 Save Confidence overlay obscured the sticky Save Product action. Product Editor explicitly opts out of the global overlay, keeps Save Product prominent and accessible, and retains a local dirty-state beforeunload warning. Saving disables the button with "Saving…" until a confirmed API response; then "Saved ✓" is shown, with error/retry text on failures. This is not autosave and does not retry the POST automatically. Existing Product and SEO are saved by the zero-introspection Product Editor endpoint; new Product creation continues using the existing creation endpoint.

## Product-generated SEO, editable
SEO title, H1 and OpenGraph title initially derive from Product Basics name. Meta and OpenGraph descriptions derive from Short Description, falling back to Long Description with markup stripped. Suggestions update when product facts change, but independently edited SEO fields are never overwritten. SEO suggestion content remains editable and is saved only by explicit Save Product. Other SEO fields (keywords, canonical URL, OG image) require operator input.

## Product Media multiple selection
"Add images (up to 5)" selects up to five image files. One explicit confirmation initiates sequential uploads through the existing one-file image authority, with one R2 write and bounded D1 work per file. Size maximum 10 MB per file; preview transformation follows selected preset for each. No background retry of uncertain writes, and the queue stops at first failed or uncertain result. The Product gallery is refreshed once after completion; there is no automatic media scoring or publication. Replace remains single-file.

## Raw materials and purchase tax evidence
Inventory Operations contains an explicit "Load recent corrections" button. It reads at most 25 of the newest source-linked Build 387 Tool/Supply receipt records, compares the recorded count/cost/units with current Inventory values and identifies movement source presence. It shows tax rate, whether included, estimated HST, net and gross per purchase/stock unit, and correction notes. **No supplier invoices are attached or validated automatically.** The read-only review cannot post inventory movements, expenses, reconciliations, adjustments, tax credits or provider actions.

## Verification and promotion
On Development: Build 388 regression suite, Current Application Quality, System Gate (including canonical D1 and data authority), I.T. Runtime, Repository Hygiene. Promote the **identical tested tree** to main only if every applicable check succeeds. Require Cloudflare Pages Production Deploy plus Live Resource Integrity Proof before Production GREEN. Do not conflate code-level green with authenticated manual browser confirmation.

**Next queued Build 389 — Product Save End-to-End Acceptance & Purchase Invoice Evidence Review Decisions.**

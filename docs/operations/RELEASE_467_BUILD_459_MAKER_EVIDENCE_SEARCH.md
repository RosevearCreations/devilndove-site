# Devil n Dove Build 459 — Source-Linked Maker Search & Evidence Finder

**Admin entry:** `/admin/maker-evidence-search/` (reachable from `/admin/maker-workbench/`). Search provides links to the **existing owning modules**, not an independent Maker index, public search feed or new data authority.

## Owner workflow

1. Sign in with a verified Admin session. Choose **Creative Projects** and search a real part of the name/key, or browse the current bounded page. Archived or private-labelled projects are shown as historic/private source records only within authorized Admin; nothing is published.
2. On a project result select **Search linked evidence**. The selected exact Creative Project ID is inserted into the scope field and the finder opens the **design revisions** category. Switch the category to recipe history, tools or finished serials as needed.
3. Confirm each result's source ID, original project ID and recorded source state. Open the original module. Design revisions and Projects support exact project deep links; Workshop Knowledge, Shared Tools and Finished Pieces require the operator to locate the **shown exact source ID** inside their original module. Do not assume a module selected an ID if it does not support that deep link.
4. Move through **Next page** / **Previous page** explicitly. Each GET reads just one requested source kind with a stable descending keyset cursor, **up to 20 results by default or at most 25**, without a global count, session storage, background refresh or FTS duplication. A changed search filter starts a new page chain.
5. When the internet is unavailable or the original source table has an issue, search fails closed. Restore connectivity and retry; source identities and evidence records are not edited.

## Canonical source mapping

| Finder kind | Existing source authority | What we show | Original workspace |
|---|---|---|---|
| Creative Projects | `creative_work_projects` | project ID/title/key/status | Creative Process |
| Design revisions | `maker_design_file_revisions` | revision ID, project ID, human design title/key, revision number, machine-readiness label | Design & Revisions |
| Recipe versions | `workshop_knowledge_recipe_versions` joined to `workshop_knowledge_entries` | version ID, source project, entry title/key, version number, recipe state | Workshop Knowledge |
| Project-linked tools | `creative_project_operation_resources` and `creative_project_operations` joined to `site_item_inventory` | tool inventory ID/title/active-or-blocked hint | Shared Tools |
| Serialized pieces | `maker_finished_pieces` joined to `maker_quality_attempts` | piece ID, original project, serial/variant and linked Product/QA IDs | Finished Pieces |

All five types use **one allowlisted parameterized SELECT** per search. Tools **require** an exact project scope; they are included only when an existing Creative Operation resource for that project references that inventory tool. Recipe and piece statuses are historical source evidence, not legal product/sale eligibility.

## Security, privacy and usage budget

- `GET /api/admin/maker-evidence-search` checks an active **Admin** session first. No public endpoint, role bypass, service token exposure or client-side database query exists; `Cache-Control: private, no-store` applies.
- Search values are parameterized. Literal `%`, `_` and backslash are escaped. Limits and keyset cursors are validated; there is no unbounded `SELECT *`, `COUNT(*)`, `PRAGMA`, request-time DDL or R2 listing.
- Only safe project-linked metadata is projected. **No** original filename, R2 object key, signed/private URL, image bytes, workshop notes, customer names/emails/contacts, payment data, original recipe settings or confidential maker attachment is returned. The operator must enter each owning module to access privileged source detail under that module's own controls.
- A private workshop session, rejected quality attempt, recipe marked approved/superseded, or registered finished piece **does not mean** approved for sale, public image consent, regulatory toy/candle safety, fulfillment readiness or marketplace permission. Real owner/provider/customer acceptance remains HOLD until separately verified.
- No new D1 migration, schema table, external search provider, paid service or automatic third-party write is required.

## Verification

```text
node --check functions/api/admin/_lib/makerEvidenceSearch459.mjs
node --check functions/api/admin/maker-evidence-search.js
node --check public/js/admin-maker-evidence-search-459.js
node --test scripts/release467_build459_maker_evidence_search.test.mjs
node --test scripts/release467_build457_maker_workbench.test.mjs
python scripts/current_application_quality_gate.py
```

The seven Build 459 tests use **disposable synthetic SQLite rows** for authenticated/denied Admin sessions, keyset paging, cross-project isolation, private column exclusion and reference correctness. They are not a claim that any real design, recipe, physical product, actual maker trial or media is approved. A live authenticated owner walkthrough remains separate manual acceptance. Technical Production GREEN requires `dev` System Gate/Preview, protected clean-tree `main` PR, Cloudflare Production smoke and independent live-resource integrity proof for the exact commit.

**Following planned Build 460:** Real Maker Media & Accessibility Acceptance, with genuine owner-supplied photos and permission review.

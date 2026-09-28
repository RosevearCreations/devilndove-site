# Release 467 Build 287 — Real Existing Resource-Link Evidence Capture

## Purpose

Build 287 closes the real Creative Process → Inventory identity-evidence gap identified by Build 285 and enabled by Build 286. It uses existing Development business records only. No temporary material, project or Inventory fixture satisfies this build.

## Exact real Development evidence

The bounded Development evidence run is GitHub Actions run `36429890733` at exact SHA `561afcb00ad1c7e2c22bb209e5160bbe94709924`. Its retained artifact is `10973008389`, named `release467-build287-real-existing-resource-link-evidence-561afcb00ad1c7e2c22bb209e5160bbe94709924`.

The accepted real mapping is:

- Creative Process project: **Under the Sea** (`creative_work_project_id=7`)
- Existing material event: `creative_work_event_id=2`
- Material: **velona 5 LB - Goats MILK Soap Base SLS/SLES free | Melt and Pour | Natural Bars For The Best Result for Soap-making**
- Material quantity: **2.5 pounds**
- Review state: **approved**
- Existing Supply Inventory: `site_item_inventory_id=2801`
- Inventory item name: exact normalized match to the material name
- Inventory source type: **supply**
- Resource role: **material**
- Created identity link: `creative_process_resource_link_id=1`

The pre-link Inventory on-hand quantity was **1 package** and the post-link quantity remained **1 package**. The material was not marked consumed. No Inventory movement and no Finance posting occurred.

The exact link evidence used **170 D1 rows_read** against a hard ceiling of **20,000**. The mutation created exactly one `creative_process_resource_links` record. The build did not create a project, material event, Product-owned Inventory record or temporary fixture.

## Owner authorization and execution boundary

`release467-build287-real-existing-link-authorization.json` records the explicit Development-only authorization. The allowed mutation is limited to `creative_process_resource_links`. It is idempotent and requires the existing approved material event and existing active Supply Inventory record to remain an exact normalized-name match.

The one-shot D1 workflow is retired from automatic remote-D1 execution after evidence capture. Build 287's normal source proof contains no automatic D1 query.

## D1 read-budget correction retained

The Build 287 candidate also preserves the emergency D1 fan-out correction and Inventory Operations fixes:

- historical Release 467 workflows are manual-only;
- remote historical D1 proofs do not fan out on ordinary `dev` pushes;
- System Gate and I.T. Admin D1 classification compare the current `dev` push rather than the long-diverged `main...dev` range;
- Inventory Operations does not load movement history automatically;
- the normal Inventory table skips product-link aggregation;
- inventory pages are 40 rows, cached reads are preferred, and the main Inventory read has zero automatic retries.

## Inventory Operations owner-reported repair

The desktop Inventory Operations workspace again defaults to a real editable table rather than forcing card mode. We can edit:

- on-hand quantity;
- stock unit;
- usage unit;
- usage units per stock unit;
- unit cost;
- reorder level;
- category/supplier/status.

The table calculates **cost per usage unit = unit cost ÷ usage units per stock unit**. Mobile can still use card mode. Feature/admin endpoint failures no longer clear the browser's cached login identity; only the canonical `/api/auth/me` session verifier can do that.

## Build 286 predecessor closure

Build 286 is ingested as fully Production GREEN:

- Development SHA `fe4dff65c47a00fc3c61a6ae48faa26828951898`
- Development/Production tree `a5d51c32f7a1e3696cdbfbfe16e204ecb3f419ec`
- System Gate `36374225700`
- Current Application Quality `36374225637`
- I.T. Admin Runtime `36374225648`
- Repository Branch Hygiene `36374225692`
- Build 286 dedicated proof `36374225610`
- Production main `11a4924ce8f5a83bc6b688489404140e89456662`
- Production Pages `36374409720`
- Production Live Resource Integrity `36374501241`
- Product Browser `36374501210`
- Product Route `36374501223`
- Production Build 286 proof `36374409434`

## Safety

Build 287 does not authorize automatic Inventory movement, Inventory quantity rewriting, Finance posting, Product mutation, R2 mutation, provider execution/publication, payment/refund, Production business-data mutation or automatic Production promotion.

## Next

Build 288 — **Real Planned-vs-Actual Inventory Acceptance**. It must use this real existing project/material/Inventory linkage, perform the review → explicit Inventory post → compensating reversal lifecycle, return Inventory to baseline, and keep Finance unchanged.

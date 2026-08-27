# Sanity Health Check — Development Build 440

Updated: 2026-08-27

Current local/source sanity status: **PASS after closure repairs**. Authenticated
live Development acceptance is still open, so this is not Build 440 closure or
live-deployment evidence.

## Current repeatable authority

Run:

```bash
python scripts/build440_current_sanity_check.py
```

The runner is source-only. It contacts no Cloudflare, D1, R2, payment, email or
other provider and has no Production mutation capability.

## Results

- Canonical Development release alignment: **PASS**.
- Release-contract/read-only CI integrity: **PASS**.
- Product/Inventory/Tools cross-mutation and responsive authority: **PASS
  (35/35)**.
- Full Build 440 Product/Inventory/Tools source gate: **PASS**.
- Predeploy static scan: **PASS (114 pages, 0 issues)**.
- Local asset reference audit: **PASS (151 references, 0 missing)**.
- Build 439 CAIP source gate: **PASS** after its historical UI-cache assertions
  were changed to derive the current canonical release.
- Fresh-install aggregate schema: **PASS for Build 440 lot provenance,
  receiving/reversal and Tool lifecycle authority**.
- Git whitespace safety: must remain **PASS** on the final commit.

## Repairs made during this sanity pass

1. Synchronized the focused Build 440 Product/Inventory lot-provenance authority
   into `database_full_schema.sql`.
2. Synchronized the focused Build 440 Inventory receiving/source/reversal
   authority into `database_full_schema.sql`.
3. Replaced an obsolete Today Tasks token check with its current
   Operations-owned read-service/failure contract.
4. Added a current Build 440 sanity runner instead of treating the historical
   Build 246 deployment-preflight artifact as current evidence.
5. Made the retained Build 439 UI regression derive the current cache/release
   major instead of requiring obsolete `?v=439` asset URLs.

## Historical artifact warning

`data/site/deployment-preflight.json` and
`scripts/deployment_preflight_static_check.py` are Build 246-era evidence and
must not approve or block Build 440 by themselves. They remain historical until
a future bounded release-operations replacement is implemented in the I.T. &
Platform module.

## Evidence still required

- authenticated live Admin acceptance on the exact resulting
  `devilndove-site-dev` Production deployment;
- Product desktop/mobile read/save and restoration proof;
- Inventory/kit stock-owner and failure proof;
- Tool lifecycle/history/publication proof;
- phone/tablet/laptop/wide visual proof;
- Build 439 private media/timecode/storage live evidence;
- remote Development D1 migration-ledger and current-authority verification;
- exact-head Build 440 GitHub gate and Dev-project Production deployment after
  these closure repairs.

Separate live `main` / `devilndove-site` Production remains untouched and
promotion remains closed.

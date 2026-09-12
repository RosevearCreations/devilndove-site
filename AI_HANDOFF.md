# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 123 — Admin Home Dashboard Refresh** is the current Development closure candidate.

Build 123 starts from the externally verified Build 122 closure. Build 122 did **not** self-record its later proof; Build 123 ingests it under the restart protocol.

- Exact Build 122 SHA: `8ff2df0616a4a9f23c4e1a92bcf5e501a306e0da`
- Exact tree: `e87670bb397cee58ed839813ea33851d799b5823`
- System Gate: `34710867035`
- Current Application Quality Proof: `34710867094`
- I.T. Admin Runtime Proof: `34710867066`
- Repository Branch Hygiene: `34710867072`
- Production Pages Deploy: `34710956842`
- Production Live Resource Integrity: `34710999276`

## Build 123 scope

Build 123 refreshes `/admin/` into a read-only operator dashboard. It summarizes the existing Today Tasks read contract, I.T. control tower and `data/admin-navigation-modules.json`; each read fails independently so a temporary subsystem problem does not erase unrelated dashboard sections. The full Today Tasks workspace remains authoritative for Done, Ignore and Snooze actions.

No recent-history/preference storage, polling, POST/write request, Accounting posting, period close, Inventory/Creative/price mutation, provider execution/publication, schema/D1/R2/binding mutation or Production business-data change is authorized. Canonical D1 migrations remain exactly `0001`–`0004`.

## External lanes

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access service-token acceptance remain `HOLD_EXTERNAL`. CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CAD commerce remains authoritative; U.S. sales/shipping remain disabled and local pickup remains supported.

## Restart rule

Build 123 must not self-record its later external exact-head proof. After Build 123 is externally proven and promoted, **Build 124 must ingest that later closure**.

# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 122 — Admin Workspace Navigation & Command Palette** is the current Development closure candidate.

Build 122 starts from the externally verified Build 121 closure. Build 121 did **not** self-record its later proof; Build 122 ingests it under the restart protocol.

- Exact Build 121 SHA: `31492144ecbd2f8c353426531ea301c70aedf8f3`
- Exact tree: `078d5ba5c71ee160861e0a31bcca640bb89a3cdc`
- System Gate: `34709444214`
- Current Application Quality Proof: `34709444221`
- I.T. Admin Runtime Proof: `34709444258`
- Repository Branch Hygiene: `34709444255`
- Production Pages Deploy: `34709526481`
- Production Live Resource Integrity: `34709571023`

## Build 122 scope

Build 122 adds a common Admin / Storefront / Creator / Finance / I.T. workspace strip and a keyboard-accessible command palette over the existing `data/admin-navigation-modules.json` navigation authority. `Ctrl/Cmd+K` opens the launcher; Arrow keys select; Enter opens; Escape closes. Existing admin URLs and module ownership remain unchanged.

The launcher is client-only. It reads the existing manifest with GET, provides four workspace fallbacks if that read is unavailable, and stores no recent history, preference, search, or navigation state.

No Accounting posting, period close, Inventory/Creative/price mutation, provider execution/publication, schema/D1/R2/binding mutation or Production business-data change is authorized. Canonical D1 migrations remain exactly `0001`–`0004`.

## External lanes

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access service-token acceptance remain `HOLD_EXTERNAL`. CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CAD commerce remains authoritative; U.S. sales/shipping remain disabled and local pickup remains supported.

## Restart rule

Build 122 must not self-record its later external exact-head proof. After Build 122 is externally proven and promoted, **Build 123 must ingest that later closure**.

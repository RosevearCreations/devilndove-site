# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 128 — Admin Navigation Help & Keyboard Shortcut Reference** is the current Development closure candidate.

Build 128 starts by ingesting the externally verified Build 127 closure. Build 127 remains correctly non-self-recording; its six later proof IDs are recorded by Build 128 startup ingestion.

- SHA `dead9393e6d8db5fbcbe776c3885da80cbe42163`
- tree `efff42114b680218c756031fb2f92bc12e541b1c`
- System Gate `34725275176`
- Current Application Quality `34725275139`
- I.T. Admin Runtime `34725275114`
- Repository Branch Hygiene `34725275193`
- Production Pages Deploy `34725363163`
- Production Live Resource Integrity `34725405258`

## Build 128 scope

Build 128 adds an accessible Admin navigation-help dialog over the existing navigation layers. It documents the existing `Ctrl/Cmd+K` command palette, `Alt+Shift+F` favorite toggle, workspace memory/resume behavior, favorites quick launch, breadcrumbs and workspace-return behavior. `Alt+Shift+H` opens the help dialog, and an Admin workspace-nav button provides a pointer-friendly entry point.

The feature is Admin-only and client-only. It stores no state, creates no server preference authority, and performs no network write. It does not replace `data/admin-navigation-modules.json` or create another navigation authority.

Build 128 does not create or modify D1 schema, D1 business rows, R2 objects, bindings, Accounting records, Inventory/Creative/Product data, prices, payment/provider state, or Production business data. Canonical D1 migrations remain exactly `0001`–`0004`.

## External lanes

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access service-token acceptance remain `HOLD_EXTERNAL`. CAIP private-media remains `EVIDENCE_DEPENDENT`.

## Restart rule

Build 128 must not self-record its later external exact-head proof. After Build 128 is externally proven and promoted, **Build 129 must ingest that later closure**.

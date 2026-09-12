# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 126 — Admin Favorites & Quick Launch** is the current Development closure candidate.

Build 126 starts by ingesting the externally verified Build 125 closure. Build 125 remains correctly non-self-recording; its six later proof IDs are recorded by Build 126 startup ingestion.

- SHA `eca94d1ac4732c561794f914f89a2838af243617`
- tree `c7b4caf380183cd0b71b79d2f0ba73ccefce0d26`
- System Gate `34721943588`
- Current Application Quality `34721943584`
- I.T. Admin Runtime `34721943615`
- Repository Branch Hygiene `34721943593`
- Production Pages Deploy `34722069482`
- Production Live Resource Integrity `34722116635`

## Build 126 scope

Build 126 adds admin-only browser favorites over the existing Build 122 workspace navigation and Build 125 workspace memory. Favorites are scoped by signed-in Admin user ID and stay in browser `localStorage`.

The feature can favorite any non-home Admin route, stores at most eight favorites, provides a **Favorites** quick-launch dialog, shows up to three favorite shortcuts from Admin home, supports individual removal and **Clear favorites**, and provides `Alt+Shift+F` as an optional current-page toggle.

This is convenience state only. It does not create or modify D1 schema, D1 business rows, R2 objects, bindings, Accounting records, Inventory/Creative/Product data, prices, payment/provider state, or Production business data. `sessionStorage` is not used and no network write is introduced. Canonical D1 migrations remain exactly `0001`–`0004`.

## External lanes

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access service-token acceptance remain `HOLD_EXTERNAL`. CAIP private-media remains `EVIDENCE_DEPENDENT`.

## Restart rule

Build 126 must not self-record its later external exact-head proof. After Build 126 is externally proven and promoted, **Build 127 must ingest that later closure**.

# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 125 — User Preferences & Workspace Memory** is the current Development closure candidate.

Build 125 starts by ingesting the externally verified Build 124 closure. Build 124 remains correctly non-self-recording; its six later proof IDs are recorded by Build 125 startup ingestion.

- SHA `fbcc55051b899719d2fb2cdf90343852cf5abe70`
- tree `7476f4843f8209c230189a03449d7c172da5de8a`
- System Gate `34720625518`
- Current Application Quality `34720625496`
- I.T. Admin Runtime `34720625502`
- Repository Branch Hygiene `34720625515`
- Production Pages Deploy `34720717741`
- Production Live Resource Integrity `34720757007`

## Build 125 scope

Build 125 adds a small admin-only browser preference layer over the existing Build 122 workspace navigation. Preferences are scoped by signed-in admin user ID and stay in browser `localStorage`.

The feature remembers the last non-home Admin workspace, can show recent Admin tools, allows a 3/5/8 recent limit, exposes a **Workspace memory** control, and provides **Clear workspace memory**. The Admin home can present a **Resume** link back to the last remembered workspace.

This is convenience state only. It does not create or modify D1 schema, D1 business rows, R2 objects, bindings, Accounting records, Inventory/Creative/product data, prices, payment/provider state, or Production business data. `sessionStorage` is not used. Canonical D1 migrations remain exactly `0001`–`0004`.

## External lanes

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access service-token acceptance remain `HOLD_EXTERNAL`. CAIP private-media remains `EVIDENCE_DEPENDENT`.

## Restart rule

Build 125 must not self-record its later external exact-head proof. After Build 125 is externally proven and promoted, **Build 126 must ingest that later closure**.

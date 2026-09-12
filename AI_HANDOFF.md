# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 127 — Admin Context Breadcrumbs & Workspace Return** is the current Development closure candidate.

Build 127 starts by ingesting the externally verified Build 126 closure. Build 126 remains correctly non-self-recording; its six later proof IDs are recorded by Build 127 startup ingestion.

- SHA `af4dec5acdaf2b01a35d52731863786bee197315`
- tree `b8e410f0c517d3b0d59d48cf4dd7f2acfe6e21a3`
- System Gate `34724580675`
- Current Application Quality `34724580676`
- I.T. Admin Runtime `34724580648`
- Repository Branch Hygiene `34724580646`
- Production Pages Deploy `34724657853`
- Production Live Resource Integrity `34724703548`

## Build 127 scope

Build 127 adds a read-only Admin context breadcrumb over the existing Build 122 manifest-backed workspace navigation. The breadcrumb identifies **Admin → workspace → section → current tool** when the current route exists in `data/admin-navigation-modules.json` and exposes a direct **Back to workspace** link for nested tools.

The feature is Admin-only and client-only. It does not use `localStorage` or `sessionStorage`, does not create a server preference authority, and performs no network write. A read-only manifest fetch may be used; if the manifest is unavailable the current page still receives a safe Admin/context fallback.

Build 127 does not create or modify D1 schema, D1 business rows, R2 objects, bindings, Accounting records, Inventory/Creative/Product data, prices, payment/provider state, or Production business data. Canonical D1 migrations remain exactly `0001`–`0004`.

## External lanes

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access service-token acceptance remain `HOLD_EXTERNAL`. CAIP private-media remains `EVIDENCE_DEPENDENT`.

## Restart rule

Build 127 must not self-record its later external exact-head proof. After Build 127 is externally proven and promoted, **Build 128 must ingest that later closure**.

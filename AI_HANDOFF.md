# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 124 — Canada-First Market Controls & U.S. Shipping Pause** is the current Development closure candidate.

Build 124 starts from the externally verified Build 123 closure. Build 123 did **not** self-record its later proof; Build 124 ingests it under the restart protocol.

- Exact Build 123 SHA: `d0485a9892331e8da2cec42ed54850893b4a7ab1`
- Exact tree: `e5c15b8c2d1c1a9f091a688b9f525e8b7ce73e20`
- System Gate: `34719387920`
- Current Application Quality Proof: `34719387904`
- I.T. Admin Runtime Proof: `34719387901`
- Repository Branch Hygiene: `34719387931`
- Production Pages Deploy: `34719482161`
- Production Live Resource Integrity: `34719519418`

## Build 124 scope

Build 124 keeps the existing Canada-only CAD checkout authority and adds an explicit market-control layer. U.S. storefront sales and physical shipping are blocked with reason `TEMPORARY_TARIFF_RESTRICTION`; other non-Canadian markets remain unsupported until a reviewed build explicitly enables them. Local pickup remains supported.

The front page presents a **Canada First — U.S. shipping temporarily paused** banner explaining that current 50% tariffs cannot viably be absorbed or passed to customers, that Devil n Dove is focusing on Canada first while reviewing other markets, and that we hope to resume shipping to our great American customers soon.

The shared commerce policy core remains the browser/server authority, so the U.S. restriction is enforced before payment-provider execution and is not merely a visual banner.

No schema migration, request-time DDL, D1 business-data mutation, R2/binding mutation, Accounting posting, period close, Inventory/Creative/price mutation, provider execution/publication or Production business-data overwrite is authorized. Canonical D1 migrations remain exactly `0001`–`0004`.

## External lanes

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access service-token acceptance remain `HOLD_EXTERNAL`. CAIP private-media remains `EVIDENCE_DEPENDENT`.

## Restart rule

Build 124 must not self-record its later external exact-head proof. After Build 124 is externally proven and promoted, **Build 125 must ingest that later closure**.

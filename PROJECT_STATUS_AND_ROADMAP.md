# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 124 — Canada-First Market Controls & U.S. Shipping Pause** is the active closure candidate.

Build 123 is the last fully verified Development + Production checkpoint:

- SHA `d0485a9892331e8da2cec42ed54850893b4a7ab1`
- tree `e5c15b8c2d1c1a9f091a688b9f525e8b7ce73e20`
- System Gate `34719387920`
- Current Application Quality `34719387904`
- I.T. Admin Runtime `34719387901`
- Repository Branch Hygiene `34719387931`
- Production Pages Deploy `34719482161`
- Production Live Resource Integrity `34719519418`

The Build 123 closure is recorded by Build 124 ingestion, not a Build 123 self-claim.

## Build 124 — Canada-First Market Controls & U.S. Shipping Pause

Goal: keep Canada as the safe current storefront market, make the temporary U.S. restriction explicit and customer-friendly, and create a deliberate control point for future market expansion.

Candidate scope:
1. Preserve Canada-only billing and physical shipping, CAD currency and local pickup.
2. Explicitly block U.S. sales and U.S. shipping with `TEMPORARY_TARIFF_RESTRICTION`.
3. Normalize `US`, `USA`, `U.S.` and `United States` to the same blocked country code.
4. Keep all other non-Canadian countries unsupported until reviewed and explicitly enabled.
5. Present the front-page **Canada First — U.S. shipping temporarily paused** banner.
6. Explain that current 50% tariffs cannot viably be absorbed or passed to customers, while expressing the intent to resume serving American customers when conditions allow.
7. Keep the shared browser/server commerce-policy core authoritative before provider execution.
8. Add no provider execution, schema migration, D1 business-data mutation, R2/binding mutation or Production business-data overwrite.
9. Canonical D1 migrations remain exactly `0001`–`0004`.

## Next direction

After Build 124 closes, continue the bounded quality-of-life sequence, with future-country enablement handled as an explicit reviewed commerce-policy build rather than an automatic worldwide expansion.

## Release mechanics

Every new build ingests the previous build's later external closure, proves the exact `dev` head through System/Quality/I.T./Hygiene plus Preview/D1/bindings, then non-force promotes the identical SHA/tree to `main` and requires Production Pages + Live Resource proofs. The candidate never self-records its own later proof.

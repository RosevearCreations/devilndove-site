# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 129 — Admin Related Tools & Context Shortcuts** is the active closure candidate.

Build 128 is the last fully verified Development + Production checkpoint:

- SHA `84523fe94b9007c82cae6d3f8b42b9a31a0e9f63`
- tree `08210d5fa81558ad0b773cf2c319f74f57d88af3`
- System Gate `34726947819`
- Current Application Quality `34726947864`
- I.T. Admin Runtime `34726947811`
- Repository Branch Hygiene `34726947787`
- Production Pages Deploy `34727026918`
- Production Live Resource Integrity `34727072165`

The Build 128 closure is recorded by Build 129 startup ingestion, not a Build 128 self-claim.

## Build 129 — Admin Related Tools & Context Shortcuts

Goal: make nearby tools easier to reach without adding another navigation authority, history store, or business-data write.

Candidate scope:
1. Preserve the existing `data/admin-navigation-modules.json` as the only navigation manifest.
2. Resolve the current Admin route against that manifest.
3. Offer related tools only from the current manifest section.
4. Exclude the current route.
5. Cap related shortcuts at four.
6. Insert the panel below current breadcrumbs/workspace navigation when that context exists.
7. Fail closed when manifest/context/anchor resolution is unavailable.
8. Add no localStorage/sessionStorage or server persistence.
9. Add no network write or automatic business action.
10. Add no D1/R2/binding mutation, provider execution or Production business-data overwrite; canonical D1 migrations remain exactly `0001`–`0004`.

## Next direction

After Build 129 closes, continue the bounded Admin quality-of-life sequence. Build 130 must first ingest Build 129's later external closure before beginning its own changes.

## Release mechanics

Every new build ingests the previous build's later external closure, proves the exact `dev` head through System/Quality/I.T./Hygiene plus Preview/D1/bindings, then non-force promotes the identical SHA/tree to `main` and requires Production Pages + Live Resource proofs. The candidate never self-records its own later proof.

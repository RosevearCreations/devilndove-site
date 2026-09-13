# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 131 — Admin Section Switcher & Module Map** is the active closure candidate.

Build 130 is the last fully verified Development + Production checkpoint:

- SHA `047427e8233793494e099c257aac56b8bd8bf6fb`
- tree `afdce4033115489a7abf78088b7ab82dc1bb4a70`
- System Gate `34729838054`
- Current Application Quality `34729838051`
- I.T. Admin Runtime `34729838028`
- Repository Branch Hygiene `34729838029`
- Production Pages Deploy `34729939106`
- Production Live Resource Integrity `34729976417`

The Build 130 closure is recorded by Build 131 startup ingestion, not a Build 130 self-claim.

## Build 131 — Admin Section Switcher & Module Map

Goal: make movement between sections of the current Admin module predictable without adding another navigation authority or saved-state system.

Candidate scope:
1. Preserve `data/admin-navigation-modules.json` as the only navigation manifest.
2. Resolve the current Admin route against the manifest.
3. Display the current module, current section and `Section X of Y` context.
4. Mark the current section as current rather than linking it.
5. Offer one bounded jump target for each other section in the current module, using that section's first available tool.
6. Never cross into another module from the section map.
7. Insert below the existing position/related-tool/breadcrumb/workspace context when available.
8. Fail closed when manifest/context/anchor resolution is unavailable.
9. Add no localStorage/sessionStorage or server persistence.
10. Add no network write, D1/R2/binding mutation, provider execution or Production business-data overwrite; canonical D1 migrations remain exactly `0001`–`0004`.

## Next direction

After Build 131 closes, continue the bounded Admin quality-of-life sequence. Build 132 must first ingest Build 131's later external closure before beginning its own changes.

## Release mechanics

Every new build ingests the previous build's later external closure, proves the exact `dev` head through System/Quality/I.T./Hygiene plus Preview/D1/bindings, then non-force promotes the identical SHA/tree to `main` and requires Production Pages + Live Resource proofs. The candidate never self-records its own later proof.

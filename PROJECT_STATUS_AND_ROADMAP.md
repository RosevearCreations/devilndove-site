# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 125 — User Preferences & Workspace Memory** is the active closure candidate.

Build 124 is the last fully verified Development + Production checkpoint:

- SHA `fbcc55051b899719d2fb2cdf90343852cf5abe70`
- tree `7476f4843f8209c230189a03449d7c172da5de8a`
- System Gate `34720625518`
- Current Application Quality `34720625496`
- I.T. Admin Runtime `34720625502`
- Repository Branch Hygiene `34720625515`
- Production Pages Deploy `34720717741`
- Production Live Resource Integrity `34720757007`

The Build 124 closure is recorded by Build 125 startup ingestion, not a Build 124 self-claim.

## Build 125 — User Preferences & Workspace Memory

Goal: make Admin navigation remember useful operator context without creating another server-side settings or business-data authority.

Candidate scope:
1. Scope browser preferences to the signed-in Admin user ID.
2. Remember the last non-home Admin workspace.
3. Offer a **Resume** link from Admin home.
4. Maintain an optional recent-tools list.
5. Let the operator choose 3, 5 or 8 visible recent tools.
6. Provide a clear, reversible **Clear workspace memory** control.
7. Fail soft when browser storage is unavailable.
8. Keep Build 122 command-palette navigation intact.
9. Add no server persistence, D1/R2/binding mutation, provider execution or Production business-data overwrite.
10. Canonical D1 migrations remain exactly `0001`–`0004`.

## Next direction

After Build 125 closes, continue the bounded admin quality-of-life sequence. Build 126 must first ingest Build 125's later external closure before beginning its own changes.

## Release mechanics

Every new build ingests the previous build's later external closure, proves the exact `dev` head through System/Quality/I.T./Hygiene plus Preview/D1/bindings, then non-force promotes the identical SHA/tree to `main` and requires Production Pages + Live Resource proofs. The candidate never self-records its own later proof.

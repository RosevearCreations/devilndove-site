# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 126 — Admin Favorites & Quick Launch** is the active closure candidate.

Build 125 is the last fully verified Development + Production checkpoint:

- SHA `eca94d1ac4732c561794f914f89a2838af243617`
- tree `c7b4caf380183cd0b71b79d2f0ba73ccefce0d26`
- System Gate `34721943588`
- Current Application Quality `34721943584`
- I.T. Admin Runtime `34721943615`
- Repository Branch Hygiene `34721943593`
- Production Pages Deploy `34722069482`
- Production Live Resource Integrity `34722116635`

The Build 125 closure is recorded by Build 126 startup ingestion, not a Build 125 self-claim.

## Build 126 — Admin Favorites & Quick Launch

Goal: make frequent Admin destinations faster to reach without creating a server-side settings authority.

Candidate scope:
1. Scope favorites to the signed-in Admin user ID.
2. Favorite/unfavorite the current non-home Admin route.
3. Keep at most eight favorites.
4. Add a Favorites quick-launch dialog.
5. Show up to three favorite shortcuts on Admin home.
6. Allow individual removal and full clear.
7. Add optional `Alt+Shift+F` current-page toggle.
8. Fail soft when browser storage is unavailable.
9. Preserve Build 122 command-palette and Build 125 workspace-memory behavior.
10. Add no server persistence, D1/R2/binding mutation, provider execution or Production business-data overwrite.
11. Canonical D1 migrations remain exactly `0001`–`0004`.

## Next direction

After Build 126 closes, continue the bounded Admin quality-of-life sequence. Build 127 must first ingest Build 126's later external closure before beginning its own changes.

## Release mechanics

Every new build ingests the previous build's later external closure, proves the exact `dev` head through System/Quality/I.T./Hygiene plus Preview/D1/bindings, then non-force promotes the identical SHA/tree to `main` and requires Production Pages + Live Resource proofs. The candidate never self-records its own later proof.

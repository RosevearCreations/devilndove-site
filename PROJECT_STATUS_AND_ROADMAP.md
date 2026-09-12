# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 128 — Admin Navigation Help & Keyboard Shortcut Reference** is the active closure candidate.

Build 127 is the last fully verified Development + Production checkpoint:

- SHA `dead9393e6d8db5fbcbe776c3885da80cbe42163`
- tree `efff42114b680218c756031fb2f92bc12e541b1c`
- System Gate `34725275176`
- Current Application Quality `34725275139`
- I.T. Admin Runtime `34725275114`
- Repository Branch Hygiene `34725275193`
- Production Pages Deploy `34725363163`
- Production Live Resource Integrity `34725405258`

The Build 127 closure is recorded by Build 128 startup ingestion, not a Build 127 self-claim.

## Build 128 — Admin Navigation Help & Keyboard Shortcut Reference

Goal: make the growing Admin navigation system discoverable without adding another state store, navigation manifest or business authority.

Candidate scope:
1. Preserve Build 122 command palette and workspace navigation as the route authority.
2. Preserve Build 125 workspace memory/resume behavior.
3. Preserve Build 126 favorites and `Alt+Shift+F` current-page toggle.
4. Preserve Build 127 breadcrumbs and workspace-return context.
5. Add one accessible Admin navigation-help dialog summarizing those controls.
6. Add a visible Help button to the shared Admin workspace navigation.
7. Add `Alt+Shift+H` as the keyboard shortcut for the help dialog.
8. Close with Escape and restore focus to the opener.
9. Add no saved state, server persistence or network write.
10. Add no D1/R2/binding mutation, provider execution or Production business-data overwrite; canonical D1 migrations remain exactly `0001`–`0004`.

## Next direction

After Build 128 closes, continue the bounded Admin quality-of-life sequence. Build 129 must first ingest Build 128's later external closure before beginning its own changes.

## Release mechanics

Every new build ingests the previous build's later external closure, proves the exact `dev` head through System/Quality/I.T./Hygiene plus Preview/D1/bindings, then non-force promotes the identical SHA/tree to `main` and requires Production Pages + Live Resource proofs. The candidate never self-records its own later proof.

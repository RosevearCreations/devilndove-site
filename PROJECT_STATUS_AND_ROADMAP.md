# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 122 — Admin Workspace Navigation & Command Palette** is the active closure candidate.

Build 121 is the last fully verified Development + Production checkpoint:

- SHA `31492144ecbd2f8c353426531ea301c70aedf8f3`
- tree `078d5ba5c71ee160861e0a31bcca640bb89a3cdc`
- System Gate `34709444214`
- Current Application Quality `34709444221`
- I.T. Admin Runtime `34709444258`
- Repository Branch Hygiene `34709444255`
- Production Pages Deploy `34709526481`
- Production Live Resource Integrity `34709571023`

The Build 121 closure is recorded by Build 122 ingestion, not a Build 121 self-claim.

## Build 122 — Admin Workspace Navigation & Command Palette

Goal: reduce admin navigation friction without creating a second menu authority or saved navigation state.

Candidate scope:
1. Reuse `data/admin-navigation-modules.json` as the single current operational menu authority.
2. Add an Admin / Storefront / Creator / Finance / I.T. workspace strip with current-workspace highlighting.
3. Add a visible Jump control and `Ctrl/Cmd+K` command palette.
4. Search current workspace, section and tool labels from the manifest.
5. Support Arrow Up/Down, Enter and Escape with accessible dialog/listbox semantics.
6. Load from the shared Admin auth/UI bootstrap so legacy admin pages receive the same launcher.
7. Fall back to the four workspace homes if the manifest is temporarily unavailable.
8. Store no navigation history or preference and perform no POST/write action.
9. Canonical D1 migrations remain exactly `0001`–`0004`.

## Next autonomous QoL sequence

After Build 122 closes: Build 123 Admin Home Dashboard Refresh; Build 124 Consistent Loading/Empty/Error/Retry States; Build 125 User Preferences & Workspace Memory; Build 126 Universal Admin Search; Build 127 Table/List Quality-of-Life Standard; Build 128 Product & Inventory Quick View Drawer.

## Release mechanics

Every new build ingests the previous build's later external closure, proves the exact `dev` head through System/Quality/I.T./Hygiene plus Preview/D1/bindings, then non-force promotes the identical SHA/tree to `main` and requires Production Pages + Live Resource proofs. The candidate never self-records its own later proof.

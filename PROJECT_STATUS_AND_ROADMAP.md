# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 127 — Admin Context Breadcrumbs & Workspace Return** is the active closure candidate.

Build 126 is the last fully verified Development + Production checkpoint:

- SHA `af4dec5acdaf2b01a35d52731863786bee197315`
- tree `b8e410f0c517d3b0d59d48cf4dd7f2acfe6e21a3`
- System Gate `34724580675`
- Current Application Quality `34724580676`
- I.T. Admin Runtime `34724580648`
- Repository Branch Hygiene `34724580646`
- Production Pages Deploy `34724657853`
- Production Live Resource Integrity `34724703548`

The Build 126 closure is recorded by Build 127 startup ingestion, not a Build 126 self-claim.

## Build 127 — Admin Context Breadcrumbs & Workspace Return

Goal: keep the operator oriented inside the growing Admin application without adding saved state or another navigation authority.

Candidate scope:
1. Reuse `data/admin-navigation-modules.json` as the only workspace/tool context authority.
2. Render one accessible Admin context breadcrumb on Admin routes.
3. Resolve Admin home, workspace, section and current tool when the manifest contains the route.
4. Provide a direct **Back to workspace** link for nested Admin tools.
5. Mark the current tool with `aria-current="page"`.
6. Preserve Build 122 command palette, Build 125 workspace memory and Build 126 favorites.
7. Fail soft with a basic Admin/current-page context when the manifest cannot be read.
8. Add no local/session storage, server persistence or network write.
9. Add no D1/R2/binding mutation, provider execution or Production business-data overwrite.
10. Canonical D1 migrations remain exactly `0001`–`0004`.

## Next direction

After Build 127 closes, continue the bounded Admin quality-of-life sequence. Build 128 must first ingest Build 127's later external closure before beginning its own changes.

## Release mechanics

Every new build ingests the previous build's later external closure, proves the exact `dev` head through System/Quality/I.T./Hygiene plus Preview/D1/bindings, then non-force promotes the identical SHA/tree to `main` and requires Production Pages + Live Resource proofs. The candidate never self-records its own later proof.

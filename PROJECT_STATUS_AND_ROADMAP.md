# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 132 — Admin Navigation Context Dock & Responsive Collapse** is the active closure candidate.

Build 131 is the last fully verified Development + Production checkpoint:

- SHA `ba0d027f299678479d1d28abd74ca85ea63c5efd`
- tree `057aa04505e4501516f87350556c3e13f89f986d`
- System Gate `34730852000`
- Current Application Quality `34730852014`
- I.T. Admin Runtime `34730851994`
- Repository Branch Hygiene `34730852019`
- Production Pages Deploy `34730958494`
- Production Live Resource Integrity `34731002747`

The Build 131 closure is recorded by Build 132 startup ingestion, not a Build 131 self-claim.

## Build 132 — Admin Navigation Context Dock & Responsive Collapse

Goal: keep the navigation context added by Builds 129–131 useful without stacking three large cards on every qualifying Admin page, particularly on phones.

Candidate scope:
1. Preserve the existing Related tools, Section position, and Section map components as the source of all navigation content.
2. Compose two or more available context components into one accessible `details` region.
3. Default the context region open on desktop.
4. Default it compact on screens up to 760px.
5. Allow an ephemeral user toggle without localStorage/sessionStorage or server persistence.
6. Adopt context cards that arrive later through existing client-side events/DOM observation.
7. Create no new navigation target or navigation manifest.
8. Fail closed when fewer than two context components are available.
9. Add no network write, D1/R2/binding mutation, provider execution or Production business-data overwrite.
10. Keep canonical D1 migrations exactly `0001`–`0004`.

## Next direction

After Build 132 closes, continue the bounded Admin quality-of-life sequence. Build 133 must first ingest Build 132's later external closure before beginning its own changes.

## Release mechanics

Every new build ingests the previous build's later external closure, proves the exact `dev` head through System/Quality/I.T./Hygiene plus Preview/D1/bindings, then non-force promotes the identical SHA/tree to `main` and requires Production Pages + Live Resource proofs. The candidate never self-records its own later proof.

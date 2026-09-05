# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 57 — Current Authority / Restart Truth Convergence** is authority/read-only convergence. It does not add a canonical migration or change business runtime behavior.

Last fully verified Development is Build 56 — Product Photo Guidance and Packaging Onboarding:
- `dev` `c2bcfb9e10db8df54286fde3e2c4c39ffaf5cc26`
- tree `bb75eac5302c0acba7fea35d4bbed6c41d5d64ab`
- System `33937292286` SUCCESS
- Quality `33937292299` SUCCESS
- I.T. `33937292333` SUCCESS
- Hygiene `33937292280` SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production remains Build 55 — Inventory Intelligence Manufacturer-Link Schema Compatibility:
- `main` `ee42e7838a83def94e858b3d0d6c1a23947e2344`
- tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- Production Pages Deploy `33936229477` SUCCESS.

The Build 55 Production workflow proved the exact fully-green Development tree before work, snapshotted and preserved Production business data, proved canonical Production D1 and foreign-key/isolation integrity, deployed the exact `main` SHA with Production bindings, passed public live smoke acceptance, and preserved promotion proof. Build 56 has not been promoted; Development is intentionally ahead of Production.

## Recent completed work

### Build 55 — Inventory Intelligence schema compatibility

The Inventory Intelligence manufacturer-link query was corrected to follow the canonical one-link-per-inventory-item schema instead of querying the nonexistent `iml.is_current` column. This was a runtime-query fix, not a migration. Build 55 closed green in Development and was deliberately promoted as a Production hotfix.

### Build 56 — Product photo guidance and Packaging onboarding

The Product Editor now exposes existing deterministic image-quality assessments and can score unscored images or deliberately rescore the current set. Human-readable improvement guidance uses the existing Release 448 scoring authority. Product Photography Manager explains the score components and review loop. Packaging Studio now has a resumable 12-step first-time-user walkthrough with Show-me navigation, blocker explanations and Advanced mode. Build 56 added no migration or provider execution.

## Build 57 purpose

Build 57 closes release-truth drift. The canonical pointer, handoff, roadmap, sanity/index/startup guidance and read-only I.T./Reliability/Deployment Preflight projections had remained on Build 53/54 after Builds 55–56 completed. Build 57 converges them to:

- verified Development: Build 56 at `c2bcfb9e10db8df54286fde3e2c4c39ffaf5cc26` / tree `bb75eac5302c0acba7fea35d4bbed6c41d5d64ab`;
- current Production: Build 55 at `ee42e7838a83def94e858b3d0d6c1a23947e2344` / tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`, Production run `33936229477`;
- Build 57 as the current closure candidate awaiting its own post-merge exact-head proof cycle.

The restart-integrity guard is also strengthened so the current pointer must catch up to the newest Release 467 build authority before a build can pass current quality/release proof.

## Roadmap after Build 57

Build 58 remains deliberately unscoped until Build 57 closes externally. At restart, inspect the current application/roadmap and select the highest-value bounded improvement. Do not infer external-lane readiness from source or deployment status.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, CAIP private-media, social OAuth and Cloudflare Access remain separate HOLD/evidence-dependent lanes. Provider execution/publication and automatic Production promotion remain closed.

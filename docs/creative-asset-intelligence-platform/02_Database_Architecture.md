# 02 — Database Architecture

## Core entities

| Table | Role | Authority boundary |
|---|---|---|
| `creative_projects` | CAIP identity and lifecycle for one source project | CAIP only |
| `creative_assets` | Canonical source-media reference and CAIP review metadata | CAIP only; links existing source rows |
| `creative_asset_analyses` | Provider/versioned metadata or future intelligence outputs | CAIP only |
| `creative_asset_recommendations` | Destination/role candidates with rationale | CAIP only |
| `creative_story_evidence` | Source-backed claim ledger | CAIP only |
| `creative_story_segments` | Editable, evidence-linked story spine | CAIP only |
| `creative_policy_decisions` | Readiness/governance signals | CAIP only |
| `creative_intelligence_runs` | Reproducible execution history | CAIP only |
| `creative_project_events` | Audit events | CAIP only |

## Existing tables CAIP reads but never owns

- `products`, `product_images`, `media_assets`, `media_consent_records`, product annotations;
- `content_projects`, `content_project_media`, `content_project_deliverables`, `content_project_events`;
- `content_publications`, `content_publication_events`;
- future job/custom-order/detailing source tables only after their own consent/lifecycle controls exist.

## Key relationships

```text
content_projects (1) ───── (0..1) creative_projects
creative_projects (1) ───── (0..n) creative_assets
creative_assets (1) ─────── (0..n) creative_asset_analyses
creative_projects (1) ───── (0..n) recommendations/evidence/segments/policies/runs/events
creative_assets (0..1) ──── (0..n) recommendations/evidence references
```

## Data invariants

1. A Content Studio project maps to at most one CAIP project.
2. A CAIP asset has a stable `asset_key` inside its CAIP project and carries a source fingerprint.
3. CAIP cannot use a new row to hide an older source-media row; source records remain independently retained.
4. A source safety state of `blocked` always blocks CAIP rights. If source public authority falls back to review, a CAIP `public_allowed` value is downgraded to `needs_review` at sync.
5. CAIP policy records are not legal decisions and do not change source consent.
6. Every automated run and material review action adds a durable event/audit record.
7. Locked evidence/segment wording survives a refresh; the source link and provenance remain visible.

## Schema evolution policy

- Additive migrations only; no destructive table rebuild in an operational release.
- New provider fields should be nullable/additive and versioned.
- Version provider output JSON rather than silently changing its meaning.
- Any planned retention/deletion feature must write a separate, reviewable lifecycle event and must never piggyback on a CAIP sync.

## Build 202 operational records

The following tables are part of the authoritative CAIP schema after Build 202:

- `creative_asset_probe_jobs` — bounded metadata/R2-head work history, inputs, outcomes, retry ceiling, and source fingerprint.
- `creative_asset_technical_observations` — latest technical observation per asset/probe version. This is metadata evidence, not a content-analysis result.
- `creative_derivative_recipes` — immutable source-specific transformation intent with target role/dimensions/format/policy snapshot.
- `creative_asset_derivatives` — planned or future verified output lineage. Blank `output_*` fields plus `not_created` mean no file exists.
- `creative_asset_access_grants` — hash-only opaque secure-review grants, expiry, view limit, session-bound admin identity, and revocation state.
- `creative_asset_access_audit` — safe grant lifecycle/use history without raw token values.
- `creative_provider_profiles` — non-secret disabled capability registry only.
- `creative_execution_budget_controls` — disabled per-capability/project caps in CAD for future provider operations.

New records are additive and foreign-keyed to the existing CAIP project/asset spine. They do not modify the ownership or deletion semantics of `media_assets`, `product_images`, `content_project_media`, or R2 objects.

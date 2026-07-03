# 08 — API, Event, and Manifest Contracts

## Build 201 admin API

### `GET /api/admin/creative-assets`

Authenticated admin route. Returns CAIP project listing and optional project detail when `creative_project_id` is supplied.

### `POST /api/admin/creative-assets`

Supported actions:

| Action | Purpose |
|---|---|
| `sync_project` | Create/refresh CAIP project from one Content Studio project |
| `update_asset` | Update restrictive CAIP rights state, internal status, tags, and note |
| `update_evidence` | Review/lock source-backed evidence wording |
| `update_segment` | Review/lock an evidence-linked story segment |
| `approve_internal_project` | Approve CAIP’s internal record; no public release |
| `manifest` | Download reviewable JSON manifest |

All routes require existing admin authentication and write admin/runtime audit evidence through the existing application audit system plus CAIP project events.

## Events

Build 201 event examples:

- `caip_project_synchronized`
- `creative_asset_reviewed`
- `story_evidence_reviewed`
- `story_segment_reviewed`
- `caip_internal_project_approved`

Future events must include correlation IDs where work spans source ingestion, provider execution, rendering, publishing, or external webhooks.

## Manifest contract

The manifest is a transparent handoff file, not authorization to publish. It contains project identity, policy signals, source pointers, scores, evidence/segment text, and recommendation state. It must state:

```json
{
  "reference_only": true,
  "no_auto_publish": true,
  "no_implicit_rights": true,
  "deterministic_metadata_analysis_only": true
}
```

Future export manifests require additional fields for provider configuration, source access expiry, output checksums, budget/cost, signed approvals, release destination, and idempotency keys.

## Idempotency

- Source synchronizations are upserts keyed by Content Studio project and CAIP asset key.
- Source refreshes preserve locked CAIP editorial text.
- CAIP must not create duplicate projects during product approval/retry.
- External provider/publish adapters must use explicit idempotency keys and must show existing output state before retrying.

## Build 202 API extension

`GET /api/admin/creative-assets?creative_project_id=<id>` includes an `operations` object. It contains technical observations, probe history, recipe/derivative plan state, safe grant metadata, disabled provider registry, budget-control rows, and client-safe templates.

`POST /api/admin/creative-assets` supports `probe_asset`, `create_derivative_plan`, `approve_derivative_plan`, `create_secure_review_link`, and `revoke_secure_review_link`. All must return source-media-unchanged semantics. `create_secure_review_link` is the only action that returns a raw token-derived value; it returns it once as a same-origin URL and must never persist it in D1 or a manifest.

`GET /api/admin/creative-asset-review?token=<opaque>` is an internal media proxy. It requires an authenticated administrator and valid bound grant. It streams the existing R2 object, with no caching and no public redirect.

The Build 202 manifest may include sanitized technical observations, plans, grant expiry/use metadata, and provider registry state. It must never include a raw review token, token hash, provider secret, direct private object credential, or an unverified output URL.

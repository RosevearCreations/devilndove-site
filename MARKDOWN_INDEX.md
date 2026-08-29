# Devil n Dove — Markdown Index

## Current authority — Release 459
To reduce stale/conflicting handoffs, use this order:

1. **`development-release.json`** — machine-readable current release, exact Development infrastructure, release history and queue.
2. **`AI_HANDOFF.md`** — concise human/AI startup handoff and safety boundary.
3. **`PROJECT_STATUS_AND_ROADMAP.md`** — active automated roadmap and later manual boundary.
4. **`docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`** — exact Cloudflare/D1/R2 connection and mutation rules.
5. **`docs/operations/RELEASE_459_RUNTIME_PROVIDER_AUTHORITY.md`** — Release 459 implementation, D1/provider setup and acceptance details.
6. **`SANITY_HEALTH_CHECK.md`** — current sanity checklist.

These are the canonical current documents for **Release 459 — Authenticated Development Acceptance & Provider Setup Authority**.

## Historical/supporting Markdown
Older Release/Build documents remain useful for provenance, migrations and subsystem design, but they do not override the current files above.

Rules:
- do not infer current release state from an old Build/Release file;
- do not replay a historical migration because its document still exists;
- do not treat an old provider blocker as current if the Release 459 I.T. readiness authority has superseded it;
- preserve old exact evidence when a carried-forward gate depends on it;
- prefer updating one of the canonical files instead of creating another general-purpose handoff/roadmap Markdown.

## Current exact boundaries
- `dev` → `devilndove-site-dev` is Development.
- The Pages Production deployment of `devilndove-site-dev` is the Development application.
- Separate live `main` / `devilndove-site` remains closed.
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- `account_id` never belongs in `wrangler.toml`.
- Provider secret/token values never belong in D1/source/Markdown/browser output.
- Provider execution/publication remains closed.

## Last completed exact checkpoint
Release 458:
- SHA `66b48f0445c74247972e14fbdaa0e215e3792fb7`
- Source Gate `33265953249`
- System Gate `33265953255`
- Pages check `99135984965`

Release 459 is the active current release.

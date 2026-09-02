# Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics

## Purpose

Build 10 turns `/admin/it/` into the current read-only operational first stop. The goal is not to add another diagnostics silo; it is to make the current release, Development ancestry, platform readiness, administrator authority, external HOLDs and next corrective action understandable from one place.

## Exact predecessor

Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction is the exact proven predecessor:

- merged `dev`: `d8a9ffba03f980b9632643d91d9aa69b25bd94fd`
- tree: `949f2523d31e0f47ed1e19ff7655de2762fbc1df`
- System Gate `33633043297` — SUCCESS
- Build 9 Proof `33633043229` — SUCCESS

## Runtime design

Build 10 adds `/api/admin/it-operations-control-tower`.

The endpoint deliberately wraps the existing `/api/admin/it-control-tower` read-only readiness engine. Existing subsystem logic remains the source for D1, root-admin/module, R2 binding, Development configuration, provider configuration, external evidence and deployment-ancestry findings.

Build 10 adds operator context on top:

- Release 467 Build 10 current authority;
- exact last-green Build 9 evidence;
- canonical Development Pages/D1/R2 identifiers;
- runtime SHA/host when trusted runtime ancestry is available;
- headline root-admin/profile/module/D1 metrics;
- severity-sorted recovery actions;
- explicit external acceptance policy states;
- explicit classification of the Release 466 middleware header as inherited runtime compatibility.

## Recovery queue

The consolidated endpoint flattens all non-green subsystem findings into one deduplicated queue.

`red` findings are **BLOCKING** and sort first. `amber` findings are **ATTENTION** and follow. Every item carries:

- subsystem;
- state/priority;
- stable code;
- label and detail;
- correction text;
- corrective workspace link.

The queue is read-only. It does not invoke repair endpoints and does not change permissions, data, schema, provider state or infrastructure.

## Authority split

Current operator/restart authority is Release 467 Build 10 through `current-development-authority.json`.

Two Release 466 compatibility surfaces intentionally remain:

1. `development-release.json` — `INHERITED_REGRESSION_COMPATIBILITY`;
2. middleware runtime release header value `466` — `INHERITED_RUNTIME_COMPATIBILITY`.

Release 467 Build 8 — Authority Convergence and Restart Safety established the current-vs-compatibility rule. Build 10 exposes that distinction in the I.T. page rather than hiding it.

## External acceptance

Build 10 displays, but does not execute or promote, the existing bounded external lanes:

- Cloudflare Access service token — `HOLD_EXTERNAL` / Build 6;
- Stripe Development — `HOLD_EXTERNAL` / Build 7;
- PayPal sandbox — `HOLD_EXTERNAL` / Build 7;
- Social/OAuth — `HOLD_EXTERNAL` / Build 7;
- CAIP private media — use fresh Build 7 runtime evidence.

A source-green or runtime-green Build 10 cannot turn those policy HOLDs into accepted state.

## Schema and environment safety

Build 10 adds no D1 migration. Canonical migrations remain exactly `0001`–`0004`.

The Build 10 endpoint authorizes:

- schema change: NONE;
- request-time DDL: NONE;
- D1 mutation: NONE;
- R2 mutation: NONE;
- provider/payment/OAuth execution: NONE;
- provider publication: NONE;
- Cloudflare Access policy mutation: NONE;
- `main` mutation: NONE;
- Production contact/mutation: NONE;
- secret-value emission: NONE.

## Proof

Source proof is owned by:

- `scripts/release467_build10_gate.py`;
- `.github/workflows/release467-build10-proof.yml`.

The proof preserves Build 9 authority, validates the new endpoint/UI contract, checks current Build 10 pointer/manifest evidence, confirms canonical migrations remain unchanged and fails closed on files outside the bounded Build 10 scope.

After feature proof and pull-request gates are green, merge to `dev` and require the exact merged SHA to pass the canonical System Gate and Development deployment/smoke acceptance before calling Build 10 Development-green.

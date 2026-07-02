# 05 — Governance, Rights, Privacy, and Claims

## Rights ladder

| State | Meaning | CAIP action |
|---|---|---|
| `blocked` | Source cannot be used in CAIP/public outputs | Cannot be recommended for public use; retained only as an internal reference if source exists |
| `internal_only` | Useful for internal planning but not public release | Can support private planning, never public candidates |
| `needs_review` | Source/rights are incomplete or not yet approved | Visible for review, not a public-use pass |
| `public_allowed` | Source record says public use is allowed and owner has preserved/confirmed it in CAIP | Still requires destination-specific approval in Content Studio/Release Board |

CAIP cannot move an asset from `needs_review` to `public_allowed` unless source safety is already `public_allowed`. It cannot override source `blocked`.

## Privacy rules

- Future detailing/client work must have an explicit separate consent source. A product-level internal review flag is not customer/media consent.
- Never infer public permission from a person appearing in media, a public URL, an email, a prior post, or an uploaded file name.
- Avoid collecting facial/biometric/personality analysis in CAIP. Future vision providers must be configured to minimize data and have a clear review/retention basis.
- Do not send private source URLs or client media to an external provider until a specific adapter, access control, privacy review, and contract exist.

## Claims governance

A statement can be used publicly only when it is factual, source-backed, reviewed, visible on the eventual page/output, and consistent with the actual selected media. CAIP does not convert a product description into proof of performance, material purity, medical claim, craftsmanship grade, value, availability, delivery, stock, or warranty.

## AI-generated or altered media

Future CAIP provider adapters must mark generated/meaningfully altered visual or audio outputs, preserve original/derivative lineage, and route disclosure obligations through channel-specific policies. YouTube’s current disclosure guidance is listed in `README.md`; CAIP must never hide an altered-media flag in a provider payload.

## Audit and change expectations

Any rights change, evidence approval/rejection, segment approval, policy override, provider run, render request, public release handoff, or deletion/retention action must produce an actor, timestamp, reason/evidence, before/after meaningful state, and correlation/project ID.

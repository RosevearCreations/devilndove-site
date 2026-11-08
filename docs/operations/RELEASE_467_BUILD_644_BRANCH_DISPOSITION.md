# Build 644 — Diverged Branch Retirement Review

Checked against the Build 643 main tree (`66cd3774077b6702dd77f8e6bfd0675f4ea20661`) and the then-current `dev` state. These are *branch retirement decisions*, not active CI, schema or business-data prerequisites.

| Remote branch | Inspected head | Unique history | Why we **must not merge its snapshot** |
| --- | --- | --- | --- |
| `codex/ql364-source-health-main` | `87cfff6c835a19596cbc8b6eb45ec17dac7ed5c6` | Two commits ahead; 54 behind main at review | Its QL-364 source-health handler is **older** than current main: lacks canonical HTTPS-origin approval and actual-request-origin matching, and its tests omit subsequent denial cases. Current `ql336-owned-shell.mjs` is identical; current docs and tests include later QL-365D hardening. Merging the old code would *weaken* signed-source scope checks. |
| `production-d1-0026-proof` | `66cb83f752a4a3cd7393ef5edf339b6f826612f7` | One commit ahead; roughly 3,380 behind main | Its canonical manifest stops at migration **0026** while current main has **50** forward migrations. The only different version-26 metadata is a speculative extra cost-allocation description; rewriting applied migration provenance would alter the manifest digest and harm current integrity checks. |

**Disposition:** both are technically superseded; **do not merge** either into `dev` or `main`. Their commit SHAs and reasoned comparison are recorded above before any prospective branch deletion. Do not modify migration 0026 bytes or production D1 to resolve a stale branch.

**Remote deletion status:** GitHub's installed connector exposes create/move ref but no delete-ref capability; the local `git push --dry-run --delete` confirmed there is no authenticated CLI push credential (`could not read Username`). Deletion therefore requires an authorized GitHub branch-deletion interface or credentialed operator. Branches remain until that capability is supplied; no branch has been misleadingly reported deleted. Preserve `dev` and `main` and verify the exact two branch SHAs again before deletion.

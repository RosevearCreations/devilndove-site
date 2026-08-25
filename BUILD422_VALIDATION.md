# Build 422 Validation

## Status

**READY FOR LOCAL VALIDATION / PRODUCTION WRITES CLOSED**

Build 422 validation is local-only. It consumes the owner-generated Build 421 evidence and non-executing manifest, generates a local blocker mapping, and verifies twenty release-fixture invariants.

It does not contact Cloudflare, D1, R2, payment providers, or deployment APIs.

## Run

From `dev`:

```bash
python -m py_compile \
  scripts/build422_blocker_mapper.py \
  scripts/build422_release_fixture_catalog.py \
  scripts/build422_blocker_mapper_regression.py \
  scripts/build422_twenty_item_local_release_fixture_gate.py

python scripts/build422_blocker_mapper_regression.py
python scripts/build422_blocker_mapper.py
python scripts/build422_twenty_item_local_release_fixture_gate.py
```

The Build 421 files expected in the local repository root are:

```text
build421_production_evidence.txt
build421_non_executing_production_migration_manifest.local.md
```

The blocker mapper creates:

```text
build422_blocker_mapping.local.md
```

That local file records the exact Build 421 blocker label/evidence and remediation family. It is not an executable migration artifact.

## Expected result

```text
BUILD 422 BLOCKER MAPPER REGRESSION: PASS
...
BUILD 422 BLOCKER MAPPER: PASS
Build 421 evidence items parsed: 20
Rollout blockers parsed: 1
...
BUILD 422 TWENTY-ITEM LOCAL RELEASE FIXTURE GATE: PASS (20/20)
No Cloudflare resource was contacted.
No database or R2 mutation was executed.
Executable Production helper generated: NO
PRODUCTION PROMOTION: CLOSED
```

If a local gate fails, preserve the output. Do not create or execute a Production migration helper as a workaround.

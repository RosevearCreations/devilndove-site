# Devil n Dove Source-Control Branching

## Permanent branches

```text
main  = retained Production/legacy release line
dev   = active modularization and Development integration line
```

As verified during Build 319, `dev` contains `main` and is hundreds of commits ahead with no commits missing from `main`.

## Application modules are not Git branches

The authoritative application structure remains:

```text
DEVIL N DOVE APPLICATION CORE
  ├─ COMMERCE & OPERATIONS
  ├─ CREATIVE & PRODUCTION
  └─ BUSINESS & ADMINISTRATION
```

These are runtime/application boundaries inside one integrated repository. Do not create permanent branches named for these modules.

## Temporary build branches

A temporary build/candidate branch may be used only to isolate risky source changes before fast-forward integration into `dev`.

Rules:

1. branch from current `dev`;
2. keep one bounded build/change set;
3. verify it is fast-forward compatible and has no commits absent from the intended integration history;
4. integrate into `dev` only after boundary review;
5. retire/delete the temporary branch after integration when tooling/permissions permit;
6. never treat a build branch as deployment proof.

## Historical branch cleanup

The repository still contains historical candidate refs:

```text
build291-candidate
build292-candidate
build293-candidate
build294-candidate
```

Previous comparison proved each is fully contained in `dev` (`behind_by=0` relative to `dev`). They are branch-retirement candidates, not active development lines.

Build 317 also used a temporary checkpoint ref:

```text
build317-accounting-writeoffs
```

Its source was fast-forward integrated into `dev`. It should likewise be retired when branch-deletion tooling is available or through GitHub branch management.

## Promotion rule

Development work lands on `dev`. Real Production remains frozen until a deliberate promotion workflow moves an explicitly validated Development state to the Production/main line.

Do not merge or force-update `main` merely because `dev` is ahead.

# Build 299 Validation — Packaging Print Source Consistency

Status: **NOT COMPLETE — browser controller rolled back by Build 300 stabilization**

Base: `3a19ebc263a206acd22e6490327ffa32567e4a8a` (completed Build 298 parity)
Candidate head before stabilization: `e5be1b4adcb2a6f335d1aabbe90ca6b9234a2f45`

## What passed

The Build 299 local regression passed. In Development the controller loaded successfully and reported:

```text
build                                  299
state                                  active
defaultSource                          project-draft
lastPrintSource                        project-draft
savedVersionPrintCount                 0
lastVersionId                          0
lastVersionStatus                      0
lastVersionError                       ""
artifactPath                           /api/admin/packaging-version-artifact
savedVersionsImmutable                 true
historicalVersionMustBeExplicitlySelected true
```

The tested project had no saved review versions, so the historical-version artifact path could not be live-proven.

## Regression observed during live validation

During the same Development validation sequence, owner testing found that Packaging details/Preview still appeared stale and then changed claims appeared not to persist after **Save project**.

Because Build 298 Save Project had previously been live-proven, Build 299 was not signed off. Forward compatibility-retirement work was stopped immediately.

## Rollback decision

Build 300 rolled back the Build 299 **browser print-source controller** from the live Packaging page and restored the proven Build 298 editor/native-client runtime as the active baseline.

The following Build 299 files may remain in the repository for audit/history, but are dormant from normal Packaging page operation:

- `public/js/admin-packaging-print-source-v299.js`
- `functions/api/admin/packaging-version-artifact.js`
- Build 299 architecture/validation/regression files

The saved-version artifact endpoint is not used by the normal Packaging page after the rollback.

## Build 300 stabilization gate

Build 300 now verifies every **Save project** success by performing a fresh native read-back and comparing core fields plus complete structured claims against what the editor sent. It also stabilizes the derived Product / variant -> English identity preview relationship without overriding an explicitly customized identity.

Build 299 remains **NOT COMPLETE** until a future deliberate re-evaluation after Build 300 stabilization is fully green. Do not reload or reactivate the Build 299 browser controller during stabilization.

## Preserved safety boundary

The rollback and Build 300 stabilization preserve:

- mature editor Build 298 source;
- Build 298 native read/write client implementation;
- Build 297 compatibility defenses;
- Build 293/286 Packaging read authority;
- Build 292/291 Packaging write authority;
- Build 294 retired-route tombstone;
- no SQL/schema changes;
- no Cloudflare binding/config changes;
- no R2 changes;
- no real Production contact.

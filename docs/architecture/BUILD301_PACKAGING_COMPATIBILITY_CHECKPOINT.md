# Build 301 — Packaging Compatibility Checkpoint

## Purpose

Build 301 makes the Packaging browser runtime easier to reason about without rewriting proven implementation layers.

The owner requested that Packaging advance to one current compatibility conversation. Build 301 therefore becomes the single live browser compatibility identity while preserving earlier build numbers only as implementation provenance.

This is intentionally different from copying every proven file to a new filename and changing its internal build constant. That would create unnecessary regression risk and would obscure which implementation was actually live-proven.

## Build 301 compatibility contract

The Packaging page gains:

```text
public/js/admin-packaging-compatibility-v301.js
```

and exposes:

```js
globalThis.DDPackagingCompatibility
```

with:

```text
build = 301
compatibilityCheckpoint = true
singleConversationBuild = 301
```

The Build 301 checkpoint is diagnostic/orchestration metadata only. It performs no API request and installs no network interception.

## Proven implementation provenance under Build 301

Build 301 reports these implementation authorities explicitly:

```text
startup gate                 297
client compatibility transport 297
native browser client        298
save/Preview stabilization   300
mature editor implementation 298
native read gateway          293
native read implementation   286
native write gateway         292
native write service         291
```

These older numbers are not separate current workstreams. They are provenance for the one Build 301 compatibility checkpoint.

## Live page order

After activation the Packaging page remains ordered as:

```text
Build 297 startup gate
-> core admin/runtime bootstrap
-> Build 297 compatibility transport
-> Build 298 native client
-> Build 300 save/Preview stabilizer
-> Build 301 compatibility checkpoint
-> mature Build 298 editor
```

Build 301 sits after the complete proven native/stabilized client stack so it can report one consolidated state before the mature editor begins normal reads and writes.

## Why the older files remain loaded

Build 298 still has a real readiness dependency on the Build 297 client transport status/event. Build 300 then wraps the Build 298 client to verify Save Project through fresh D1 read-back and stabilize the fitted Preview.

Therefore Build 301 does not pretend those dependencies have disappeared. It makes them explicit and gives us one top-level compatibility identity. Any future physical retirement of Build 297 must be a separate dependency-removal build with its own live proof.

## Build 300 historical pin

Completed Build 300 is pinned at:

```text
21b01cc34ef734f581da22a7f0d3c43ec10607c0
```

`scripts/build300_packaging_stabilization_test.py` now reads its protected runtime/page evidence from that historical commit instead of following future HEAD.

## Safety boundary

Build 301 does not modify:

- Build 297 startup gate implementation;
- Build 297 client-transport launcher/module;
- Build 298 native-client launcher/module;
- Build 300 save/Preview stabilizer;
- mature Packaging editor;
- Build 293/286 read authority;
- Build 292/291 write authority;
- Build 294 retired-route tombstone;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

The rolled-back Build 299 browser print controller remains unloaded.

## Completion gate

Build 301 is complete only when Development proves:

1. local Build 301 regression passes;
2. Development deployment source is the Build 301 activation commit;
3. Packaging projects load normally;
4. `DDPackagingCompatibility.getStatus()` reports `build = 301` and `state = active`;
5. native read status is 200;
6. Save Project still verifies successfully through Build 300;
7. fitted Preview still matches the claim editor;
8. compatibility gate replay/block counters remain zero during normal native traffic;
9. write boundary remains Build 292 -> Build 291;
10. Production is untouched.

Physical compatibility retirement is explicitly outside Build 301.

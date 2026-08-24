# Build 301 Changed Files

Base: `21b01cc34ef734f581da22a7f0d3c43ec10607c0` (completed Build 300 documentation head)

Expected final Build 301 boundary:

1. `AI_CONTEXT.md`
2. `BUILD301_CHANGED_FILES.md`
3. `BUILD301_VALIDATION.md`
4. `admin/packaging-studio/index.html`
5. `docs/architecture/BUILD301_PACKAGING_COMPATIBILITY_CHECKPOINT.md`
6. `public/js/admin-packaging-compatibility-v301.js`
7. `scripts/apply_build301_packaging_compatibility_checkpoint.py`
8. `scripts/build300_packaging_stabilization_test.py`
9. `scripts/build301_packaging_compatibility_checkpoint_test.py`

Runtime effect:

- establish Build 301 as the single live Packaging browser compatibility checkpoint;
- expose one `DDPackagingCompatibility` status surface for current diagnostics;
- keep Build 297 startup/client-transport, Build 298 native client/editor, and Build 300 stabilization files unchanged as proven implementation provenance;
- keep Build 293/286 read authority and Build 292/291 write authority unchanged;
- pin completed Build 300 historically at `21b01cc34ef734f581da22a7f0d3c43ec10607c0`;
- do not reactivate the rolled-back Build 299 browser controller.

Build 301 adds no new network transport and makes no SQL/schema, Cloudflare binding/config, R2, or real Production change.

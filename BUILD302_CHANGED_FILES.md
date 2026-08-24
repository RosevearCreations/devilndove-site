# Build 302 Changed Files

Base: `a81f8d6af0004d847174fa27043c11e159ca3d10` (completed Build 301 compatibility baseline/handoff head)

Expected net Build 302 boundary:

1. `AI_CONTEXT.md`
2. `BUILD302_CHANGED_FILES.md`
3. `BUILD302_VALIDATION.md`
4. `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
5. `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
6. `public/js/core/dd-application-module-groups.mjs`
7. `scripts/build301_packaging_compatibility_checkpoint_test.py`
8. `scripts/build302_core_three_module_architecture_test.py`

Runtime effect:

- no live Packaging runtime change;
- no current route-resolution change;
- no current domain runtime entry change;
- add a passive Build 302 machine-readable Core + three-module target catalog;
- normalize the authoritative architecture documentation;
- pin completed Build 301 historically.

Protected runtime files include the Build 301 Packaging page/facade, Build 300 stabilizer, Build 298 native client/editor, Build 297 compatibility layers, current Core registry/runtime/domain definitions, and Packaging server read/write authorities.

No SQL/schema, Cloudflare binding/config, R2, or real Production change is allowed in this boundary.

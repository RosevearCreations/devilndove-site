# Devil n Dove AI Context — Development Build 282 Pointer

Read `AI_HANDOFF.md` for the retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the Development architecture introduced after the Build 280 production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md` and then `docs/architecture/BUILD282_ARCHITECTURE_LOCK.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

Build 281 established a passive module registry and ownership inventory without changing runtime behavior. Build 282 locks the taxonomy by separating `CORE`, internal `PLATFORM`, `ADMIN`, `PUBLIC`, and the business modules `CATALOG`, `INVENTORY`, `OPERATIONS`, `CREATIVE`, `CAIP`, `PACKAGING`, `CONTENT`, `MARKETING`, and `ACCOUNTING`.

Build 282 also connects the registry to existing Admin JavaScript in **shadow mode only**. It can resolve a verified administrator's current route and annotate Admin links with module ownership, but every module runtime `entry` remains `null`; it performs no API/D1 fetch, starts no poller/timer, changes no route, and activates no module. No Build 282 D1 migration or Cloudflare binding/configuration change exists.

The first declared cross-module contracts document business authority without moving tables. Packaging consumes Inventory identity, Catalog identity and approved Content media; Creative Process owns its project facts but posts/reverses physical inventory use through Inventory authority; Content consumes reviewed CAIP evidence; Operations may read bounded financial state through Accounting; Admin may read bounded runtime/release health through Platform.

Expected next architectural gate: Build 283 converts Packaging into the first actively loaded UI module while preserving its existing URL/API behavior and using narrow Inventory/Content/Catalog contracts instead of duplicating those authorities.

Retained pre-modular rules still apply: Build 276 remains the latest Packaging schema boundary, Build 274 Creative Process, Build 269 CAIP; Build 279 runtime-efficiency rules remain important. Do not infer that modular ownership creates separate databases or permits bypassing server-side authorization.

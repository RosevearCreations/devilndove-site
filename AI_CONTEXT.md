# Devil n Dove AI Context — Development Build 281 Pointer

Production is intentionally frozen on **Build 280** while the Development application begins a new modular architecture line. The Development baseline was created from the same working Build 280 application and uses isolated Development Pages/D1/R2 resources.

Read `AI_HANDOFF.md` first and `PROJECT_STATUS_AND_ROADMAP.md` second for existing business/domain authority. For the Development architecture direction introduced after the Production split, also read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md` and `docs/architecture/MODULE_OWNERSHIP_RULES.md`.

Build 281 is a **passive modular-foundation build**. It adds the module registry/lifecycle contract, initial domain definitions, ownership rules and local inventory/validation tooling. It does not wire existing pages into the loader, does not change D1 schema, does not change Cloudflare bindings, and does not modify Production.

The target platform remains one Devil n Dove application with one shared data model and explicit independently loadable domain modules: Public, Catalog, Inventory, Creative Projects, CAIP, Packaging, Content, Marketing, Accounting and Administration. App Core is limited to genuine cross-cutting infrastructure.

The mandatory runtime rule is two-gate activation: a module must be authorized for the current identity **and** actually required by the active route/workflow. Hidden UI is never authorization; server-side protected APIs remain authoritative. Inactive modules must not start idle polling or expensive background work.

Build 281 intentionally leaves every module runtime entry point unconnected. Build 280 behavior is the compatibility baseline. Future extraction must be incremental, tested in Development, and reversible in Git.
